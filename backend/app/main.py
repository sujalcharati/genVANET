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
from .ai_model import generate_prediction
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
    Run simulation → collect traffic data → send to AI → validate → return.

    This is the main endpoint that ties SUMO + AI + validation together.
    """
    # Validate inputs
    if req.density not in DENSITY_CONFIG:
        raise HTTPException(400, f"Invalid density. Options: {list(DENSITY_CONFIG.keys())}")
    if req.vehicle_type not in ("car", "ambulance"):
        raise HTTPException(400, "vehicle_type must be 'car' or 'ambulance'")
    if req.objective not in ("fast", "safe"):
        raise HTTPException(400, "objective must be 'fast' or 'safe'")

    # Step 1: Run SUMO simulation
    route_xml, duration = generate_scenario(
        density=req.density,
        vehicle_mix=req.vehicle_mix,
        pattern=req.pattern,
        seed=req.seed,
    )
    steps = run_full_simulation(route_xml=route_xml, duration=duration)

    if not steps:
        raise HTTPException(500, "Simulation produced no data")

    # Step 2: Pick the step with peak traffic (most vehicles) for AI analysis
    peak_step = max(steps, key=lambda s: s["stats"]["active_vehicles"])

    # Step 3: Send traffic data to AI model
    ai_prediction = generate_prediction(
        traffic_data=peak_step,
        vehicle_type=req.vehicle_type,
        objective=req.objective,
    )

    # Step 4: Validate AI output
    validated = validate_prediction(ai_prediction)

    # Step 5: Return everything
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
        "ai_prediction": validated["prediction"],
        "validation": {
            "is_valid": validated["is_valid"],
            "errors": validated["errors"],
        },
    }
