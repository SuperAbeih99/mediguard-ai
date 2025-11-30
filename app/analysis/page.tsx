import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";

const lineItems = [
  {
    service: "Emergency room facility fee",
    date: "03/11/2025",
    charge: "$1,450.00",
    note: "Higher than regional average by 22%.",
  },
  {
    service: "CT scan (head) x2",
    date: "03/12/2025",
    charge: "$860.00",
    note: "Appears duplicated — only one scan documented.",
  },
  {
    service: "Pharmacy charges",
    date: "03/12/2025",
    charge: "$540.00",
    note: "Includes $180 anti-nausea injection not referenced in chart.",
  },
];

const nextSteps = [
  "Confirm with your provider whether both CT scans were performed.",
  "Ask billing for an itemized explanation of the pharmacy bundle.",
  "Request that the ER facility fee be reviewed against your insurer contract.",
];

export default function AnalysisPage() {
  return (
    <AppShell>
      <div>
        <p className="text-sm text-slate-500">Analysis report</p>
        <h1 className="text-2xl font-semibold text-slate-900">
          March 11 ER visit – Anderson Memorial
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4 rounded-[32px]">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-500">Summary</p>
            <p className="text-lg font-semibold text-slate-900">
              Charges appear high for imaging and facility services.
            </p>
            <p className="text-sm text-slate-600">
              MediGuard AI translated your bill into plain English so you can
              dispute inaccurate items quickly.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="font-mono text-sm text-slate-500">TOTAL DUE</p>
            <p className="text-3xl font-semibold text-slate-900">$2,850.00</p>
            <p className="text-xs text-slate-500">Potential savings: $640.00</p>
          </div>

          <Alert title="AI explanation">
            The ER visit included two CT scans billed on the same day even though
            only one scan is mentioned in the physician notes. The facility fee is
            significantly higher than the average in your ZIP code. Pharmacy
            charges bundle multiple injections without clarity on dosage.
          </Alert>
        </Card>

        <Card className="space-y-4 rounded-[32px]">
          <h2 className="text-base font-semibold text-slate-900">Next steps</h2>
          <div className="space-y-3 text-sm text-slate-600">
            {nextSteps.map((step, index) => (
              <div key={step} className="flex gap-3">
                <span className="font-semibold text-blue-600">
                  {index + 1}.
                </span>
                <p>{step}</p>
              </div>
            ))}
          </div>
          <Badge variant="warning">Draft dispute email coming soon</Badge>
        </Card>
      </div>

      <Card className="space-y-4 rounded-[32px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Charge breakdown
            </h2>
            <p className="text-sm text-slate-500">
              Sorted by potential impact
            </p>
          </div>
          <Badge variant="success">3 issues flagged</Badge>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            <span className="col-span-5">Service</span>
            <span className="col-span-2">Date</span>
            <span className="col-span-2 text-right">Charge</span>
            <span className="col-span-3">Notes</span>
          </div>
          <div className="divide-y divide-slate-100">
            {lineItems.map((item) => (
              <div
                key={item.service}
                className="grid grid-cols-12 items-center gap-2 px-4 py-4 text-sm"
              >
                <div className="col-span-5 font-medium text-slate-900">
                  {item.service}
                </div>
                <div className="col-span-2 text-slate-500">{item.date}</div>
                <div className="col-span-2 text-right font-mono text-slate-900">
                  {item.charge}
                </div>
                <div className="col-span-3 text-slate-600">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
