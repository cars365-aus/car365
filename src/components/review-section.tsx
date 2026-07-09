"use client";

import Link from "next/link";
import { useState } from "react";
import { StarRating } from "./star-rating";

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  body: string;
  created_at: string;
}

interface ReviewSectionProps {
  organizationId: string;
  vehicleId?: string;
  initialReviews: Review[];
  isLoggedIn?: boolean;
  userName?: string;
}

export default function ReviewSection({ organizationId, vehicleId, initialReviews, isLoggedIn, userName }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      organizationId,
      vehicleId,
      customerName: formData.get("customerName"),
      rating: parseInt(formData.get("rating") as string, 10),
      body: formData.get("body"),
    };

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.status === "rejected") {
          setMessage({
            type: "error",
            text: "Your review was flagged by our automated moderation system. It will not be published.",
          });
        } else {
          setMessage({
            type: "success",
            text: "Thank you! Your review has been published.",
          });
          
          // Append instantly without a page refresh
          const newReview = {
            id: Math.random().toString(36).substring(7),
            customer_name: data.customerName as string,
            rating: data.rating as number,
            body: data.body as string,
            created_at: new Date().toISOString()
          };
          setReviews([newReview, ...reviews]);
        }

        setShowForm(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setMessage({ type: "error", text: result.error?.message || result.error || "Failed to submit review" });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Customer Reviews ({reviews.length})
          {reviews.length > 0 && (
            <span className="ml-2 text-lg text-amber-500">
              {"★".repeat(Math.round(parseFloat(averageRating)))}
              <span className="ml-1 text-sm text-slate-600">({averageRating})</span>
            </span>
          )}
        </h2>
          {isLoggedIn ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              {showForm ? "Cancel" : "Write a Review"}
            </button>
          ) : (
            <Link
              href="/auth/sign-in"
              className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
            >
              Sign in to Review
            </Link>
          )}
      </div>

      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-medium">Write a Review</h3>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700">Your Name</span>
              <input
                type="text"
                name="customerName"
                required
                defaultValue={userName || ""}
                readOnly={!!userName}
                className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm ${userName ? 'bg-slate-100 text-slate-500' : ''}`}
                placeholder="e.g. John Doe"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Rating</span>
              <div className="mt-1">
                <StarRating 
                  rating={selectedRating} 
                  interactive 
                  size={28} 
                  onRatingChange={setSelectedRating} 
                />
                <input type="hidden" name="rating" value={selectedRating || ""} required />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Your Review</span>
              <textarea
                name="body"
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="Share your experience with this rental..."
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-400"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-slate-500">
            No reviews yet. Be the first to share your experience!
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex text-amber-400">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>
                <span className="font-medium">{review.customer_name}</span>
                <span className="text-sm text-slate-500">
                  {new Date(review.created_at).toLocaleDateString("en-AU", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="mt-2 text-slate-700">{review.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
