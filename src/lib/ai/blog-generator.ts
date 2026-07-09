import { optionalEnv } from "@/lib/config";
import { getInternalLinkSuggestions, type BlogTopic } from "@/lib/blog/topic-queue";
import { slugify } from "@/lib/slug";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"] as const;

export interface GeneratedBlogArticle {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  bodyHtml: string;
  featuredImagePrompt: string;
  featuredImageAlt: string;
  categorySlug: string;
  tags: string[];
  primaryKeyword: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("API key") || raw.includes("API_KEY")) {
    return "Blog generation is not configured. Set GEMINI_API_KEY.";
  }
  return "Blog generation failed. Please try again.";
}

export async function generateBlogArticle(topic: BlogTopic): Promise<GeneratedBlogArticle> {
  const apiKey = optionalEnv("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("AI content generation is not configured. Set GEMINI_API_KEY.");
  }

  const linkSuggestions = getInternalLinkSuggestions()
    .slice(0, 20)
    .map((l) => `${l.label}: ${l.href}`)
    .join("\n");

  const prompt = `You are an expert Australian travel and car hire content writer for Hire Car Marketplace (hirecarmarketplace.com.au).

Write a complete SEO blog article on this topic:
Title idea: ${topic.title}
Primary keyword: ${topic.primaryKeyword}
Category: ${topic.categorySlug}
${topic.citySlug ? `Focus city: ${topic.citySlug.replace(/-/g, " ")}` : ""}

Requirements:
- 800-1200 words of valuable, original content in Australian English
- Use semantic HTML in bodyHtml: h2, h3, p, ul, ol, blockquote only (no h1, no script, no inline styles)
- Include 2-4 internal links using relative paths from this list (embed as <a href="/path">anchor text</a> in bodyHtml):
${linkSuggestions}
- End with a clear CTA paragraph linking to /search
- Natural keyword placement; no keyword stuffing
- metaTitle max 60 chars, metaDescription max 155 chars, excerpt max 280 chars
- featuredImagePrompt: detailed photorealistic scene for a blog hero image (Australian setting, no text overlay, no logos)
- featuredImageAlt: descriptive alt text max 125 chars
- tags: 3-5 relevant lowercase keywords
- slug: lowercase hyphenated URL slug derived from title

Return JSON matching the schema exactly.`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      slug: { type: Type.STRING },
      excerpt: { type: Type.STRING },
      metaTitle: { type: Type.STRING },
      metaDescription: { type: Type.STRING },
      bodyHtml: { type: Type.STRING },
      featuredImagePrompt: { type: Type.STRING },
      featuredImageAlt: { type: Type.STRING },
      categorySlug: { type: Type.STRING },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      primaryKeyword: { type: Type.STRING },
    },
    required: [
      "title", "slug", "excerpt", "metaTitle", "metaDescription",
      "bodyHtml", "featuredImagePrompt", "featuredImageAlt",
      "categorySlug", "tags", "primaryKeyword",
    ],
  };

  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema,
          },
        });

        if (!response.text) throw new Error("AI returned empty content.");

        const data = JSON.parse(response.text) as GeneratedBlogArticle;
        if (!data.title || !data.bodyHtml) {
          throw new Error("AI returned incomplete article.");
        }

        data.slug = slugify(data.slug || data.title).slice(0, 180);
        data.metaTitle = data.metaTitle.slice(0, 70);
        data.metaDescription = data.metaDescription.slice(0, 160);
        data.excerpt = data.excerpt.slice(0, 300);
        data.featuredImageAlt = data.featuredImageAlt.slice(0, 125);
        data.categorySlug = topic.categorySlug;
        data.primaryKeyword = topic.primaryKeyword;

        return data;
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        const isTransient =
          message.includes("503") ||
          message.includes("429") ||
          message.includes("UNAVAILABLE");

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
