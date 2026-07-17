"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the CKEditor wrapper so it doesn't break SSR
const Editor = dynamic(() => import("./ckeditor"), { 
  ssr: false, 
  loading: () => (
    <div className="flex items-center justify-center min-h-[300px] border border-border rounded-md bg-muted/30">
      <Loader2 className="size-6 text-muted-foreground animate-spin" />
    </div>
  )
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  return <Editor content={content} onChange={onChange} />;
}
