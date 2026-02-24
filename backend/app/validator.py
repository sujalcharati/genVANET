"""
Rule-based validation for AI-generated predictions.

Applies simple safety checks to ensure generated outputs
are reasonable before showing them to the user.
"""

# Valid routes matching ai_model.ROUTES
VALID_ROUTES = {"Route A", "Route B", "Route C"}

# Delay limits (in seconds)
MIN_DELAY = 10
MAX_DELAY = 3600  # 1 hour max


def validate_prediction(prediction):
    """
    Validate AI-generated prediction with simple rule checks.

    Note: ai_model.generate_prediction() already applies analytical
    fallbacks, so most fields should be populated by the time they
    reach here.  This is the final safety net.
    """
    errors = []
    corrected = prediction.copy()

    # Rule 1: Recommended route must be one of our valid routes
    route = prediction.get("recommended_route", "")
    route_valid = False
    for valid_route in VALID_ROUTES:
        if valid_route.lower() in route.lower():
            # Normalize to clean name (e.g. "Route A (Highway Direct)" -> "Route A")
            corrected["recommended_route"] = valid_route
            route_valid = True
            break

    if not route_valid:
        errors.append(f"Invalid route '{route}'. Must be one of {VALID_ROUTES}")
        corrected["recommended_route"] = "Route A"

    # Rule 2: Expected delay must be within reasonable limits
    delay = prediction.get("expected_delay", 0)
    if delay < MIN_DELAY:
        errors.append(f"Delay {delay}s is too low (min {MIN_DELAY}s)")
        corrected["expected_delay"] = MIN_DELAY
    elif delay > MAX_DELAY:
        errors.append(f"Delay {delay}s exceeds maximum (max {MAX_DELAY}s)")
        corrected["expected_delay"] = MAX_DELAY

    # Rule 3: Prediction text must not be empty
    if not prediction.get("prediction", "").strip():
        errors.append("Empty prediction generated")

    # Rule 4: Explanation must exist
    if not prediction.get("explanation", "").strip():
        errors.append("No explanation provided")
        corrected["explanation"] = "AI could not generate a clear explanation."

    # Rule 5: Check for error responses from the model
    raw = prediction.get("raw_response", "")
    if raw.startswith("ERROR:"):
        errors.append(raw)
        return {
            "is_valid": False,
            "errors": errors,
            "prediction": corrected,
        }

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "prediction": corrected,
    }
