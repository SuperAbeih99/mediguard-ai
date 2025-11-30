'use client';

import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/app/_providers/AuthContext";

const SIGNED_IN_STATS = [
  { label: "Bills analyzed", value: "32", detail: "+6 this week" },
  { label: "Potential savings", value: "$18,240", detail: "Across 14 flagged cases" },
  { label: "Pending reviews", value: "3", detail: "Need your attention" },
];

const MOCK_BILLS = [
  {
    title: "ER visit – Jan 4, 2025",
    status: "Completed",
    summary: "AI flagged duplicate imaging and high facility fee.",
  },
  {
    title: "Outpatient surgery – Feb 8, 2025",
    status: "In review",
    summary: "Negotiation email drafted, awaiting provider reply.",
  },
  {
    title: "Pediatric stay – Dec 3, 2024",
    status: "Completed",
    summary: "Resolved pharmacy bundle discrepancy ($420 savings).",
  },
];

const RECENT_ALERTS = [
  {
    title: "Duplicate CT imaging",
    desc: "Same CPT billed twice on 03/11/25 Anderson Memorial visit.",
  },
  {
    title: "Out-of-network facility fee",
    desc: "ER fee is 24% above contracted PPO rate. Review with insurer.",
  },
];

const statusVariantMap: Record<string, "success" | "default" | "warning"> = {
  Completed: "success",
  "In review": "warning",
};

export default function DashboardPage() {
  const { isGuest } = useAuth();

  if (isGuest) {
    return (
      <AppShell>
        <Card className="space-y-4 rounded-[32px] border-blue-100 bg-blue-50/70">
          <p className="text-sm font-semibold text-blue-800">
            Guest mode: 3 free analyses every 24 hours
          </p>
          <p className="text-sm text-blue-700">
            Sign in to save your uploads, view history, and generate negotiation
            scripts that stay synced across devices.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/upload">Upload a bill</Button>
            <Button variant="secondary" href="/settings">
              Create account
            </Button>
          </div>
        </Card>

        <Card className="space-y-2 rounded-[32px] border-dashed border-slate-200 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Sign in to see a history of your analyzed bills.
          </p>
          <p className="text-sm text-slate-500">
            Guest uploads are temporary. Create an account to keep a record of all
            AI findings and negotiation drafts.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="rounded-[36px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-white p-8 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-blue-500">
              Welcome back
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Monitor your hospital bills with confidence.
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Upload new statements, review AI explanations, and prepare next steps
              with providers or insurers.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" href="/history">
              View history
            </Button>
            <Button href="/upload">Upload a bill</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {SIGNED_IN_STATS.map((stat) => (
          <Card key={stat.label} className="space-y-2 rounded-[28px]">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {stat.label}
            </p>
            <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.detail}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 rounded-[28px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent analysis
              </h2>
              <p className="text-sm text-slate-500">
                Snapshot of your latest uploads
              </p>
            </div>
            <Button variant="secondary" href="/history">
              See all
            </Button>
          </div>
          <div className="space-y-4">
            {MOCK_BILLS.map((bill) => (
              <div
                key={bill.title}
                className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium text-slate-900">{bill.title}</p>
                  <Badge variant={statusVariantMap[bill.status] ?? "default"}>
                    {bill.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">{bill.summary}</p>
                <div className="flex justify-end">
                  <Button variant="ghost" href="/analysis">
                    View details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 rounded-[28px]">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Alerts & insights
            </h2>
            <p className="text-sm text-slate-500">
              Suggested follow-ups from MediGuard AI
            </p>
          </div>
          <div className="space-y-4">
            {RECENT_ALERTS.map((alert) => (
              <div key={alert.title} className="space-y-2 rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {alert.title}
                </p>
                <p className="text-sm text-slate-600">{alert.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
