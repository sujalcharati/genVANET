"""
Dynamic scenario generator.

Takes user-selected parameters (density, vehicle mix, pattern)
and generates a SUMO route XML string — no pre-built files needed.
"""

import random
import xml.etree.ElementTree as ET
from xml.dom import minidom

# All 20 routes from the network, grouped by entry point
ROUTES = {
    "west": [
        ("highway_direct",    "S1_J1 J1_J2 J2_J3 J3_D1"),
        ("highway_via_city",  "S1_J1 J1_J4 J4_J5 J5_J6 J6_J3 J3_D1"),
        ("highway_via_local", "S1_J1 J1_J4 J4_J7 J7_J8 J8_J9 J9_J6 J6_J3 J3_D1"),
        ("west_to_d2_mid",    "S1_J1 J1_J2 J2_J5 J5_J8 J8_J9 J9_D2"),
        ("west_to_d2_south",  "S1_J1 J1_J4 J4_J7 J7_J8 J8_J9 J9_D2"),
        ("s1_to_sr1",         "S1_J1 J1_J2 J2_J5 J5_J8 J8_SR1"),
        ("s1_to_sr2",         "S1_J1 J1_J2 J2_J3 J3_J6 J6_J9 J9_SR2"),
    ],
    "southwest": [
        ("s2_to_d1_up",  "S2_J7 J7_J4 J4_J1 J1_J2 J2_J3 J3_D1"),
        ("s2_to_d1_mid", "S2_J7 J7_J8 J8_J5 J5_J2 J2_J3 J3_D1"),
        ("s2_to_d2",     "S2_J7 J7_J8 J8_J9 J9_D2"),
    ],
    "north": [
        ("nr1_to_d1",  "NR1_J1 J1_J2 J2_J3 J3_D1"),
        ("nr1_to_d2",  "NR1_J1 J1_J4 J4_J7 J7_J8 J8_J9 J9_D2"),
        ("nr1_to_sr1", "NR1_J1 J1_J4 J4_J5 J5_J8 J8_SR1"),
        ("nr2_to_d1",  "NR2_J2 J2_J3 J3_D1"),
        ("nr2_to_d2",  "NR2_J2 J2_J5 J5_J8 J8_J9 J9_D2"),
        ("nr2_to_sr1", "NR2_J2 J2_J5 J5_J8 J8_SR1"),
        ("nr3_to_d1",  "NR3_J3 J3_D1"),
        ("nr3_to_d2",  "NR3_J3 J3_J6 J6_J9 J9_D2"),
        ("nr3_to_sr2", "NR3_J3 J3_J6 J6_J9 J9_SR2"),
    ],
}

ALL_ROUTES = []
for group in ROUTES.values():
    ALL_ROUTES.extend(group)

VTYPES = {
    "car":   {"length": "5",  "minGap": "2.5", "maxSpeed": "13.89", "color": "yellow", "accel": "2.6", "decel": "4.5", "sigma": "0.5"},
    "bus":   {"length": "12", "minGap": "3.0", "maxSpeed": "11.11", "color": "blue",   "accel": "1.2", "decel": "4.0", "sigma": "0.5"},
    "truck": {"length": "10", "minGap": "3.5", "maxSpeed": "8.33",  "color": "red",    "accel": "1.0", "decel": "3.5", "sigma": "0.5"},
}

# ── Config tables ──────────────────────────────────────────────

DENSITY_CONFIG = {
    "low":       {"count": 15,  "duration": 200},
    "medium":    {"count": 40,  "duration": 300},
    "high":      {"count": 80,  "duration": 400},
    "rush_hour": {"count": 120, "duration": 500},
}

MIX_CONFIG = {
    "cars_only":  {"car": 1.0, "bus": 0.0, "truck": 0.0},
    "mixed":      {"car": 0.6, "bus": 0.2, "truck": 0.2},
    "heavy_commercial": {"car": 0.3, "bus": 0.3, "truck": 0.4},
}

# ── Departure pattern generators ──────────────────────────────

def _uniform_departures(count, duration):
    """Evenly spaced departures."""
    gap = duration / count
    return [round(i * gap, 2) for i in range(count)]


def _rush_hour_departures(count, duration):
    """Clustered in the first 40% of the duration (morning rush)."""
    rush_end = duration * 0.4
    departures = sorted([round(random.uniform(0, rush_end), 2) for _ in range(count)])
    return departures


def _random_departures(count, duration):
    """Random departures across the full duration."""
    departures = sorted([round(random.uniform(0, duration * 0.8), 2) for _ in range(count)])
    return departures


PATTERN_FN = {
    "uniform":    _uniform_departures,
    "rush_hour":  _rush_hour_departures,
    "random":     _random_departures,
}


def generate_scenario(density="medium", vehicle_mix="mixed", pattern="uniform", seed=42):
    """
    Generate a SUMO route XML string from scenario parameters.

    Args:
        density:     "low" | "medium" | "high" | "rush_hour"
        vehicle_mix: "cars_only" | "mixed" | "heavy_commercial"
        pattern:     "uniform" | "rush_hour" | "random"
        seed:        random seed for reproducibility

    Returns:
        tuple: (route_xml_string, sim_duration)
    """
    random.seed(seed)

    cfg = DENSITY_CONFIG[density]
    mix = MIX_CONFIG[vehicle_mix]
    count = cfg["count"]
    duration = cfg["duration"]

    # Build vehicle type list based on mix ratios
    type_pool = []
    for vtype, ratio in mix.items():
        type_pool.extend([vtype] * int(ratio * 100))

    # Generate departure times
    departures = PATTERN_FN[pattern](count, duration)

    # Build XML
    root = ET.Element("routes")

    # Vehicle types
    for vtype_id, attrs in VTYPES.items():
        ET.SubElement(root, "vType", id=vtype_id, **attrs)

    # Route definitions
    for route_id, edges in ALL_ROUTES:
        ET.SubElement(root, "route", id=route_id, edges=edges)

    # Vehicles
    for i, depart in enumerate(departures):
        vtype = random.choice(type_pool)
        route_id, _ = random.choice(ALL_ROUTES)
        ET.SubElement(root, "vehicle",
                      id=f"v{i}",
                      type=vtype,
                      route=route_id,
                      depart=f"{depart:.2f}")

    xml_str = minidom.parseString(ET.tostring(root)).toprettyxml(indent="    ")
    # Remove extra XML declaration minidom adds
    lines = xml_str.split("\n")
    xml_str = "\n".join(lines[1:])

    return xml_str, duration
