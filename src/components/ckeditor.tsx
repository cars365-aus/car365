"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Link,
  List,
  Heading,
  Image,
  ImageUpload,
  Table,
  Undo
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { createClient } from "@/lib/supabase/client";

function SupabaseUploadAdapter(loader: any) {
  return {
    upload: () => {
      return loader.file.then((file: File) => new Promise((resolve, reject) => {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `blog-images/${fileName}`;

        supabase.storage.from("media").upload(filePath, file)
          .then(({ data, error }) => {
            if (error) {
              return reject(error.message);
            }
            const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(data.path);
            resolve({
              default: publicUrlData.publicUrl
            });
          })
          .catch((err) => reject(err.message));
      }));
    },
    abort: () => {}
  };
}

function MyCustomUploadAdapterPlugin(editor: any) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => {
    return SupabaseUploadAdapter(loader);
  };
}

interface Props {
  content: string;
  onChange: (html: string) => void;
}

export default function Editor({ content, onChange }: Props) {
  return (
    <div className="w-full bg-background rounded-md overflow-hidden text-slate-900 ckeditor-custom-wrapper">
      <style>{`
        .ckeditor-custom-wrapper .ck.ck-editor__main > .ck-editor__editable {
          min-height: 300px;
          background-color: var(--background);
          color: var(--foreground);
        }
        .ckeditor-custom-wrapper .ck.ck-toolbar {
          border-bottom: 1px solid var(--border) !important;
        }
        .ckeditor-custom-wrapper .ck-editor__editable_inline {
          border: 1px solid var(--border) !important;
          border-top: none !important;
        }
      `}</style>
      <CKEditor
        editor={ClassicEditor}
        data={content}
        config={{
          plugins: [
            Essentials,
            Bold,
            Italic,
            Link,
            List,
            Heading,
            Image,
            ImageUpload,
            Table,
            Undo,
            MyCustomUploadAdapterPlugin
          ],
          toolbar: [
            "heading", "|",
            "bold", "italic", "link", "bulletedList", "numberedList", "|",
            "imageUpload", "insertTable", "|",
            "undo", "redo"
          ]
        }}
        onChange={(event: any, editor: any) => {
          const data = editor.getData();
          onChange(data);
        }}
      />
    </div>
  );
}
