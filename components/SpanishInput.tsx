"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

const ACCENTS = ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"];

export interface SpanishInputHandle {
  focus: () => void;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  /** Like disabled, but keeps the input focusable so Enter still fires onEnter. */
  readOnly?: boolean;
  /** Render an auto-growing textarea (multi-word notes). Enter = newline, Cmd/Ctrl+Enter = onEnter. */
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  showAccents?: boolean;
}

/** Text input with a clickable Spanish accent bar (for keyboards without dead keys). */
export const SpanishInput = forwardRef<SpanishInputHandle, Props>(function SpanishInput(
  { value, onChange, onEnter, onBlur, disabled, readOnly, multiline, rows = 2, placeholder, className, showAccents = true },
  ref
) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  // Grow a textarea to fit its content.
  const autoGrow = () => {
    const el = inputRef.current;
    if (el && multiline) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };
  useEffect(() => { autoGrow(); }, [value, multiline]);

  const insert = (ch: string) => {
    const el = inputRef.current;
    if (!el) {
      onChange(value + ch);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + ch + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + ch.length;
      el.setSelectionRange(pos, pos);
      autoGrow();
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || !onEnter) return;
    if (e.nativeEvent.isComposing) return; // don't submit mid-IME-composition
    if (multiline) {
      // plain Enter inserts a newline; Cmd/Ctrl+Enter submits
      if ((e.metaKey || e.ctrlKey) && !e.repeat) { e.preventDefault(); onEnter(); }
      return;
    }
    if (e.repeat) return; // ignore key auto-repeat so a held Enter can't double-fire
    e.preventDefault();
    onEnter();
  };

  const common = {
    value,
    onChange: handleChange,
    onKeyDown: handleKey,
    onBlur,
    disabled,
    readOnly,
    placeholder,
    lang: "es" as const,
    autoComplete: "off",
    autoCapitalize: "off",
    autoCorrect: "off",
    spellCheck: false,
  };

  return (
    <div className="space-y-2">
      {multiline ? (
        <textarea
          {...common}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={rows}
          onInput={autoGrow}
          className={`${className ?? ""} resize-none overflow-hidden`}
        />
      ) : (
        <input {...common} ref={inputRef as React.RefObject<HTMLInputElement>} className={className} />
      )}
      {showAccents && !disabled && !readOnly && (
        <div className="flex flex-wrap gap-1.5">
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(c)}
              className="h-8 w-8 rounded-md border border-border bg-card text-base font-medium text-muted transition-colors hover:border-brand hover:text-brand"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
