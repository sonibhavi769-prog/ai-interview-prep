"""Learning recommendations engine.

Derives prioritized, actionable study recommendations based on weakest
dimensions and flagged weaknesses in conversational and coding evaluations.
"""

def generate_recommendations(evaluations: list[dict], aggregate_scores: dict) -> list[dict]:
    """Generate prioritized learning recommendations."""
    recs = []

    comm = aggregate_scores.get("communication", 70)
    conf = aggregate_scores.get("confidence", 70)
    tech = aggregate_scores.get("technical_accuracy", 70)
    coding_summary = aggregate_scores.get("coding_summary")

    # 1. Technical Accuracy recommendations
    if tech < 75:
        recs.append({
            "category": "Technical Depth",
            "priority": "High" if tech < 65 else "Medium",
            "title": "Deepen Architecture & Trade-Off Analysis",
            "description": (
                "When answering technical questions, explicitly mention architectural trade-offs, "
                "scalability bottlenecks, and why an alternative design was rejected."
            ),
            "action_item": "Practice framing answers with: Problem → Architectural Alternatives → Selected Design → Trade-offs."
        })

    # 2. Communication recommendations
    if comm < 75:
        recs.append({
            "category": "Communication",
            "priority": "High" if comm < 65 else "Medium",
            "title": "Use Structured Response Frameworks (STAR)",
            "description": (
                "Structure responses clearly using the Situation, Task, Action, Result (STAR) framework. "
                "Keep introductory context concise and allocate 60% of your time to actions taken."
            ),
            "action_item": "Practice 2-minute elevator pitches for key projects in your target domain."
        })

    # 3. Confidence & Filler Words recommendations
    # Check if filler words were heavily detected across conversational questions
    total_fillers = sum(
        ev.get("nlp_metrics", {}).get("filler_count", 0)
        for ev in evaluations
        if ev.get("question_type") == "conversational"
    )
    if conf < 75 or total_fillers > 3:
        recs.append({
            "category": "Delivery & Confidence",
            "priority": "Medium",
            "title": "Replace Filler Words with Strategic Pauses",
            "description": (
                f"We noticed filler sounds or hesitations ({total_fillers} detected across answers). "
                "Experienced interviewees pause deliberately for 2-3 seconds to collect their thoughts rather than vocalizing fillers."
            ),
            "action_item": "Take a breath before answering and state your main conclusion upfront."
        })

    # 4. Coding task specific recommendations
    if coding_summary:
        edge_score = coding_summary.get("edge_cases", 70)
        efficiency_score = coding_summary.get("efficiency", 70)
        quality_score = coding_summary.get("code_quality", 70)

        if edge_score < 75:
            recs.append({
                "category": "Coding & Algorithms",
                "priority": "High",
                "title": "Defensive Coding & Edge Case Handling",
                "description": (
                    "Your code reviews flagged boundary conditions. Always test for empty inputs, single-element arrays, "
                    "extreme values, and null pointers before writing core logic."
                ),
                "action_item": "List out 3-5 boundary cases in comments before starting your implementation."
            })

        if efficiency_score < 75:
            recs.append({
                "category": "Coding & Algorithms",
                "priority": "Medium",
                "title": "Algorithmic Complexity Optimization",
                "description": (
                    "Focus on identifying bottlenecks in brute-force approaches. Consider if hash maps, two pointers, "
                    "or binary search can reduce time complexity to O(n) or O(log n)."
                ),
                "action_item": "State your target time and space complexity before writing code."
            })

        if quality_score < 75:
            recs.append({
                "category": "Coding Practices",
                "priority": "Low",
                "title": "Code Cleanliness & Modular Design",
                "description": (
                    "Strive for idiomatic code with descriptive variable names and small, focused helper functions."
                ),
                "action_item": "Refactor nested conditionals into early returns (guard clauses)."
            })

    # Fallback if candidate performed exceptionally well across the board
    if not recs:
        recs.append({
            "category": "Continuous Mastery",
            "priority": "Low",
            "title": "Advance to Senior-Level System Design & Complex Edge Scenarios",
            "description": (
                "Strong performance across all evaluated dimensions! Next, challenge yourself with hard-tier questions "
                "and distributed systems architectural trade-offs."
            ),
            "action_item": "Set interview difficulty to 'Hard' in your next mock session."
        })

    return recs[:4]  # Return top actionable recommendations
