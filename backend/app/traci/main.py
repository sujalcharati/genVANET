"""
TraCI simulation manager.

Handles starting/stopping SUMO and collecting per-step data.
Can run with either the static .rou.xml or a dynamically generated scenario.
"""

import os
import tempfile
import traci

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SUMO_CFG = os.path.join(BASE_DIR, "genvanet.sumocfg")
NET_FILE = os.path.join(BASE_DIR, "genvanet.net.xml")

# Track temp file so we can clean up
_temp_route_file = None


def start_simulation(gui=False, route_xml=None, duration=300):
    """
    Start SUMO via TraCI.

    Args:
        gui:       If True, open sumo-gui instead of headless sumo.
        route_xml: If provided, write this XML string to a temp .rou.xml
                   and use it instead of the default route file.
        duration:  Simulation end time in seconds.
    """
    global _temp_route_file

    sumo_binary = "sumo-gui" if gui else "sumo"
    cmd = [sumo_binary, "--net-file", NET_FILE, "--start"]

    if route_xml:
        # Write generated routes to a temp file
        _temp_route_file = tempfile.NamedTemporaryFile(
            mode="w", suffix=".rou.xml", dir=BASE_DIR, delete=False
        )
        _temp_route_file.write(route_xml)
        _temp_route_file.close()
        cmd += ["--route-files", _temp_route_file.name]
    else:
        # Fall back to the static route file via sumocfg
        cmd = [sumo_binary, "-c", SUMO_CFG, "--start"]

    cmd += ["--end", str(duration)]
    traci.start(cmd)


def get_vehicle_data():
    """Get current data for all active vehicles."""
    vehicles = []
    for vid in traci.vehicle.getIDList():
        x, y = traci.vehicle.getPosition(vid)
        vehicles.append({
            "id": vid,
            "speed": round(traci.vehicle.getSpeed(vid), 2),
            "position": {"x": round(x, 2), "y": round(y, 2)},
            "road": traci.vehicle.getRoadID(vid),
            "lane_position": round(traci.vehicle.getLanePosition(vid), 2),
            "route": list(traci.vehicle.getRoute(vid)),
            "type": traci.vehicle.getTypeID(vid),
        })
    return vehicles


def get_edge_data():
    """Get traffic stats for all non-internal edges."""
    edges = []
    for eid in traci.edge.getIDList():
        if eid.startswith(":"):
            continue
        edges.append({
            "id": eid,
            "vehicle_count": traci.edge.getLastStepVehicleNumber(eid),
            "mean_speed": round(traci.edge.getLastStepMeanSpeed(eid), 2),
            "occupancy": round(traci.edge.getLastStepOccupancy(eid), 2),
            "waiting_time": round(traci.edge.getWaitingTime(eid), 2),
        })
    return edges


def get_traffic_light_data():
    """Get current state of all traffic lights."""
    tls = []
    for tlid in traci.trafficlight.getIDList():
        tls.append({
            "id": tlid,
            "phase": traci.trafficlight.getPhase(tlid),
            "state": traci.trafficlight.getRedYellowGreenState(tlid),
            "program": traci.trafficlight.getProgram(tlid),
        })
    return tls


def step_and_collect():
    """Advance one simulation step and return all collected data."""
    traci.simulationStep()
    return {
        "time": traci.simulation.getTime(),
        "vehicles": get_vehicle_data(),
        "edges": get_edge_data(),
        "traffic_lights": get_traffic_light_data(),
        "stats": {
            "active_vehicles": traci.vehicle.getIDCount(),
            "departed": traci.simulation.getDepartedNumber(),
            "arrived": traci.simulation.getArrivedNumber(),
        },
    }


def run_full_simulation(route_xml=None, duration=300):
    """
    Run the entire simulation and collect data from every step.

    Returns a list of per-step snapshots (only steps with active vehicles).
    """
    start_simulation(route_xml=route_xml, duration=duration)
    results = []

    try:
        for _ in range(duration):
            data = step_and_collect()
            if data["stats"]["active_vehicles"] > 0:
                results.append(data)
            # Stop early if all vehicles have arrived and none are active
            if data["stats"]["active_vehicles"] == 0 and data["time"] > 10:
                break
    finally:
        stop_simulation()

    return results


def stop_simulation():
    """Close TraCI and clean up temp files."""
    global _temp_route_file
    traci.close()
    if _temp_route_file and os.path.exists(_temp_route_file.name):
        os.unlink(_temp_route_file.name)
        _temp_route_file = None
