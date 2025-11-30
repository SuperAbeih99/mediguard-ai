'use client';

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-blue-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  return (
    <AppShell>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
          Settings
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Account preferences
        </h1>
        <p className="text-sm text-slate-500">
          Update contact details and how you’d like MediGuard AI to notify you.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-6 rounded-[32px]">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
            <p className="text-sm text-slate-500">
              Update the information used in analysis reports.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" defaultValue="Jordan Nguyen" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                defaultValue="jordan@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue="(555) 214-9987" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="px-6">Save changes</Button>
          </div>
        </Card>

        <Card className="space-y-4 rounded-[32px]">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Alerts</h2>
            <p className="text-sm text-slate-500">
              Choose how MediGuard AI keeps you updated.
            </p>
          </div>
          <Toggle
            checked={emailAlerts}
            onChange={setEmailAlerts}
            label="Email notifications"
            description="Receive summaries and dispute drafts."
          />
          <Toggle
            checked={smsAlerts}
            onChange={setSmsAlerts}
            label="SMS updates"
            description="Get quick alerts when an analysis finishes."
          />
          <Toggle
            checked={true}
            onChange={() => {}}
            label="Product updates"
            description="Hear when new features roll out."
          />
          <Button variant="secondary" className="w-full">
            Manage notification rules
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
