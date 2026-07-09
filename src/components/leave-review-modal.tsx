"use client";

import { useState, useEffect } from "react";
import { submitReview } from "@/app/actions/reviews";
import { Star, X, Loader2, MessageSquareHeart } from "lucide-react";
import { useMobileState } from "@/components/mobile-state-provider";

export function LeaveReviewModal({ leadId, vendorName }: { leadId: string; vendorName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setIsModalOpen } = useMobileState();

  // Report modal open state to the shared mobile-state context so floating
  // elements (e.g. the WhatsApp button) hide while the modal is open.
  useEffect(() => {
    setIsModalOpen(isOpen);
    return () => setIsModalOpen(false);
  }, [isOpen, setIsModalOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-[#FF5F00] p-2 sm:px-4 sm:py-2 text-sm font-medium text-[#FF5F00] hover:bg-orange-50 transition-colors"
      >
        <Star className="h-4 w-4" />
        <span className="hidden sm:inline">Leave a Review</span>
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("leadId", leadId);
    formData.append("rating", rating.toString());

    const result = await submitReview(formData);
    
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setIsOpen(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[var(--z-modal,70)] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl relative">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <MessageSquareHeart className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold text-emerald-800">Review Submitted!</h3>
            <p className="mt-2 text-sm text-emerald-600">
              Thank you for your feedback! Your review will be visible publicly once it passes moderation.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-1">Rate {vendorName}</h2>
            <p className="text-sm text-slate-500 mb-6">Your review helps others make better rental choices.</p>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-100 text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">Click a star to rate</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Share your experience</label>
                <textarea
                  name="body"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#FF5F00] focus:outline-none focus:ring-1 focus:ring-[#FF5F00]"
                  placeholder="How was the vehicle condition? Was the vendor helpful?"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
