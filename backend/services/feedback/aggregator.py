"""Feedback aggregator module.

Aggregates per-question evaluations across conversational and coding tasks
into dimension averages and a weighted overall session score.
"""

def aggregate_scores(evaluations: list[dict]) -> dict:
    """Calculate aggregate scores from a list of question evaluations."""
    if not evaluations:
        return {
            "overall_score": 0,
            "communication": 0,
            "confidence": 0,
            "technical_accuracy": 0,
            "coding_summary": None,
            "total_evaluated": 0,
        }

    total_weight = 0.0
    weighted_score_sum = 0.0

    comm_scores = []
    conf_scores = []
    tech_scores = []

    coding_correctness = []
    coding_quality = []
    coding_edges = []
    coding_efficiency = []

    for ev in evaluations:
        comm = ev.get("communication", 70)
        conf = ev.get("confidence", 70)
        tech = ev.get("technical_accuracy", 70)

        comm_scores.append(comm)
        conf_scores.append(conf)
        tech_scores.append(tech)

        q_type = ev.get("question_type", "conversational")
        weight = 1.5 if q_type == "coding_task" else 1.0

        q_score = (0.40 * tech) + (0.35 * comm) + (0.25 * conf)
        weighted_score_sum += q_score * weight
        total_weight += weight

        if q_type == "coding_task" and "coding_metrics" in ev:
            cm = ev["coding_metrics"]
            coding_correctness.append(cm.get("correctness", 70))
            coding_quality.append(cm.get("code_quality", 70))
            coding_edges.append(cm.get("edge_cases", 70))
            coding_efficiency.append(cm.get("efficiency", 70))

    overall_score = round(weighted_score_sum / max(1.0, total_weight))
    avg_comm = round(sum(comm_scores) / len(comm_scores))
    avg_conf = round(sum(conf_scores) / len(conf_scores))
    avg_tech = round(sum(tech_scores) / len(tech_scores))

    coding_summary = None
    if coding_correctness:
        coding_summary = {
            "correctness": round(sum(coding_correctness) / len(coding_correctness)),
            "code_quality": round(sum(coding_quality) / len(coding_quality)),
            "edge_cases": round(sum(coding_edges) / len(coding_edges)),
            "efficiency": round(sum(coding_efficiency) / len(coding_efficiency)),
        }

    return {
        "overall_score": overall_score,
        "communication": avg_comm,
        "confidence": avg_conf,
        "technical_accuracy": avg_tech,
        "coding_summary": coding_summary,
        "total_evaluated": len(evaluations),
    }
