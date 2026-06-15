"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

const ACCENTS = ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"];

export interface SpanishInputHandle {
  focus: () => void;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showAccents?: boolean;
}

/** Text input with a clickable Spanish accent bar (for keyboards without dead keys). */
export const SpanishInput = forwardRef<SpanishInputHandle, Props>(function SpanishInput(
  { value, onChange, onEnter, disabled, placeholder, className, showAccents = true },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

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
    });
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        lang="es"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className={className}
      />
      {showAccents && !disabled && (
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
