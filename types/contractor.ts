export interface Contractor {
  id: string;
  name: string;
  user_id?: string;
  current_rating: number;
  rating_last_updated?: string;
  created_at: string;
  updated_at: string;
}

export interface Defect {
  id: string;
  contractor_id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "RESOLVED";
  resolved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractorRating {
  id: string;
  contractor_id: string;
  score: number;
  risk: "EXCELLENT" | "GOOD" | "MEDIUM" | "HIGH" | "CRITICAL";
  advice: string;
  reasons: string[];
  calculated_at: string;
}

// Input for the pure calculation function
export interface RatingTaskInput {
  id: string;
  status: string; // e.g., 'completed'
  due_date?: string | null;
  updated_at: string; // Used as completion date if status is completed
}

export interface RatingDefectInput {
  id: string;
  description?: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "RESOLVED";
  created_at: string;
}

export interface RatingResult {
  score: number;
  risk: "EXCELLENT" | "GOOD" | "MEDIUM" | "HIGH" | "CRITICAL";
  advice: string;
  reasons: string[];
  offending_defects?: RatingDefectInput[];
  late_tasks_count?: number;
}
