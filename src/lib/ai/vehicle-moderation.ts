import { optionalEnv } from "@/lib/config";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"] as const;

export type ModerationResult = {
  isApproved: boolean;
  confidence: number;
  reason: string;
  flagSeverity?: "low" | "medium" | "high" | "critical";
};

export async function evaluateVehicleListing(listingData: {
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  category?: string;
  pricePerDayAud?: number;
  notes?: string;
}): Promise<ModerationResult> {
  const apiKey = optionalEnv("GEMINI_API_KEY");
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Skipping AI moderation and defaulting to approved.");
    return { isApproved: true, confidence: 1.0, reason: "AI moderation skipped (no API key)." };
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a strict Trust and Safety Moderator for a premium Australian Car Hire Marketplace.
Analyze the following vehicle listing submission for potential fraud, spam, unrealistic pricing, or policy violations.

Listing Data:
${JSON.stringify(listingData, null, 2)}

Criteria for rejection (flagSeverity: high or critical):
- Unrealistic price (e.g., $1/day or $10,000/day for a normal car).
- Spam, gibberish, or profanity in the title or notes.
- Physically impossible combinations (e.g., a 2025 Toyota Corolla listed as a 20-seat Bus).
- Suspicious contact details hidden in the notes (bypassing platform messaging).

If the listing appears normal, realistic, and safe, approve it.
If you reject it, specify the exact reason and a severity level.

Return ONLY a JSON object matching the requested schema.`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      isApproved: {
        type: Type.BOOLEAN,
        description: "True if the listing is safe and realistic, false if it should be suspended.",
      },
      confidence: {
        type: Type.NUMBER,
        description: "Your confidence score between 0.0 and 1.0",
      },
      reason: {
        type: Type.STRING,
        description: "Explanation of why it was approved or rejected.",
      },
      flagSeverity: {
        type: Type.STRING,
        description: "If rejected, the severity of the violation.",
        enum: ["low", "medium", "high", "critical"],
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
          temperature: 0.1, // Low temperature for consistent moderation
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      if (!response.text) {
        throw new Error("Empty response from AI");
      }

      const result = JSON.parse(response.text) as ModerationResult;
      
      // Ensure enum validity
      if (result.flagSeverity && !["low", "medium", "high", "critical"].includes(result.flagSeverity)) {
        result.flagSeverity = "medium";
      }

      return result;
    } catch (err) {
      console.error(`[AI Moderation Error] model=${model}:`, err);
      // Fallback to next model
    }
  }

  // Fail-open strategy: If the AI is completely down, we approve the listing to not block business.
  // The system relies on manual reporting or later admin sweeps for fallback.
  console.warn("All AI models failed. Defaulting to approved.");
  return { 
    isApproved: true, 
    confidence: 0.0, 
    reason: "AI moderation system unavailable." 
  };
}
