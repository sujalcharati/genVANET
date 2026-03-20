"""
FastAPI backend for genVANET.

Endpoints:
    POST /simulate          - Run a full simulation with scenario params, return all data
    GET  /simulate/options   - Return available scenario options for the frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .traci.scenario import generate_scenario, DENSITY_CONFIG, MIX_CONFIG, PATTERN_FN
from .traci.main import run_full_simulation
import time

from .ai_model import generate_prediction, _calc_route_stats, _pick_best_route
from .groq_model import generate_groq_prediction
from .validator import validate_prediction

app = FastAPI(title="genVANET API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScenarioRequest(BaseModel):
    density: str = "medium"        # low | medium | high | rush_hour
    vehicle_mix: str = "mixed"     # cars_only | mixed | heavy_commercial
    pattern: str = "uniform"       # uniform | rush_hour | random
    seed: int = 42


@app.get("/simulate/options")
def get_options():
    """Return available scenario options for the frontend dropdown."""
    return {
        "density": list(DENSITY_CONFIG.keys()),
        "vehicle_mix": list(MIX_CONFIG.keys()),
        "pattern": list(PATTERN_FN.keys()),
    }


@app.post("/simulate")
def run_simulation(req: ScenarioRequest):
    """
    Generate a scenario from params, run SUMO via TraCI, return results.

    This is the main endpoint your frontend will call.
    """
    # Validate inputs
    if req.density not in DENSITY_CONFIG:
        raise HTTPException(400, f"Invalid density. Options: {list(DENSITY_CONFIG.keys())}")
    if req.vehicle_mix not in MIX_CONFIG:
        raise HTTPException(400, f"Invalid vehicle_mix. Options: {list(MIX_CONFIG.keys())}")
    if req.pattern not in PATTERN_FN:
        raise HTTPException(400, f"Invalid pattern. Options: {list(PATTERN_FN.keys())}")

    # Generate route XML from scenario params
    route_xml, duration = generate_scenario(
        density=req.density,
        vehicle_mix=req.vehicle_mix,
        pattern=req.pattern,
        seed=req.seed,
    )

    # Run SUMO simulation and collect per-step data
    steps = run_full_simulation(route_xml=route_xml, duration=duration)

    # Build summary
    all_vehicles = set()
    for step in steps:
        for v in step["vehicles"]:
            all_vehicles.add(v["id"])

    return {
        "scenario": {
            "density": req.density,
            "vehicle_mix": req.vehicle_mix,
            "pattern": req.pattern,
            "seed": req.seed,
        },
        "summary": {
            "total_steps": len(steps),
            "total_vehicles": len(all_vehicles),
        },
        "steps": steps,
    }


class PredictRequest(BaseModel):
    density: str = "medium"
    vehicle_mix: str = "mixed"
    pattern: str = "uniform"
    seed: int = 42
    vehicle_type: str = "car"         # car | ambulance
    objective: str = "fast"           # fast | safe



@app.post("/predict")
def predict(req: PredictRequest):
    """
    Run simulation -> collect traffic data -> send to BOTH models -> compare -> return.
    """
    if req.density not in DENSITY_CONFIG:
        raise HTTPException(400, f"Invalid density. Options: {list(DENSITY_CONFIG.keys())}")
    if req.vehicle_type not in ("car", "ambulance"):
        raise HTTPException(400, "vehicle_type must be 'car' or 'ambulance'")
    if req.objective not in ("fast", "safe"):
        raise HTTPException(400, "objective must be 'fast' or 'safe'")

    # Step 1: Run SUMO simulation (once, shared by both models)
    route_xml, duration = generate_scenario(
        density=req.density,
        vehicle_mix=req.vehicle_mix,
        pattern=req.pattern,
        seed=req.seed,
    )
    steps = run_full_simulation(route_xml=route_xml, duration=duration)

    if not steps:
        raise HTTPException(500, "Simulation produced no data")

    peak_step = max(steps, key=lambda s: s["stats"]["active_vehicles"])

    # Step 2: Get analytical best route (ground truth for accuracy check)
    route_stats = _calc_route_stats(peak_step.get("edges", []))
    analytical_best = _pick_best_route(route_stats, req.objective)

    # Step 3: Query Model A - TinyLlama (Ollama, local)
    t0 = time.time()
    pred_a = generate_prediction(
        traffic_data=peak_step,
        vehicle_type=req.vehicle_type,
        objective=req.objective,
    )
    time_a = round(time.time() - t0, 2)

    # Step 4: Query Model B - Llama 3.1 8B (Groq API, cloud)
    t0 = time.time()
    pred_b = generate_groq_prediction(
        traffic_data=peak_step,
        vehicle_type=req.vehicle_type,
        objective=req.objective,
    )
    time_b = round(time.time() - t0, 2)

    # Step 5: Validate both
    val_a = validate_prediction(pred_a)
    val_b = validate_prediction(pred_b)

    # Step 6: Build comparison metrics
    # Normalize recommended route for comparison
    route_a = val_a["prediction"].get("recommended_route", "")
    route_b = val_b["prediction"].get("recommended_route", "")
    accurate_a = route_a == analytical_best
    accurate_b = route_b == analytical_best

    delay_a = val_a["prediction"].get("expected_delay", 0)
    delay_b = val_b["prediction"].get("expected_delay", 0)

    comparison = {
        "route_agreement": route_a == route_b,
        "analytical_best": analytical_best,
        "model_a": {
            "name": "TinyLlama 1.1B",
            "type": "Local (Ollama)",
            "route": route_a,
            "delay": delay_a,
            "response_time": time_a,
            "accurate": accurate_a,
        },
        "model_b": {
            "name": "Llama 3.1 8B",
            "type": "Cloud (Groq API)",
            "route": route_b,
            "delay": delay_b,
            "response_time": time_b,
            "accurate": accurate_b,
        },
    }

    return {
        "scenario": {
            "density": req.density,
            "vehicle_mix": req.vehicle_mix,
            "pattern": req.pattern,
            "vehicle_type": req.vehicle_type,
            "objective": req.objective,
        },
        "traffic_snapshot": {
            "time": peak_step["time"],
            "active_vehicles": peak_step["stats"]["active_vehicles"],
            "edges": peak_step["edges"][:10],
        },
        "ai_prediction": val_a["prediction"],
        "validation": {
            "is_valid": val_a["is_valid"],
            "errors": val_a["errors"],
        },
        "groq_prediction": val_b["prediction"],
        "groq_validation": {
            "is_valid": val_b["is_valid"],
            "errors": val_b["errors"],
        },
        "comparison": comparison,
    }
