export async function estimateContract(input: {
  projectType: string
  area: number
  location: string
  quality: "basic" | "standard" | "premium"
}) {
  const prompt = `
You are a construction estimator in India.

Project:
Type: ${input.projectType}
Area: ${input.area} sqft
Location: ${input.location}
Quality: ${input.quality}

Return JSON ONLY like this:

{
  "estimated_days": 120,
  "days_explanation": "Reasoning here",

  "workers_required": 15,
  "workers_explanation": "Reasoning here",

  "material_cost": 4500000,
  "material_explanation": "Reasoning here",

  "labor_cost": 2200000,
  "labor_explanation": "Reasoning here",

  "total_cost": 6700000,

  "risk_factors": "Weather, approvals, material price",
  "final_summary": "Overall conclusion"
}

No markdown. No commentary. JSON only.
`;

  try {
    const res = await fetch("/api/estimate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });

    return await res.json();
  } catch {
    // 🛡 OFFLINE FALLBACK (Never breaks demo)
    const base = input.area * 1800;

    return {
      estimated_days: Math.ceil(input.area / 120),
      days_explanation: "Estimated using standard construction pacing.",
      workers_required: 10,
      workers_explanation: "Crew size based on area and project type.",
      material_cost: base,
      material_explanation: "Material cost based on average market rates.",
      labor_cost: input.area * 700,
      labor_explanation: "Labor cost based on local workforce rates.",
      total_cost: base + input.area * 700,
      risk_factors: "Weather delays and material cost fluctuations.",
      final_summary: "This is a fallback estimate generated offline.",
    };
  }
}
