import { RatingTaskInput, RatingDefectInput, RatingResult } from "@/types/contractor";

export function calculateContractorRating(
    tasks: RatingTaskInput[],
    defects: RatingDefectInput[]
): RatingResult {
    let score = 10;
    const reasons: string[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // 1. Deadline Penalty
    let lateTasksCount = 0;
    tasks.forEach((task) => {
        // Only consider tasks relevant to the rating period/context provided by caller
        // Assuming caller filters for 'last 30 days' if strictly required, 
        // BUT we should double check dates if the objects contain them.
        // For now, we trust the caller provided the relevant dataset or we check dates.

        // We only care about completed tasks for "lateness" usually, 
        // or active tasks that are *currently* overdue? 
        // Prompt says: "Task deadlines (on-time vs late)". 
        // Usually implies evaluating completed tasks or currently overdue ones.
        // Let's assume we check tasks completed in the window.

        if (task.status === "completed" && task.due_date) {
            const completedAt = new Date(task.updated_at);
            const dueDate = new Date(task.due_date);

            // Simple date comparison ignoring time if due_date is just YYYY-MM-DD
            // But usually string dates parse to UTC midnight.
            if (completedAt > dueDate) {
                lateTasksCount++;
                score -= 0.5;
                reasons.push(`Late task: ${task.id} (Penalty: -0.5)`);
            }
        }
    });

    if (lateTasksCount > 0) {
        // consolidated reason if needed, but per-task is fine for detailed view
        // reasons.push(`${lateTasksCount} late tasks processed.`);
    }

    // 2. Defect Penalty
    let defectPenalty = 0;
    let hasMediumOrHighDefect = false;
    const offendingDefects: RatingDefectInput[] = [];

    defects.forEach((defect) => {
        // Weighted penalties
        let penalty = 0;
        switch (defect.severity) {
            case "LOW":
                penalty = 0.5;
                break;
            case "MEDIUM":
                penalty = 1.0;
                hasMediumOrHighDefect = true;
                break;
            case "HIGH":
                penalty = 2.0;
                hasMediumOrHighDefect = true;
                break;
        }
        defectPenalty += penalty;
        score -= penalty;
        reasons.push(`Defect (${defect.severity}): ${defect.description || defect.id} (-${penalty})`);
        offendingDefects.push(defect);
    });

    // 3. Recovery Bonus
    // If no MEDIUM or HIGH defects in last 30 days (assuming input defects are from last 30 days)
    if (!hasMediumOrHighDefect && defects.length > 0) {
        // Wait, logic says "If no MEDIUM or HIGH defects". 
        // Does it imply if there are NO defects at all, do we give bonus? 
        // "If no MEDIUM or HIGH defects in last 30 days". 
        // Technically true if 0 defects. 
        // But usually recovery implies "good behavior". 
        // Let's follow strict rule: "If no MEDIUM or HIGH defects".
        // So even if 0 defects, +0.5? Or maybe only if there were LOW defects?
        // Let's assume +0.5 is a general "good standing" bonus if they avoided serious issues.
        score += 0.5;
        reasons.push("Recovery Bonus: No MEDIUM/HIGH defects (+0.5)");
    } else if (!hasMediumOrHighDefect && defects.length === 0) {
        score += 0.5;
        reasons.push("Recovery Bonus: No defects (+0.5)");
    }

    // 4. Clamp
    score = Math.min(10, Math.max(1, score));

    // 5. Payment Advice Mapping
    let risk: RatingResult["risk"];
    let advice: string;

    if (score >= 9) {
        risk = "EXCELLENT";
        advice = "Fast-track payment, bonus eligible";
    } else if (score >= 7) {
        risk = "GOOD";
        advice = "Normal payment";
    } else if (score >= 5) {
        risk = "MEDIUM";
        advice = "Hold 10% retention";
    } else if (score >= 3) {
        risk = "HIGH";
        advice = "Hold 25%, manager approval";
    } else {
        risk = "CRITICAL";
        advice = "Block payment, escalate";
    }

    return {
        score: parseFloat(score.toFixed(1)),
        risk,
        advice,
        reasons,
        offending_defects: offendingDefects
    };
}
