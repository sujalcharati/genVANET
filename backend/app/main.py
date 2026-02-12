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
    total_co2 = 0.0
    for step in steps:
        for v in step["vehicles"]:
            all_vehicles.add(v["id"])
            total_co2 += v["co2_emission"]

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
            "total_co2_mg": round(total_co2, 2),
        },
        "steps": steps,
    }
