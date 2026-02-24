"""
Generative AI integration using Ollama (TinyLlama).

Sends structured traffic data to the model and gets back
future predictions and route suggestions.
"""

import re
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "tinyllama"

# ── Route definitions mapped to actual SUMO edges ─────────────
ROUTES = {
    "Route A": {
        "name": "Highway Direct",
        "sumo_id": "highway_direct",
        "edges": ["S1_J1", "J1_J2", "J2_J3", "J3_D1"],
        "description": "direct highway, fastest when clear",
    },
    "Route B": {
        "name": "City Road",
        "sumo_id": "highway_via_city",
        "edges": ["S1_J1", "J1_J4", "J4_J5", "J5_J6", "J6_J3", "J3_D1"],
        "description": "city road, medium distance",
    },
    "Route C": {
        "name": "Local Street",
        "sumo_id": "highway_via_local",
        "edges": ["S1_J1", "J1_J4", "J4_J7", "J7_J8", "J8_J9", "J9_J6", "J6_J3", "J3_D1"],
        "description": "local streets, longest but avoids highway",
    },
}

SYSTEM_PROMPT = """You are a traffic prediction AI. You receive traffic data and reply in EXACTLY this format:

PREDICTION: <traffic forecast>
CONGESTION: <which roads will congest>
RECOMMENDED_ROUTE: <Route A or Route B or Route C>
EXPECTED_DELAY: <number in seconds>
EXPLANATION: <one sentence reason>

Only output these 5 lines. Nothing else."""


def _calc_route_stats(edges_data):
    """
    Calculate per-route stats (avg speed, total vehicles, total wait)
    from actual SUMO edge data.
    """
    # Build lookup: edge_id -> edge data
    edge_lookup = {e["id"]: e for e in edges_data}

    route_stats = {}
    for route_label, route_info in ROUTES.items():
        speeds = []
        total_vehicles = 0
        total_wait = 0.0

        for edge_id in route_info["edges"]:
            if edge_id in edge_lookup:
                e = edge_lookup[edge_id]
                if e["mean_speed"] > 0:
                    speeds.append(e["mean_speed"])
                total_vehicles += e["vehicle_count"]
                total_wait += e["waiting_time"]

        avg_speed = round(sum(speeds) / len(speeds), 2) if speeds else 0
        route_stats[route_label] = {
            "avg_speed": avg_speed,
            "vehicles": total_vehicles,
            "waiting_time": round(total_wait, 1),
            "edge_count": len(route_info["edges"]),
        }

    return route_stats


def _pick_best_route(route_stats, objective="fast"):
    """
    Analytically pick the best route from real data.
    Used as a fallback when AI gives bad output.
    """
    best = None
    best_score = None

    for label, stats in route_stats.items():
        if objective == "fast":
            # Higher speed + fewer edges = better
            score = stats["avg_speed"] - (stats["edge_count"] * 0.5)
        else:
            # Fewer vehicles + less waiting = safer
            score = -(stats["vehicles"] + stats["waiting_time"])

        if best_score is None or score > best_score:
            best_score = score
            best = label

    return best or "Route A"


def _estimate_delay(route_stats, route_label):
    """
    Estimate travel delay in seconds from real data.
    delay = (edges * avg_edge_length) / speed + waiting_time
    Assumes ~150m per edge.
    """
    stats = route_stats.get(route_label, {})
    speed = stats.get("avg_speed", 5)
    if speed < 1:
        speed = 1
    edge_count = stats.get("edge_count", 4)
    wait = stats.get("waiting_time", 0)
    distance = edge_count * 150  # ~150m per edge
    return round((distance / speed) + wait)


