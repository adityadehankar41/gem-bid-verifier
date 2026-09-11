def aggregate_compliance(pan_result: dict , udyam_result: dict , gst_result: dict , blacklist_result: dict) -> dict:
    ### If found in blacklist
    if blacklist_result["found_on_blacklist"]:
        return{
            "overall_score": 0,
            "risk_level": "High",
            "final_verdict": "DISQUALIFIED",
            "breakdown": {
                "pan": pan_result,
                "udyam": udyam_result,
                "gst": gst_result,
                "blacklist": blacklist_result
            },
            "issues": [f"[BLACKLIST] {issue}" for issue in blacklist_result["issues"]],
            "recommendation": generate_recommendation(
                overall_score=0,
                risk_level="High",
                final_verdict="DISQUALIFIED",
                issues=blacklist_result["issues"],
                is_blacklisted=True
            )
        }

    weights = weights = {"pan": 0.35, "udyam": 0.35, "gst": 0.30}

    overall_score = (
        pan_result["score"] * weights["pan"]
        + udyam_result["score"] * weights["udyam"]
        + gst_result["score"] * weights["gst"]
    )
    overall_score = round(overall_score, 1)

    all_issues = []
    for label, result in [("PAN", pan_result), ("UDYAM", udyam_result), ("GST", gst_result)]:
        for issue in result.get("issues", []):
            all_issues.append(f"[{label}] {issue}")

    # ── risk tier + verdict ──
    if overall_score >= 90:
        risk_level = "Low"
        final_verdict = "VALID"
    elif overall_score >= 60:
        risk_level = "Medium"
        final_verdict = "NEEDS_REVIEW"
    else:
        risk_level = "High"
        final_verdict = "INVALID"

    return {
        "overall_score": overall_score,
        "risk_level": risk_level,
        "final_verdict": final_verdict,
        "breakdown": {
            "pan": pan_result,
            "udyam": udyam_result,
            "gst": gst_result,
            "blacklist": blacklist_result
        },
        "issues": all_issues,
        "recommendation": generate_recommendation(
            overall_score=overall_score,
            risk_level=risk_level,
            final_verdict=final_verdict,
            issues=all_issues,
            is_blacklisted=False
        )
    }


def generate_recommendation(overall_score, risk_level, final_verdict, issues, is_blacklisted):
    """Rule-based, human-readable summary for the procurement officer's dashboard."""

    if is_blacklisted:
        return (
            "Bidder found on government debarment/blacklist registry. "
            "Not recommended for qualification. Immediate disqualification advised, "
            "subject to officer's final review."
        )

    if final_verdict == "VALID":
        return (
            f"Bidder meets all compliance requirements (score: {overall_score}/100). "
            "Recommended for qualification."
        )

    if final_verdict == "NEEDS_REVIEW":
        issue_summary = "; ".join(issues[:3])  # cap at 3 for readability
        more = f" and {len(issues) - 3} more issue(s)" if len(issues) > 3 else ""
        return (
            f"Bidder has {len(issues)} flagged issue(s) requiring manual review "
            f"(score: {overall_score}/100): {issue_summary}{more}. "
            "Recommend officer verification before final decision."
        )

    # INVALID
    issue_summary = "; ".join(issues[:3])
    more = f" and {len(issues) - 3} more issue(s)" if len(issues) > 3 else ""
    return (
        f"Bidder has significant compliance concerns (score: {overall_score}/100): "
        f"{issue_summary}{more}. Not recommended for qualification without further verification."
    )
        