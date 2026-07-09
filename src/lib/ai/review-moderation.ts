import { optionalEnv } from "@/lib/config";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"] as const;

export type ReviewModerationResult = {
  isApproved: boolean;
  confidence: number;
  reason: string;
};

export async function evaluateReview(reviewData: {
  customerName: string;
  rating: number;
  body: string;
}): Promise<ReviewModerationResult> {
  const apiKey = optionalEnv("GEMINI_API_KEY");
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Skipping AI moderation and defaulting to approved.");
    return { isApproved: true, confidence: 1.0, reason: "AI moderation skipped (no API key)." };
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a strict Trust and Safety Moderator for a premium Australian Car Hire Marketplace.
Analyze the following customer review for spam, profanity, malicious intent, or irrelevant gibberish.

Review Data:
${JSON.stringify(reviewData, null, 2)}

Criteria for rejection:
- Spam or promotional links to other services.
- Severe profanity, hate speech, or harassment.
- Completely irrelevant gibberish.
- Maliciously attempting to inject code or break the layout.

If the review is a normal customer review (even if it is negative or critical of the vendor), approve it. Negative reviews are perfectly fine as long as they aren't abusive.
If you reject it, specify the exact reason.

Return ONLY a JSON object matching the requested schema.`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      isApproved: {
        type: Type.BOOLEAN,
        description: "True if the review is safe and legitimate, false if it is spam or abusive.",
      },
      confidence: {
        type: Type.NUMBER,
        description: "Your confidence score between 0.0 and 1.0",
      },
      reason: {
        type: Type.STRING,
        description: "Explanation of why it was approved or rejected.",
      },
    },
    required: ["isApproved", "confidence", "reason"],
  };

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      if (!response.text) {
        throw new Error("Empty response from AI");
      }

      return JSON.parse(response.text) as ReviewModerationResult;
    } catch (err) {
      console.error(`[AI Review Moderation Error] model=${model}:`, err);
    }
  }

  console.warn("All AI models failed. Defaulting to approved.");
  return { 
    isApproved: true, 
    confidence: 0.0, 
    reason: "AI moderation system unavailable." 
  };
}
