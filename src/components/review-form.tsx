"use client";

import { useState } from "react";
import { StarRating } from "./star-rating";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea"; // Need to ensure textarea is installed
import { submitReview } from "@/app/actions/reviews";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReviewFormProps {
  leadId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ leadId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    
    if (body.length < 10) {
      toast.error("Please provide a review of at least 10 characters.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("leadId", leadId);
    formData.append("rating", rating.toString());
    formData.append("body", body);

    const result = await submitReview(formData);

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Review submitted successfully! It is pending moderation.");
      setRating(0);
      setBody("");
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Your Rating
        </label>
        <StarRating rating={rating} interactive size={28} onRatingChange={setRating} />
      </div>
      
      <div>
        <label htmlFor="review-body" className="block text-sm font-medium text-slate-700 mb-1">
          Your Review
        </label>
        <Textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell others about your experience..."
          className="min-h-[100px]"
        />
        <p className="text-xs text-slate-500 mt-1">
          Minimum 10 characters. Reviews are moderated before being published.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
}
