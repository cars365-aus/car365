"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo, Strikethrough } from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base dark:prose-invert focus:outline-none min-h-[300px] w-full p-4 border-t border-border/50 bg-card",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const toggleClasses = (isActive: boolean) =>
    `p-2 rounded hover:bg-muted transition-colors ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}`;

  return (
    <div className="w-full border border-border rounded-md bg-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 bg-muted/40 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={toggleClasses(editor.isActive("bold"))}
          title="Bold"
        >
          <Bold className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={toggleClasses(editor.isActive("italic"))}
          title="Italic"
        >
          <Italic className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={toggleClasses(editor.isActive("strike"))}
          title="Strikethrough"
        >
          <Strikethrough className="size-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={toggleClasses(editor.isActive("heading", { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={toggleClasses(editor.isActive("heading", { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 className="size-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toggleClasses(editor.isActive("bulletList"))}
          title="Bullet List"
        >
          <List className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toggleClasses(editor.isActive("orderedList"))}
          title="Ordered List"
        >
          <ListOrdered className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={toggleClasses(editor.isActive("blockquote"))}
          title="Quote"
        >
          <Quote className="size-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          title="Undo"
        >
          <Undo className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          title="Redo"
        >
          <Redo className="size-4" />
        </button>
      </div>

      <EditorContent editor={editor} className="bg-card w-full" />
    </div>
  );
}
