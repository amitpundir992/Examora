"use client";

import { Button, Card } from "@/components/ui";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const icons = {
    danger: <XCircle className="h-12 w-12 text-red-500" />,
    warning: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
    info: <Info className="h-12 w-12 text-blue-500" />,
    success: <CheckCircle2 className="h-12 w-12 text-green-500" />,
  };

  const buttonVariants: Record<ConfirmDialogProps["variant"] & string, "danger" | "primary"> = {
    danger: "danger",
    warning: "danger",
    info: "primary",
    success: "primary",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md space-y-6 p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-4">
          {icons[variant]}
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="min-w-24"
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={onConfirm}
            disabled={loading}
            className="min-w-24"
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
}
