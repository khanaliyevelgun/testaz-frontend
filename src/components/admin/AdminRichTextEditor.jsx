"use client";

import { useEffect, useRef, useState } from "react";

const toolbar = [
  "bold",
  "italic",
  "underline",
  "|",
  "bulletedList",
  "numberedList",
  "outdent",
  "indent",
  "|",
  "undo",
  "redo",
];

const AdminRichTextEditor = ({ value = "", onChange, onUpload }) => {
  const hostRef = useRef(null);
  const editorRef = useRef(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onUploadRef = useRef(onUpload);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    valueRef.current = value;
    if (editorRef.current && editorRef.current.getData() !== value) {
      editorRef.current.setData(value || "");
    }
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onUploadRef.current = onUpload;
  }, [onUpload]);

  useEffect(() => {
    let isMounted = true;

    const loadEditor = async () => {
      try {
        const module = await import("@ckeditor/ckeditor5-build-classic");
        const ClassicEditor = module.default?.default || module.default || module;
        if (!ClassicEditor?.create || !hostRef.current) {
          setFallback(true);
          return;
        }

        function uploadPlugin(editor) {
          editor.plugins.get("FileRepository").createUploadAdapter = (loader) => ({
            upload: async () => {
              const file = await loader.file;
              const url = await onUploadRef.current?.(file);

              if (!url) {
                throw new Error("Upload URL is empty.");
              }

              return { default: url };
            },
            abort: () => {},
          });
        }

        const editor = await ClassicEditor.create(hostRef.current, {
          extraPlugins: [uploadPlugin],
          toolbar,
        });

        if (!isMounted) {
          await editor.destroy();
          return;
        }

        editorRef.current = editor;
        editor.setData(valueRef.current || "");
        editor.model.document.on("change:data", () => {
          onChangeRef.current?.(editor.getData());
        });
      } catch (error) {
        console.error("CKEditor load error:", error);
        if (isMounted) setFallback(true);
      }
    };

    loadEditor();

    return () => {
      isMounted = false;
      if (editorRef.current) {
        editorRef.current.destroy().catch(() => {});
        editorRef.current = null;
      }
    };
  }, []);

  if (fallback) {
    return (
      <textarea
        className='common-input rounded-12'
        rows='5'
        maxLength='8000'
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    );
  }

  return <div className='question-editor'><div ref={hostRef} /></div>;
};

export default AdminRichTextEditor;
