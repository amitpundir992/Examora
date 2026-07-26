"use client";

import { useState } from "react";
import { ArrowUpRight, CreditCard } from "lucide-react";
import { Button, Spinner } from "@/components/ui";

export function CheckoutButton({
  interval,
  children,
}: {
  interval: "monthly" | "yearly";
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to start Checkout");
      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start Checkout");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={checkout} disabled={loading} className="w-full">
        {loading ? <Spinner /> : <ArrowUpRight className="h-4 w-4" />}
        {loading ? "Opening Checkout..." : children}
      </Button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to open billing");
      window.location.assign(data.url);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "Unable to open billing");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button variant="secondary" onClick={openPortal} disabled={loading}>
        {loading ? <Spinner /> : <CreditCard className="h-4 w-4" />}
        {loading ? "Opening..." : "Manage billing"}
      </Button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
