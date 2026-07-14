"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function BiddingForm({ vehicleId, price }: { vehicleId: string; price: number }) {
  const { isLoggedIn, openAuthModal } = useAuth();
  const [amount, setAmount] = useState<number | "">(price);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      openAuthModal();
      return;
    }

    if (!amount || amount < 100) {
      toast.error("Please enter a valid offer amount (minimum $100).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, amount, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit offer");
      }

      toast.success("Offer submitted successfully! We will contact you soon.");
      router.push("/account/offers");
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Your Offer Amount ($)</Label>
        <Input
          id="amount"
          type="number"
          min="100"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || "")}
          required
        />
        <p className="text-xs text-slate-500">Listed price: ${price.toLocaleString()}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message (Optional)</Label>
        <Textarea
          id="message"
          placeholder="Any conditions or questions?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Submit Offer"}
      </Button>
    </form>
  );
}
