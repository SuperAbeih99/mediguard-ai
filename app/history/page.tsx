'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/app/_providers/AuthContext";

const historyItems = [
  {
    name: "Outpatient surgery — Feb 4, 2025",
    date: "Uploaded Feb 6",
    status: "completed",
    summary: "Implant fee 34% above in-network allowance. Negotiation letter drafted.",
  },
  {
    name: "ER visit — Jan 13, 2025",
    date: "Uploaded Jan 15",
    status: "in-progress",
    summary: "AI finalizing dispute email for duplicate imaging charges.",
  },
  {
    name: "Pediatric checkup — Dec 3, 2024",
    date: "Uploaded Dec 5",
    status: "error",
    summary: "PDF unreadable. Please upload a clearer scan or request digital copy.",
  },
];

const statusMeta = {
  completed: { label: "Completed", variant: "success" as const },
  "in-progress": { label: "In progress", variant: "warning" as const },
  error: { label: "Needs attention", variant: "error" as const },
};

export default function HistoryPage() {
  const { isGuest } = useAuth();

  if (isGuest) {
    return (
      <AppShell>
        <Card className="space-y-3 rounded-[32px] bg-blue-50/60">
          <p className="text-sm font-semibold text-blue-700">
            Sign in to view your saved history
          </p>
          <p className="text-sm text-blue-600">
            Guest mode keeps your uploads temporary. Create an account to store
            past bills, draft negotiation letters, and export summaries.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
          History
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Past analyzed bills
        </h1>
        <p className="text-sm text-slate-500">
          Quick access to every upload, current status, and summary of findings.
        </p>
      </div>

      <Card className="space-y-6 rounded-[32px]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            Export a CSV for compliance, or drill into each case for dispute kits.
          </p>
          <Button variant="secondary">Export CSV</Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <div className="hidden bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-12">
            <span className="col-span-4">Bill</span>
            <span className="col-span-2">Uploaded</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-3">Summary</span>
            <span className="col-span-1 text-right">Action</span>
          </div>
          <div className="divide-y divide-slate-100">
            {historyItems.map((item) => {
              const badge = statusMeta[item.status as keyof typeof statusMeta];
              return (
                <div
                  key={item.name}
                  className="grid gap-4 px-4 py-4 md:grid-cols-12 md:items-center"
                >
                  <div className="col-span-4 space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 md:hidden">
                      {item.date}
                    </p>
                  </div>
                  <p className="col-span-2 hidden text-sm text-slate-500 md:block">
                    {item.date}
                  </p>
                  <div className="col-span-2">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <p className="col-span-3 text-sm text-slate-600">
                    {item.summary}
                  </p>
                  <div className="col-span-12 flex justify-end md:col-span-1">
                    <Button size="sm" variant="ghost" href="/analysis">
                      View details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
