"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerDailyBlogGeneration, type GenerateBlogState } from "./actions";

const initialState: GenerateBlogState = { status: "idle", message: "" };

export function GenerateBlogButton() {
  const [state, formAction, pending] = useActionState(
    triggerDailyBlogGeneration,
    initialState,
  );

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} className="gap-2" name="intent" value="normal">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate today&apos;s article
        </Button>
        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          size="sm"
          name="intent"
          value="force"
        >
          Force generate
        </Button>
      </form>

      {state.status !== "idle" && (
        <p
          className={`text-sm ${
            state.status === "error" ? "text-red-600" : "text-emerald-700"
          }`}
        >
          {state.message}
          {state.slug && (
            <>
              {" "}
              <a href={`/blog/${state.slug}`} className="underline" target="_blank" rel="noopener noreferrer">
                View article
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
