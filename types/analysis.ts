export interface BillAnalysis {
  summary: string;
  insurancePlan: string | null;
  totalBilled: number;
  potentialSavings: number;
  issuesFound: number;
  items: Array<{
    cptCode: string;
    description: string;
    amount: number;
    status: "correct" | "incorrect";
    why: string;
    estimatedReasonableAmount: number | null;
  }>;
  disputeLetter: string;
  questionAnswer: string | null;
}
