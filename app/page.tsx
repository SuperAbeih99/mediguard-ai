"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FileUploadArea } from "@/components/file-upload-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/app/_providers/AuthContext";
import type { BillAnalysis } from "@/types/analysis";
import type { AnalysisRow } from "@/types/supabase";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type LineItemStatus = BillAnalysis["items"][number]["status"];

class AnalyzeBillError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AnalyzeBillError";
    this.status = status;
  }
}

type AnalyzeMutationVariables = {
  insuranceProvider: string;
  inputMode: "image" | "text";
  billImage: File | null;
  billText: string;
  userQuestion: string;
};

const providerOptions = [
  "Medicare",
  "Medicaid",
  "UnitedHealthcare",
  "Blue Cross Blue Shield",
  "Aetna",
  "Cigna",
  "Other",
];

const loadingSteps = [
  {
    icon: "/icons/bill.svg",
    label: "Reading your bill…",
    subtext: "Breaking every charge into line items",
  },
  {
    icon: "/icons/ai-chip.svg",
    label: "Comparing CPT codes and pricing…",
    subtext: "Checking your plan’s benchmark rates",
  },
  {
    icon: "/icons/shield.svg",
    label: "Looking for potential savings…",
    subtext: "Flagging disputes and next steps",
  },
];

type AnalyzeResponse = { analysis: BillAnalysis };

type HistoryItem = {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  analysis: BillAnalysis;
};

