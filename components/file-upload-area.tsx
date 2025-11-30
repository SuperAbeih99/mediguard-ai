'use client';

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

type FileUploadState = "idle" | "loading" | "error";

interface FileUploadAreaProps {
  state?: FileUploadState;
  onFileSelect?: (files: FileList) => void;
  errorMessage?: string;
  selectedFileName?: string | null;
  accept?: string;
  supportedFormatsLabel?: string;
}

export function FileUploadArea({
  state = "idle",
  onFileSelect,
  errorMessage,
  selectedFileName,
  accept = "application/pdf,image/*",
  supportedFormatsLabel = "Upload file",
}: FileUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && onFileSelect) {
        onFileSelect(event.target.files);
      }
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (event.dataTransfer.files && onFileSelect) {
        onFileSelect(event.dataTransfer.files);
      }
    },
    [onFileSelect]
  );

  const baseClasses =
    "relative flex flex-col items-center justify-center rounded-3xl border border-dashed px-8 py-12 text-center transition";

  return (
    <div
      className={cn(
        baseClasses,
        state === "error"
          ? "border-rose-300 bg-rose-50/70"
          : "border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/40",
        isDragging && "border-blue-500 bg-blue-50/70",
        state === "loading"
          ? "opacity-75"
          : "shadow-[0_35px_60px_rgba(15,23,42,0.07)]",
        "cursor-pointer"
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="absolute -top-4 flex items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
        Supported format: {supportedFormatsLabel}
      </div>
      <p className="text-base font-semibold text-slate-900">
        Drag & drop your hospital bill
      </p>
      <p
        className={cn(
          "mt-2 max-w-sm text-sm text-slate-500",
          state === "error" && "text-rose-600"
        )}
      >
        {state === "error" && errorMessage
          ? errorMessage
          : "Attach a recent file (PDF or image) of your bill and we’ll parse every line."}
      </p>
      {selectedFileName ? (
        <p className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs text-slate-600">
          Selected: {selectedFileName}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={state === "loading"}
        >
          Upload image / file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
          disabled={state === "loading"}
        />
        <p className="text-xs text-slate-400">
          Max file size 15MB • encrypted uploads coming soon
        </p>
      </div>
    </div>
  );
}
