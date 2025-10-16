"use client";
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { keymap } from "@codemirror/view";
import { indentLess, indentMore } from "@codemirror/commands";
import { EditorState, Compartment } from "@codemirror/state";

interface PythonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onClearError?: () => void;
  className?: string;
  readOnly?: boolean;
}

export function PythonCodeEditor({
  value,
  onChange,
  onClearError,
  className = "h-[60vh] border rounded-md overflow-hidden bg-white",
  readOnly = false,
}: PythonCodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const isUpdatingRef = useRef(false);
  const readOnlyCompartment = useRef(new Compartment());

  // Initialize editor once
  useEffect(() => {
    if (!editorRef.current || editorViewRef.current) return;

    const view = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        python(),
        EditorState.tabSize.of(4),
        readOnlyCompartment.current.of(EditorState.readOnly.of(readOnly)),
        keymap.of([
          { key: "Tab", run: indentMore },
          { key: "Shift-Tab", run: indentLess },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isUpdatingRef.current) {
            const newCode = update.state.doc.toString();
            onChange(newCode);
            onClearError?.();
          }
        }),
      ],
      parent: editorRef.current,
    });
    
    editorViewRef.current = view;
    
    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, []); // Only initialize once

  // Update editor content when value changes externally
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== value) {
      isUpdatingRef.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: value,
        },
      });
      isUpdatingRef.current = false;
    }
  }, [value]);

  // Update readOnly state
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    view.dispatch({
      effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [readOnly]);

  return <div ref={editorRef} className={className} />;
}