def build_prompt(traffic_data, vehicle_type="car", objective="fast"):
    """
    Build a concise prompt with real per-route stats.
    """
    edges = traffic_data.get("edges", [])
    stats = traffic_data.get("stats", {})
    active_vehicles = stats.get("active_vehicles", 0)

    route_stats = _calc_route_stats(edges)

    # Build route summary with real numbers
    route_lines = []
    for label, info in ROUTES.items():
        rs = route_stats[label]
        route_lines.append(
            f"- {label} ({info['name']}): "
            f"speed={rs['avg_speed']}m/s, "
            f"vehicles={rs['vehicles']}, "
            f"wait={rs['waiting_time']}s"
        )
    route_info = "\n".join(route_lines)

    prompt = f"""Traffic: {active_vehicles} vehicles on network.

Route conditions:
{route_info}

Vehicle: {vehicle_type}, Goal: {objective}

Which route is best? Give prediction now."""

    return prompt


def query_model(prompt):
    """
    Send a prompt to Ollama using the chat API for better instruction following.
    """
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 500,
                },
            },
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("message", {}).get("content", "")
    except requests.ConnectionError:
        return "ERROR: Cannot connect to Ollama. Make sure it is running (ollama serve)."
    except requests.Timeout:
        return "ERROR: Ollama took too long to respond."
    except Exception as e:
        return f"ERROR: {str(e)}"


def parse_response(raw_response):
    """
    Parse the AI response into a dict.
    Uses regex to be more flexible with formatting variations.
    """
    result = {
        "prediction": "",
        "congestion": "",
        "recommended_route": "",
        "expected_delay": 0,
        "explanation": "",
        "raw_response": raw_response,
    }

    # Use regex for flexible matching (handles extra spaces, numbering, etc.)
    patterns = {
        "prediction": r"PREDICTION\s*:\s*(.+)",
        "congestion": r"CONGESTION\s*:\s*(.+)",
        "recommended_route": r"RECOMMENDED[_\s]ROUTE\s*:\s*(.+)",
        "expected_delay": r"EXPECTED[_\s]DELAY\s*:\s*(.+)",
        "explanation": r"EXPLANATION\s*:\s*(.+)",
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, raw_response, re.IGNORECASE)
        if match:
            value = match.group(1).strip()
            if key == "expected_delay":
                # Extract first number (int or float) from string like "25.0s" or "120 seconds"
                num_match = re.search(r"(\d+\.?\d*)", value)
                result[key] = int(float(num_match.group(1))) if num_match else 0
            else:
                result[key] = value

    return result


def generate_prediction(traffic_data, vehicle_type="car", objective="fast"):
    """
    Main function: takes traffic data + user inputs, returns AI prediction.
    Uses real SUMO data for analytical fallbacks when AI gives bad output.
    """
    edges = traffic_data.get("edges", [])
    route_stats = _calc_route_stats(edges)

    # Get AI prediction
    prompt = build_prompt(traffic_data, vehicle_type, objective)
    raw_response = query_model(prompt)
    parsed = parse_response(raw_response)

    # Analytical fallback: fill in blanks with real data
    best_route = _pick_best_route(route_stats, objective)

    if not parsed["recommended_route"] or "route" not in parsed["recommended_route"].lower():
        parsed["recommended_route"] = best_route

    if parsed["expected_delay"] < 10:
        parsed["expected_delay"] = _estimate_delay(route_stats, best_route)

    if not parsed["prediction"] or len(parsed["prediction"]) < 10:
        active = traffic_data.get("stats", {}).get("active_vehicles", 0)
        parsed["prediction"] = (
            f"Network has {active} active vehicles. "
            f"{best_route} has best conditions with "
            f"{route_stats[best_route]['avg_speed']}m/s avg speed."
        )

    if not parsed["congestion"]:
        # Find the most congested route
        worst = max(route_stats, key=lambda r: route_stats[r]["vehicles"])
        parsed["congestion"] = (
            f"{worst} is most congested with "
            f"{route_stats[worst]['vehicles']} vehicles"
        )

    if not parsed["explanation"] or len(parsed["explanation"]) < 10:
        parsed["explanation"] = (
            f"{best_route} recommended — "
            f"avg speed {route_stats[best_route]['avg_speed']}m/s, "
            f"{route_stats[best_route]['vehicles']} vehicles on route."
        )

    # Attach route stats for the frontend
    parsed["route_stats"] = route_stats

    return parsed
