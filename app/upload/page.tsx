'use client';

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FileUploadArea } from "@/components/file-upload-area";
import { AppShell } from "@/components/app-shell";

type UploadVisualState = "idle" | "loading" | "error";
type AnalysisState = "idle" | "loading" | "ready";

const CHAT_MESSAGES = [
  {
    role: "user",
    text: "Why was this CT scan flagged?",
  },
  {
    role: "ai",
    text: "It appears the same CT scan code was billed twice on the same date. You can ask the hospital to confirm whether both were actually performed.",
  },
];

export default function UploadPage() {
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadVisualState>("idle");
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [chatInput, setChatInput] = useState("");

  const handleFileSelect = (files: FileList) => {
    const file = files[0];
    if (!file) {
      return;
    }
    if (file.type !== "application/pdf") {
      setSelectedFile(null);
      setUploadState("error");
      setErrorMessage("Please upload a PDF file.");
      return;
    }

    setSelectedFile(file);
    setUploadState("idle");
    setErrorMessage(undefined);
  };

  const simulateAnalyze = () => {
    if (!selectedFile) {
      setUploadState("error");
      setErrorMessage("Attach a PDF statement before analyzing.");
      return;
    }

    setUploadState("loading");
    setErrorMessage(undefined);
    setAnalysisState("loading");

    setTimeout(() => {
      setUploadState("idle");
      setAnalysisState("ready");
    }, 1500);
  };

  return (
    <AppShell>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
          Upload center
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Submit a new hospital bill
        </h1>
        <p className="text-sm text-slate-500">
          Secure, encrypted intake. We redact personal identifiers before running
          analysis.
        </p>
      </div>

      <Card className="space-y-8 rounded-[32px] border-blue-100/80">
        <FileUploadArea
          state={uploadState}
          onFileSelect={handleFileSelect}
          errorMessage={errorMessage}
          selectedFileName={selectedFile?.name ?? null}
        />

        <div className="space-y-2">
          <Label htmlFor="notes">Notes or questions for the AI</Label>
          <Textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Example: “This ER stay overlaps with an outpatient visit. Can you check for duplicates?”"
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-500">
            Supported files: PDF up to 15MB. Secure tunnels available for health
            systems.
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSelectedFile(null);
                setUploadState("idle");
                setErrorMessage(undefined);
                setNotes("");
                setAnalysisState("idle");
              }}
            >
              Reset
            </Button>
            <Button type="button" onClick={simulateAnalyze}>
              Analyze bill
            </Button>
          </div>
        </div>

        {analysisState === "idle" && (
          <Alert title="Drop a file to begin" variant="info">
            We will parse line items, totals, and insurance adjustments in under a
            minute.
          </Alert>
        )}

        {analysisState === "loading" && (
          <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Analyzing your bill…
            </p>
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-3 w-full animate-pulse rounded-full bg-blue-100"
                />
              ))}
            </div>
          </div>
        )}

        {analysisState === "ready" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">
                Summary
              </p>
              <p className="mt-2 text-sm text-slate-700">
                AI found 2 potential issues: duplicate imaging charge and a facility
                fee that is 24% higher than average.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="space-y-3 rounded-2xl border-slate-200/80">
                <p className="text-sm font-semibold text-slate-900">
                  Suggested negotiation script
                </p>
                <p className="text-sm text-slate-600">
                  “Hi Billing Department, I’m writing to request a review of my
                  recent bill. I noticed a possible duplicate charge for CT imaging
                  on 03/11/25 and a facility fee that appears higher than typical
                  contracted rates. Could you please provide an itemized breakdown
                  and confirm whether these charges are accurate?”
                </p>
              </Card>

              <Card className="space-y-4 rounded-2xl border-slate-200/80">
                <p className="text-sm font-semibold text-slate-900">
                  Chat with MediGuard AI
                </p>
                <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-sm">
                  {CHAT_MESSAGES.map((message, index) => (
                    <div key={index}>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {message.role === "user" ? "You" : "AI"}
                      </p>
                      <p className="text-slate-700">{message.text}</p>
                    </div>
                  ))}
                  <div className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Ask a question about this bill..."
                      className="flex-1 border-none text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setChatInput("")}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
