import { optionalEnv } from "@/lib/config";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"] as const;

function parseGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  try {
    const jsonStart = raw.indexOf("{");
    if (jsonStart >= 0) {
      const parsed = JSON.parse(raw.slice(jsonStart)) as {
        error?: { code?: number; message?: string; status?: string };
      };
      const apiMessage = parsed.error?.message;
      const code = parsed.error?.code;

      if (code === 503 || parsed.error?.status === "UNAVAILABLE") {
        return "AI is temporarily busy. Please wait a moment and try again.";
      }
      if (code === 429) {
        return "AI rate limit reached. Please try again in a minute.";
      }
      if (apiMessage) {
        return apiMessage;
      }
    }
  } catch {
    // fall through to generic handling
  }

  if (raw.includes("API key") || raw.includes("API_KEY")) {
    return "AI autofill is not configured on the server. Contact support.";
  }

  return "AI generation failed. Please try again.";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateVehicleAutofill(input: {
  make: string;
  model: string;
  year: number;
}): Promise<{
  title: string;
  category: string;
  transmission: string;
  fuel: string;
  seats: number;
  description: string;
}> {
  const apiKey = optionalEnv("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("AI content generation is not configured. Set GEMINI_API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert Australian automotive cataloging system.
Analyze the following vehicle:
Year: ${input.year}
Make: ${input.make}
Model: ${input.model}

Provide the standard factory specifications for this vehicle, and write a compelling 2-paragraph SEO-friendly vehicle rental description for it available for hire in Australia. Tone: professional, trustworthy, Australian English. No bullet points. Max 120 words.
Return the data exactly matching the requested JSON schema.`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "An attractive SEO-friendly listing title, e.g. '2023 Toyota RAV4 Hybrid (AWD)'",
      },
      category: {
        type: Type.STRING,
        description: "The vehicle category",
        enum: ["Sedan", "SUV", "People mover", "Van", "Ute", "Luxury"],
      },
      transmission: {
        type: Type.STRING,
        description: "The transmission type",
        enum: ["Automatic", "Manual"],
      },
      fuel: {
        type: Type.STRING,
        description: "The fuel type",
        enum: ["Petrol", "Diesel", "Hybrid", "Electric"],
      },
      seats: {
        type: Type.INTEGER,
        description: "Standard seating capacity (e.g. 2, 5, 7, 8)",
      },
      description: {
        type: Type.STRING,
        description: "The 2-paragraph SEO description",
      },
    },
    required: ["title", "category", "transmission", "fuel", "seats", "description"],
  };

  let lastError: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          },
        });

        if (!response.text) {
          throw new Error("AI returned empty content.");
        }

        const data = JSON.parse(response.text);

        if (!data.title || !data.category || !data.transmission || !data.fuel || !data.seats || !data.description) {
          throw new Error("AI returned incomplete data structure.");
        }

        return data;
      } catch (err) {
        lastError = err;
        console.error(`[Gemini API Error] model=${model} attempt=${attempt + 1}:`, err);

        const message = err instanceof Error ? err.message : String(err);
        const isTransient =
          message.includes("503") ||
          message.includes("UNAVAILABLE") ||
          message.includes("429") ||
          message.includes("high demand");

        if (isTransient && attempt === 0) {
          await sleep(800);
          continue;
        }

        break;
      }
    }
  }

  throw new Error(parseGeminiError(lastError));
}
