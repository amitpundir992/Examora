"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { generateAttemptPDF } from "@/lib/pdf-export";
import type { AttemptReview } from "@/lib/types";

interface ExportPdfButtonProps {
  attempt: AttemptReview;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ExportPdfButton({ attempt, variant = "secondary", size = "md", className }: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 300));
      generateAttemptPDF(attempt);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      setError("Failed to generate PDF. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleExport}
        disabled={isExporting}
        className={className}
        aria-label="Export attempt as PDF"
      >
        {isExporting ? (
          <>
            <Spinner />
            <span className="ml-2">Generating...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" aria-hidden="true" />
            <span className="ml-2">Export as PDF</span>
          </>
        )}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger mt-2">
          {error}
        </p>
      )}
    </>
  );
}
