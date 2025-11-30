import type { BillAnalysis } from "./analysis";

export interface Profile {
  id: string;
  full_name: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AnalysisRow {
  id: string;
  user_id: string;
  created_at: string;
  bill_title: string | null;
  insurance_provider: string | null;
  total_billed: number | null;
  potential_savings: number | null;
  issues_found: number | null;
  ai_result: BillAnalysis | null;
}
