"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ActionButtonProps {
  action: () => Promise<void>;
  label: string;
  loadingLabel?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  icon?: React.ReactNode;
}

export function ActionButton({
  action,
  label,
  loadingLabel = "Processing...",
  variant = "default",
  size = "sm",
  className = "",
  icon,
}: ActionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      try {
        await action();
        toast.success("Action completed successfully");
        router.refresh();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
        toast.error(errorMsg);
      }
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          {icon && <span className="mr-1">{icon}</span>}
          {label}
        </>
      )}
    </Button>
  );
}
