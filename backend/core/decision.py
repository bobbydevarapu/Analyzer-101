def classify(result):
    score = result["final_score"]
    semantic = result["semantic_score"]
    length = result.get("length", 0)

    if length < 5:
        result["status"] = "Ignore"
        result["reason"] = "Text too short to evaluate"
        return result

    # 🔥 SMART LOGIC (FIXED)
    if score >= 85 or semantic >= 90:
        status = "Highly Similar"
        reason = "Strong similarity detected (possible copying)"
    elif score >= 60 or semantic >= 75:
        status = "Suspicious"
        reason = "Moderate similarity detected"
    else:
        status = "Normal"
        reason = "No significant similarity"

    result["status"] = status
    result["reason"] = reason

    return result