"""
Generative AI integration using Ollama (TinyLlama).

Sends structured traffic data to the model and gets back
future predictions and route suggestions.
"""

import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "tinyllama"


def build_prompt(traffic_data, vehicle_type="car", objective="fast"):
    """
    Build a structured prompt from simulation data and user inputs.

    Args:
        traffic_data: dict with edge stats, vehicle count, avg speed
        vehicle_type: "car" or "ambulance"
        objective: "fast" or "safe"

    Returns:
        str: The prompt to send to the AI model
    """
    # Extract summary stats from traffic data
    edges = traffic_data.get("edges", [])
    stats = traffic_data.get("stats", {})
    active_vehicles = stats.get("active_vehicles", 0)

    # Calculate average speed across all edges
    speeds = [e["mean_speed"] for e in edges if e["mean_speed"] > 0]
    avg_speed = round(sum(speeds) / len(speeds), 2) if speeds else 0

    # Determine congestion level
    if avg_speed > 10:
        congestion = "low"
    elif avg_speed > 5:
        congestion = "moderate"
    else:
        congestion = "heavy"

    # Build per-edge info for the prompt
    edge_info = ""
    for e in edges[:10]:  # Limit to top 10 edges to keep prompt short
        edge_info += (
            f"  - {e['id']}: speed={e['mean_speed']} m/s, "
            f"vehicles={e['vehicle_count']}, "
            f"waiting_time={e['waiting_time']}s\n"
        )

    # Available routes from the network
    routes_info = """Available routes:
  - Route A (Highway Direct): S1 -> J1 -> J2 -> J3 -> D1 (fastest when clear)
  - Route B (City Road): S1 -> J1 -> J4 -> J5 -> J6 -> J3 -> D1 (medium distance)
  - Route C (Local Street): S1 -> J1 -> J4 -> J7 -> J8 -> J9 -> D2 (longest but avoids highway)"""

    prompt = f"""You are a traffic prediction system for a vehicular network (VANET).
Analyze the current traffic data and provide predictions and route suggestions.

CURRENT TRAFFIC DATA:
- Total active vehicles: {active_vehicles}
- Average speed: {avg_speed} m/s ({round(avg_speed * 3.6, 1)} km/h)
- Congestion level: {congestion}

EDGE-LEVEL DATA:
{edge_info}

{routes_info}

USER PREFERENCES:
- Vehicle type: {vehicle_type}
- Optimization objective: {objective}

Based on this data, provide:
1. PREDICTION: What will traffic look like in the next 5 minutes?
2. CONGESTION: Which roads will get more congested?
3. RECOMMENDED ROUTE: Which route is best for this {vehicle_type} optimizing for {objective}?
4. EXPECTED DELAY: Estimated travel time in seconds
5. EXPLANATION: One sentence explaining your recommendation

Respond in this exact format:
PREDICTION: <your prediction>
CONGESTION: <congestion forecast>
RECOMMENDED_ROUTE: <Route A or Route B or Route C>
EXPECTED_DELAY: <number in seconds>
EXPLANATION: <one sentence>"""

    return prompt


def query_model(prompt):
    """
    Send a prompt to Ollama and get the response.

    Args:
        prompt: str - the constructed prompt

    Returns:
        str: raw model response text
    """
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 300,  # Keep response short
                },
            },
            timeout=60,
        )
        response.raise_for_status()
        return response.json().get("response", "")
    except requests.ConnectionError:
        return "ERROR: Cannot connect to Ollama. Make sure it is running (ollama serve)."
    except requests.Timeout:
        return "ERROR: Ollama took too long to respond."
    except Exception as e:
        return f"ERROR: {str(e)}"


def parse_response(raw_response):
    """
    Parse the structured AI response into a dict.

    Args:
        raw_response: str - raw text from the model

    Returns:
        dict with prediction, congestion, recommended_route, expected_delay, explanation
    """
    result = {
        "prediction": "",
        "congestion": "",
        "recommended_route": "",
        "expected_delay": 0,
        "explanation": "",
        "raw_response": raw_response,
    }

    for line in raw_response.strip().split("\n"):
        line = line.strip()
        if line.startswith("PREDICTION:"):
            result["prediction"] = line.replace("PREDICTION:", "").strip()
        elif line.startswith("CONGESTION:"):
            result["congestion"] = line.replace("CONGESTION:", "").strip()
        elif line.startswith("RECOMMENDED_ROUTE:"):
            result["recommended_route"] = line.replace("RECOMMENDED_ROUTE:", "").strip()
        elif line.startswith("EXPECTED_DELAY:"):
            delay_str = line.replace("EXPECTED_DELAY:", "").strip()
            # Extract number from string like "120 seconds" or "120"
            digits = "".join(c for c in delay_str if c.isdigit())
            result["expected_delay"] = int(digits) if digits else 0
        elif line.startswith("EXPLANATION:"):
            result["explanation"] = line.replace("EXPLANATION:", "").strip()

    return result


def generate_prediction(traffic_data, vehicle_type="car", objective="fast"):
    """
    Main function: takes traffic data + user inputs, returns AI prediction.

    Args:
        traffic_data: dict from simulation step_and_collect()
        vehicle_type: "car" or "ambulance"
        objective: "fast" or "safe"

    Returns:
        dict with prediction results
    """
    prompt = build_prompt(traffic_data, vehicle_type, objective)
    raw_response = query_model(prompt)
    parsed = parse_response(raw_response)
    return parsed
