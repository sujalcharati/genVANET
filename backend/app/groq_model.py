"""
Groq API integration for model comparison.

Uses the same prompt and parser as ai_model.py but sends to Groq's cloud API
running Llama 3.1 8B instead of local Ollama TinyLlama.
"""

import os
from pathlib import Path

import requests
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from .ai_model import (
    SYSTEM_PROMPT,
    build_prompt,
    parse_response,
    _calc_route_stats,
    _pick_best_route,
    _estimate_delay,
)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")


def query_groq(prompt):
    """Send a prompt to Groq API and return the response text."""
    if not GROQ_API_KEY:
        return "ERROR: GROQ_API_KEY not set. Export it as an environment variable."

    try:
        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.7,
                "max_tokens": 300,
            },
            timeout=30,
        )
        if response.status_code != 200:
            error_body = response.text
            print(f"[Groq API Error] {response.status_code}: {error_body}")
            return f"ERROR: Groq API {response.status_code} - {error_body}"
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except requests.ConnectionError:
        return "ERROR: Cannot connect to Groq API. Check your internet connection."
    except requests.Timeout:
        return "ERROR: Groq API took too long to respond."
    except Exception as e:
        return f"ERROR: {str(e)}"


def generate_groq_prediction(traffic_data, vehicle_type="car", objective="fast"):
    """
    Same logic as ai_model.generate_prediction but uses Groq API.
    Shares prompt building, parsing, and fallback logic.
    """
    edges = traffic_data.get("edges", [])
    route_stats = _calc_route_stats(edges)

    prompt = build_prompt(traffic_data, vehicle_type, objective)
    raw_response = query_groq(prompt)
    parsed = parse_response(raw_response)

    # Analytical fallback (same as TinyLlama path)
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

    parsed["route_stats"] = route_stats
    return parsed