export default function HomePage() {
  const { supabase, user, isGuest, displayName, signIn, signUp, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(() => isGuest);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [signUpFirstName, setSignUpFirstName] = useState("");
  const [signUpLastName, setSignUpLastName] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInConfirmPassword, setSignInConfirmPassword] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpFieldErrors, setSignUpFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [inputMode, setInputMode] = useState<"image" | "text">("image");
  const [billImage, setBillImage] = useState<File | null>(null);
  const [billText, setBillText] = useState("");
  const [userQuestion, setUserQuestion] = useState("");
  const [analysis, setAnalysis] = useState<BillAnalysis | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(null);
  const [copyConfirmationVisible, setCopyConfirmationVisible] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [activeLoadingStep, setActiveLoadingStep] = useState(0);
  const [lastVariables, setLastVariables] = useState<AnalyzeMutationVariables | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const saveAnalysisToHistory = useCallback(
    async (analysisResult: BillAnalysis) => {
      const timestamp = new Date().toISOString();
      const title = buildHistoryTitle(insuranceProvider, timestamp);
      if (!user || isGuest) {
        return;
      }

      const { data, error } = await supabase
        .from("analyses")
        .insert({
          user_id: user.id,
          bill_title: title,
          insurance_provider: insuranceProvider || null,
          total_billed: analysisResult.totalBilled ?? null,
          potential_savings: analysisResult.potentialSavings ?? null,
          issues_found: analysisResult.issuesFound ?? null,
          ai_result: analysisResult,
        })
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("Failed to save analysis", error);
        return;
      }

      const mapped = data ? mapRowToHistoryItem(data as AnalysisRow) : null;
      if (mapped) {
        setHistoryItems((prev) => [mapped, ...prev]);
      }
    },
    [insuranceProvider, isGuest, supabase, user]
  );

  const analyzeMutation = useMutation<AnalyzeResponse, AnalyzeBillError, AnalyzeMutationVariables>({
    mutationFn: async (variables) => {
      const formData = new FormData();
      formData.append("insuranceProvider", variables.insuranceProvider);
      if (variables.userQuestion) {
        formData.append("userQuestion", variables.userQuestion);
      }
      if (variables.inputMode === "image") {
        if (!variables.billImage) {
          throw new AnalyzeBillError("Please upload your bill image before analyzing.", 400);
        }
        formData.append("billImage", variables.billImage);
      } else {
        if (!variables.billText.trim()) {
          throw new AnalyzeBillError("Please paste your bill text before analyzing.", 400);
        }
        formData.append("billText", variables.billText.trim());
      }

      const response = await fetch("/api/analyze-bill", {
        method: "POST",
        body: formData,
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new AnalyzeBillError("Invalid response from MediGuard AI. Please try again.", response.status);
      }

      if (!response.ok) {
        const errorMessage =
          typeof payload === "object" && payload !== null && "error" in payload
            ? (payload as { error?: string }).error
            : undefined;
        throw new AnalyzeBillError(
          errorMessage || "Something went wrong analyzing the bill. Please try again.",
          response.status
        );
      }

      const data = payload as AnalyzeResponse;
      if (!data?.analysis) {
        throw new AnalyzeBillError("Received an unexpected response from MediGuard AI.", response.status);
      }
      return data;
    },
    retry(failureCount, error) {
      const status = error?.status;
      if (status && status >= 400 && status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    onSuccess(data) {
      setAnalysis(data.analysis);
      setExpandedRow(null);
      setApiError(null);
      void saveAnalysisToHistory(data.analysis);
    },
    onError(error) {
      setApiError(error?.message || "Something went wrong analyzing the bill. Please try again.");
    },
  });

  const isAnalyzing = analyzeMutation.isPending;
  const handleHistoryClick = (historyId: string) => {
    const item = historyItems.find((entry) => entry.id === historyId);
    if (!item) return;
    setAnalysis(item.analysis);
    setExpandedRow(null);
    setApiError(null);
    setActiveBillId(historyId);
    setIsMobileSidebarOpen(false);
    setSubmittedQuestion(null);
    setCopyConfirmationVisible(false);
    analyzeMutation.reset();
    setLastVariables(null);
  };

  const resetWorkspace = () => {
    setBillImage(null);
    setBillText("");
    setUserQuestion("");
    setAnalysis(null);
    setApiError(null);
    setUploadError(null);
    setActiveBillId(null);
    setExpandedRow(null);
    setSubmittedQuestion(null);
    setCopyConfirmationVisible(false);
    analyzeMutation.reset();
    setLastVariables(null);
    setIsMobileSidebarOpen(false);
  };

  const handleAnalyze = () => {
    if (!insuranceProvider) {
      setShowProviderModal(true);
      return;
    }

    if (inputMode === "image") {
      if (!billImage) {
        setApiError("Please upload your bill image before analyzing.");
        return;
      }
    } else if (!billText.trim()) {
      setApiError("Please paste your bill text before analyzing.");
      return;
    }

    if (isGuest) {
      const storageCount = Number(localStorage.getItem("mediguard_guest_analysis_count") ?? "0");
      if (storageCount >= 3) {
        openSignInModal("login");
        setShowLimitModal(true);
        return;
      }
      localStorage.setItem("mediguard_guest_analysis_count", String(storageCount + 1));
    }

    const trimmedQuestion = userQuestion.trim();
    setSubmittedQuestion(trimmedQuestion || null);
    setCopyConfirmationVisible(false);

    setApiError(null);
    setAnalysis(null);
    setActiveBillId(null);
    setExpandedRow(null);
    setActiveLoadingStep(0);

    const variables: AnalyzeMutationVariables = {
      insuranceProvider,
      inputMode,
      billImage,
      billText: billText.trim(),
      userQuestion: trimmedQuestion,
    };

    setLastVariables(variables);
    analyzeMutation.mutate(variables);
  };

  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }
    const interval = setInterval(() => {
      setActiveLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2000);
    return () => {
      clearInterval(interval);
      setActiveLoadingStep(0);
    };
  }, [isAnalyzing]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!user) {
        if (!active) return;
        setHistoryItems([]);
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      const { data, error } = await supabase
        .from("analyses")
        .select("id, created_at, bill_title, insurance_provider, ai_result")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Failed to load saved analyses", error);
        setHistoryItems([]);
        setHistoryLoading(false);
        return;
      }

      const mapped =
        data
          ?.map((row) => mapRowToHistoryItem(row as AnalysisRow))
          .filter((item): item is HistoryItem => Boolean(item)) ?? [];

      setHistoryItems(mapped);
      setHistoryLoading(false);
    };

    void run();

    return () => {
      active = false;
    };
  }, [supabase, user]);


  const handleCopyLetter = async () => {
    if (!analysis?.disputeLetter) return;
    try {
      await navigator.clipboard.writeText(analysis.disputeLetter);
      setCopyConfirmationVisible(true);
      setTimeout(() => setCopyConfirmationVisible(false), 2000);
    } catch (error) {
      console.error("Failed to copy dispute letter", error);
    }
  };

  const handleRetry = () => {
    if (!lastVariables) return;
    setApiError(null);
    setActiveLoadingStep(0);
    analyzeMutation.mutate(lastVariables);
  };

  const resolvedUserName = !isGuest ? displayName : "Guest session";
  const visibleHistory = user ? historyItems : [];
  const isHistoryListLoading = user ? historyLoading : false;

  useEffect(() => {
    if (!showAccountMenu) return;
    const handleOutside = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [showAccountMenu]);

  const userInitials = getInitials(resolvedUserName);

  const resetAuthForm = () => {
    setSignUpFirstName("");
    setSignUpLastName("");
    setSignInEmail("");
    setSignInPassword("");
    setSignInConfirmPassword("");
    setSignInError(null);
    setSignUpFieldErrors({});
  };

  const openSignInModal = (mode?: "signup" | "login") => {
    if (mode) {
      setAuthMode(mode);
    }
    resetAuthForm();
    setShowSignInModal(true);
  };

  const handleModalClose = () => {
    setShowSignInModal(false);
    resetAuthForm();
  };

  const handleAuthModeChange = (mode: "signup" | "login") => {
    setAuthMode(mode);
    resetAuthForm();
  };

  const handleModalSubmit = async () => {
    setSignInError(null);
    if (authMode === "signup") {
      const fieldErrors: typeof signUpFieldErrors = {};
      const firstTrimmed = signUpFirstName.trim();
      const lastTrimmed = signUpLastName.trim();
      const emailTrimmed = signInEmail.trim();

      if (!firstTrimmed) {
        fieldErrors.firstName = "First name is required.";
      }
      if (!lastTrimmed) {
        fieldErrors.lastName = "Last name is required.";
      }
      if (!emailTrimmed) {
        setSignInError("Email is required.");
      }
      if (!signInPassword) {
        fieldErrors.password = "Password is required.";
      }
      if (!signInConfirmPassword) {
        fieldErrors.confirmPassword = "Confirm your password.";
      } else if (signInPassword !== signInConfirmPassword) {
        fieldErrors.confirmPassword = "Passwords do not match.";
      }

      setSignUpFieldErrors(fieldErrors);
      if (
        Object.keys(fieldErrors).length > 0 ||
        !emailTrimmed
      ) {
        return;
      }

      setIsSigningIn(true);
      const result = await signUp({
        firstName: firstTrimmed,
        lastName: lastTrimmed,
        email: emailTrimmed,
        password: signInPassword,
      });
      if (result.error) {
        setSignInError(result.error);
      } else {
        handleModalClose();
      }
      setIsSigningIn(false);
      return;
    }

    if (!signInEmail.trim() || !signInPassword.trim()) {
      setSignInError("Enter both email and password.");
      return;
    }
    setSignUpFieldErrors({});
    setIsSigningIn(true);
    const result = await signIn(signInEmail.trim(), signInPassword);
    if (result.error) {
      setSignInError(result.error);
    } else {
      handleModalClose();
    }
    setIsSigningIn(false);
  };

  const handleAccountClick = () => {
    if (isGuest) return;
    setShowAccountMenu((prev) => !prev);
  };

  const handleAccountMenuLogout = () => {
    if (isGuest) return;
    setShowAccountMenu(false);
    void signOut();
  };

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMobileSidebarOpen]);

  const loadingPanel = (
    <motion.div
      key="loading"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-3xl rounded-[36px] border border-blue-100 bg-white/90 p-8 text-center shadow-xl"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">
        MediGuard AI
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        Analyzing your hospital bill
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        This takes a few seconds as we read each line item and compare it to CPT benchmarks.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {loadingSteps.map((step, index) => {
          const isActive = activeLoadingStep === index;
          return (
            <motion.div
              key={step.label}
              className="flex flex-col items-center gap-3 rounded-3xl border border-slate-100 bg-slate-50/60 p-4 text-center"
              animate={{
                opacity: isActive ? 1 : 0.5,
                scale: isActive ? 1 : 0.96,
              }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-inner"
                animate={
                  isActive
                    ? { scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }
                    : { scale: 1, opacity: 0.8 }
                }
                transition={{
                  duration: 1.6,
                  repeat: isActive ? Infinity : 0,
                  repeatType: "loop",
                }}
              >
                <Image
                  src={step.icon}
                  alt={step.label}
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
              </motion.div>
              <p className="text-sm font-semibold text-slate-900">{step.label}</p>
              <p className="text-xs text-slate-500">{step.subtext}</p>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-8 h-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={activeLoadingStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium text-blue-600"
          >
            {loadingSteps[activeLoadingStep].label}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const resultsPanel = analysis ? (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4"
    >
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
            Analysis results
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            MediGuard AI findings
          </h1>
          <p className="text-sm text-slate-600">{analysis.summary}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total billed" value={formatCurrency(analysis.totalBilled)} className="w-full" />
          <StatCard
            label="Potential savings"
            value={formatCurrency(analysis.potentialSavings)}
            accent="text-emerald-600"
            className="w-full"
          />
          <StatCard
            label="Issues found"
            value={analysis.issuesFound.toString()}
            accent="text-rose-600"
            className="w-full"
          />
        </div>

        {submittedQuestion ? (
        <Card className="w-full space-y-4 rounded-[32px] border border-blue-100 bg-blue-50/60 p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Your question
                </p>
                <p className="mt-2 text-sm text-slate-800">{submittedQuestion}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                  Answer from MediGuard AI
                </p>
                {analysis.questionAnswer ? (
                  <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                    {analysis.questionAnswer}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    MediGuard AI did not return an answer for this question. Please try
                    again.
                  </p>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="w-full space-y-4 rounded-[32px]">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">CPT code analysis</p>
              <p className="text-sm text-slate-500">
                Tap a line item to see why MediGuard classified it this way.
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2">CPT code</th>
                  <th className="px-2 py-2">Description</th>
                  <th className="px-2 py-2 text-right">Amount</th>
                  <th className="px-2 py-2 text-right">Status</th>
                  <th className="px-2 py-2 text-right" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {analysis.items.map((item, index) => {
                  const rowId = `${item.cptCode}-${index}`;
                  const isExpanded = expandedRow === rowId;
                  const itemSavings = calculateItemSavings(item);
                  const referenceUrl = `https://www.google.com/search?q=${encodeURIComponent(
                    `CPT ${item.cptCode || ""}`
                  )}`;
                  return (
                    <React.Fragment key={rowId}>
                      <tr
                        className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                        onClick={() =>
                          setExpandedRow((prev) => (prev === rowId ? null : rowId))
                        }
                        aria-expanded={isExpanded}
                      >
                        <td className="px-2 py-3 font-semibold text-slate-900">
                          {item.cptCode}
                        </td>
                        <td className="px-2 py-3 text-slate-700">{item.description}</td>
                        <td className="px-2 py-3 text-right font-mono text-slate-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <StatusPill status={item.status} />
                        </td>
                        <td className="px-2 py-3 text-right">
                          <ChevronIcon expanded={isExpanded} />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-slate-200 bg-white">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                              <p className="text-sm font-semibold text-slate-900">
                                {item.status === "incorrect"
                                  ? "Why this may be incorrect"
                                  : "Why this appears correct"}
                              </p>
                              <p className="text-sm text-slate-600 whitespace-pre-line">
                                {item.why}
                              </p>
                              <p className="text-sm text-slate-600">
                                Potential savings:{" "}
                                {itemSavings > 0 ? formatCurrency(itemSavings) : "—"}
                              </p>
                              <a
                                href={referenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-blue-600"
                              >
                                View CPT code reference
                              </a>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4 md:hidden">
            {analysis.items.map((item, index) => {
              const rowId = `${item.cptCode}-${index}`;
              const isExpanded = expandedRow === rowId;
              const itemSavings = calculateItemSavings(item);
              const referenceUrl = `https://www.google.com/search?q=${encodeURIComponent(
                `CPT ${item.cptCode || ""}`
              )}`;
              return (
                <div key={rowId} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between"
                    onClick={() => setExpandedRow((prev) => (prev === rowId ? null : rowId))}
                    aria-expanded={isExpanded}
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">{item.cptCode}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-slate-900">{formatCurrency(item.amount)}</p>
                      <StatusPill status={item.status} />
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 space-y-3 text-sm"
                      >
                        <p className="font-semibold text-slate-900">
                          {item.status === "incorrect"
                            ? "Why this may be incorrect"
                            : "Why this appears correct"}
                        </p>
                        <p className="text-slate-600 whitespace-pre-line">{item.why}</p>
                        <p className="text-slate-600">
                          Potential savings: {itemSavings > 0 ? formatCurrency(itemSavings) : "—"}
                        </p>
                        <a
                          href={referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-blue-600"
                        >
                          View CPT code reference
                        </a>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="w-full space-y-4 rounded-[32px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Draft dispute letter</p>
              <p className="text-xs text-slate-500">
                Share this with the billing office after personalizing it.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLetter}
            >
              Copy letter
            </Button>
          </div>
          {copyConfirmationVisible ? (
            <p className="text-xs font-semibold text-emerald-600">
              Letter copied to clipboard
            </p>
          ) : null}
          <div className="space-y-4 text-sm text-slate-600 whitespace-pre-line">
            {analysis.disputeLetter}
          </div>
        </Card>
        <Button variant="ghost" onClick={resetWorkspace}>
          Analyze another bill
        </Button>
      </motion.div>
  ) : null;

  const formPanel = (
    <motion.div
      key="form"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="mx-auto space-y-6"
    >
        <Card className="mx-auto max-w-3xl space-y-6 rounded-[32px] border-transparent">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold">Analyze a hospital bill</h1>
            <p className="text-sm text-slate-600">
              Upload a photo/scan of your bill or paste the text, add a question if needed,
              and MediGuard AI will explain what to look out for.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Insurance provider
            </label>
            <select
              value={insuranceProvider}
              onChange={(event) => setInsuranceProvider(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select provider</option>
              {providerOptions.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-full border border-slate-200 bg-slate-50 p-1 text-sm text-slate-600">
            <div className="grid grid-cols-2 gap-1">
              {["image", "text"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`rounded-full px-4 py-2 capitalize ${
                    inputMode === mode ? "bg-white text-slate-900 shadow" : ""
                  }`}
                  onClick={() => setInputMode(mode as "image" | "text")}
                  style={{ cursor: "pointer" }}
                >
                  {mode === "image" ? "Upload image / file" : "Paste text"}
                </button>
              ))}
            </div>
          </div>

          {inputMode === "image" ? (
            <FileUploadArea
              state={uploadError ? "error" : "idle"}
              errorMessage={uploadError ?? undefined}
              selectedFileName={billImage?.name ?? null}
              onFileSelect={(files) => {
                const file = files[0];
                if (!file) {
                  setUploadError("Please select a file.");
                  setBillImage(null);
                  return;
                }
                if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
                  setUploadError("Only image or PDF files are supported.");
                  setBillImage(null);
                  return;
                }
                setBillImage(file);
                setUploadError(null);
              }}
            />
          ) : (
            <Textarea
              rows={10}
              value={billText}
              onChange={(event) => setBillText(event.target.value)}
              placeholder="Paste the bill text, including the services, codes, and charges."
            />
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Optional question for the AI
            </p>
            <Textarea
              rows={4}
              value={userQuestion}
              onChange={(event) => setUserQuestion(event.target.value)}
              placeholder="Example: “Can you check if the imaging charges look duplicated?”"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleAnalyze}
            disabled={
              isAnalyzing ||
              (inputMode === "image" ? !billImage : !billText.trim())
            }
          >
            Analyze bill
          </Button>

          {apiError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
              <p>{apiError}</p>
              {lastVariables ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={handleRetry} disabled={isAnalyzing}>
                    Retry
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>
      </motion.div>
  );

  const mainContent = (
    <AnimatePresence mode="wait">
      {isAnalyzing ? loadingPanel : resultsPanel ?? formPanel}
    </AnimatePresence>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      <aside
        className={`hidden h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:flex ${
          isSidebarOpen ? "w-72 px-5 py-6" : "w-12 px-2 py-6 items-center"
        }`}
      >
        <div className="mb-6 flex w-full items-center justify-between">
          {isSidebarOpen && (
            <div>
              <p className="text-sm font-semibold tracking-wide text-blue-500">
                MediGuard AI
              </p>
              <p className="text-xs text-slate-500">
                {resolvedUserName}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-sm"
          >
            <svg
              className={`h-4 w-4 transition-transform ${
                isSidebarOpen ? "" : "rotate-180"
              }`}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.5 5L7.5 10l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {isSidebarOpen && (
          <>
            <Button className="w-full" onClick={resetWorkspace}>
              New analysis
            </Button>
            <div className="mt-6 flex-1 overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                History
              </p>
              <div className="mt-4 h-full space-y-2 overflow-y-auto pr-1">
                {isGuest && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                    <p>Sign in to save and review previous analyses.</p>
                    <Button size="sm" className="mt-3" onClick={() => openSignInModal("login")}>
                      Log in
                    </Button>
                  </div>
                )}
                {isHistoryListLoading ? (
                  <p className="text-xs text-slate-500">Loading history…</p>
                ) : (
                  visibleHistory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleHistoryClick(item.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        activeBillId === item.id
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:text-blue-700"
                      }`}
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{item.summary}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="relative mt-4" ref={accountMenuRef}>
              <button
                type="button"
                onClick={handleAccountClick}
                disabled={isGuest}
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${
                  isGuest ? "cursor-not-allowed text-slate-400" : "cursor-pointer hover:bg-slate-100"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {userInitials}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {resolvedUserName}
                </span>
              </button>
              {!isGuest && showAccountMenu && (
                <div className="absolute bottom-full left-0 mb-2 min-w-[140px] rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-lg">
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-2 text-left text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    onClick={handleAccountMenuLogout}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="relative flex h-full w-[85vw] max-w-xs flex-col border-r border-slate-200 bg-white px-5 py-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold tracking-wide text-blue-500">
                  MediGuard AI
                </p>
                <p className="text-xs text-slate-500">{resolvedUserName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Close sidebar"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-sm"
              >
                <svg
                  className="h-4 w-4 rotate-180"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.5 5L7.5 10l5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <Button className="w-full" onClick={() => { resetWorkspace(); setIsMobileSidebarOpen(false); }}>
              New analysis
            </Button>
            <div className="mt-6 flex-1 overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                History
              </p>
              <div className="mt-4 h-full space-y-2 overflow-y-auto pr-1">
                {isGuest && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                    <p>Sign in to save and review previous analyses.</p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setIsMobileSidebarOpen(false);
                        openSignInModal("login");
                      }}
                    >
                      Log in
                    </Button>
                  </div>
                )}
                {isHistoryListLoading ? (
                  <p className="text-xs text-slate-500">Loading history…</p>
                ) : (
                  visibleHistory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        handleHistoryClick(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        activeBillId === item.id
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:text-blue-700"
                      }`}
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{item.summary}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleAccountMenuLogout}
              disabled={isGuest}
              className={`mt-4 flex items-center gap-3 rounded-xl px-2 py-2 text-left transition ${
                isGuest ? "cursor-not-allowed text-slate-400" : "hover:bg-slate-100"
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {userInitials}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {resolvedUserName}
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2 text-blue-600">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open history"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 5l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="text-sm font-semibold tracking-wide">MediGuard AI</span>
          </div>
          <p className="text-xs text-slate-500">{resolvedUserName}</p>
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          {mainContent}
        </main>
      </div>

      {showLimitModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
          <Card className="max-w-sm space-y-4 rounded-3xl">
            <p className="text-lg font-semibold text-slate-900">
              Free analyses used
            </p>
            <p className="text-sm text-slate-600">
              You’ve used your 3 free analyses as a guest. Please sign in to keep
              using MediGuard AI.
            </p>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => {
                  setShowLimitModal(false);
                  openSignInModal("login");
                }}
              >
                Log in
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowLimitModal(false)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
      {showSignInModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-md space-y-6 rounded-3xl p-8">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-900">
                Sign in to save your analyses
              </p>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 hover:scale-105 cursor-pointer"
                onClick={handleModalClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="flex rounded-full border border-slate-200 bg-slate-50/70 p-1 text-sm font-semibold text-slate-500">
              {["signup", "login"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleAuthModeChange(mode as "signup" | "login")}
                  className={cn(
                    "flex-1 rounded-full px-3 py-2 transition",
                    authMode === mode
                      ? "bg-white text-slate-900 shadow-sm"
                      : "hover:text-slate-900"
                  )}
                >
                  {mode === "signup" ? "Sign In" : "Log In"}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-600">
              {authMode === "signup"
                ? "Create a free MediGuard AI session to save your history and pick up where you left off."
                : "Log back in to access your saved analyses and history."}
            </p>
            <div className="space-y-4">
              {authMode === "signup" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Input
                      type="text"
                      value={signUpFirstName}
                      onChange={(event) => setSignUpFirstName(event.target.value)}
                      placeholder="First name"
                    />
                    {signUpFieldErrors.firstName ? (
                      <p className="text-xs text-rose-600">{signUpFieldErrors.firstName}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <Input
                      type="text"
                      value={signUpLastName}
                      onChange={(event) => setSignUpLastName(event.target.value)}
                      placeholder="Last name"
                    />
                    {signUpFieldErrors.lastName ? (
                      <p className="text-xs text-rose-600">{signUpFieldErrors.lastName}</p>
                    ) : null}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <Input
                  type="email"
                  value={signInEmail}
                  onChange={(event) => setSignInEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1">
                <Input
                  type="password"
                  value={signInPassword}
                  onChange={(event) => setSignInPassword(event.target.value)}
                  placeholder={authMode === "signup" ? "Create a password" : "Password"}
                />
                {signUpFieldErrors.password ? (
                  <p className="text-xs text-rose-600">{signUpFieldErrors.password}</p>
                ) : null}
              </div>
              {authMode === "signup" && (
                <div className="space-y-1">
                  <Input
                    type="password"
                    value={signInConfirmPassword}
                    onChange={(event) => setSignInConfirmPassword(event.target.value)}
                    placeholder="Confirm password"
                  />
                  {signUpFieldErrors.confirmPassword ? (
                    <p className="text-xs text-rose-600">{signUpFieldErrors.confirmPassword}</p>
                  ) : null}
                </div>
              )}
            </div>
            {signInError ? (
              <p className="text-sm text-rose-600">{signInError}</p>
            ) : null}
            <Button
              className="w-full cursor-pointer py-4 text-base shadow hover:shadow-lg"
              onClick={handleModalSubmit}
              disabled={isSigningIn}
            >
              {isSigningIn
                ? authMode === "signup"
                  ? "Signing up..."
                  : "Logging in..."
                : authMode === "signup"
                ? "Sign In"
                : "Log In"}
            </Button>
          </Card>
        </div>
      )}
      {showProviderModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
          <Card className="max-w-sm space-y-4 rounded-3xl">
            <p className="text-lg font-semibold text-slate-900">Select your insurer</p>
            <p className="text-sm text-slate-600">
              Please choose your insurance provider so MediGuard AI can compare your bill
              against typical plan pricing.
            </p>
            <Button onClick={() => setShowProviderModal(false)}>
              Got it
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  className,
}: {
  label: string;
  value: string;
  accent?: string;
  className?: string;
}) {
  return (
    <Card className={cn("space-y-2 rounded-[28px]", className)}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-2xl font-semibold ${accent ?? "text-slate-900"}`}>{value}</p>
    </Card>
  );
}

function calculateItemSavings(item: BillAnalysis["items"][number]) {
  if (item.status !== "incorrect") return 0;
  if (typeof item.estimatedReasonableAmount !== "number") return 0;
  const delta = item.amount - item.estimatedReasonableAmount;
  return delta > 0 ? delta : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function StatusPill({ status }: { status: LineItemStatus }) {
  const map: Record<LineItemStatus, { bg: string; label: string }> = {
    correct: {
      bg: "bg-emerald-100 text-emerald-700",
      label: "Correct",
    },
    incorrect: {
      bg: "bg-rose-100 text-rose-700",
      label: "Incorrect",
    },
  };

  const styles = map[status];

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles.bg}`}>
      {styles.label}
    </span>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-slate-400 transition-transform ${
        expanded ? "-rotate-180" : ""
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.053l3.71-3.822a.75.75 0 1 1 1.08 1.04l-4.243 4.374a.75.75 0 0 1-1.086 0L5.25 8.27a.75.75 0 0 1-.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "MG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function buildHistoryTitle(provider?: string | null, createdAt?: string) {
  const dateObj = createdAt ? new Date(createdAt) : new Date();
  const formatted = dateObj.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return provider ? `${provider} bill – ${formatted}` : `Saved analysis – ${formatted}`;
}

function buildHistorySummary(analysis: BillAnalysis, provider?: string | null) {
  if (analysis.summary) return analysis.summary;
  if (analysis.issuesFound > 0) {
    return `MediGuard flagged ${analysis.issuesFound} potential issue${analysis.issuesFound === 1 ? "" : "s"}.`;
  }
  if (provider) return `Insurance: ${provider}`;
  return "Saved MediGuard analysis.";
}

function mapRowToHistoryItem(row: AnalysisRow): HistoryItem | null {
  if (!row.ai_result) return null;
  const analysis = row.ai_result as BillAnalysis;
  return {
    id: row.id,
    title: row.bill_title || buildHistoryTitle(row.insurance_provider, row.created_at ?? undefined),
    summary: buildHistorySummary(analysis, row.insurance_provider),
    createdAt: row.created_at ?? new Date().toISOString(),
    analysis,
  };
}
