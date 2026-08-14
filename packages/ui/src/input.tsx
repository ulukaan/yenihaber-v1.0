import type { InputHTMLAttributes } from "react";
import { cn } from "./lib/cn";
import styles from "./input.module.css";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  error?: string;
};

/** Erişilebilir metin girişi — label + helper + hata */
export function Input({
  className,
  label,
  helperText,
  error,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name ?? label.replace(/\s+/g, "-").toLowerCase();
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <label className={styles.field} htmlFor={inputId}>
      <span className={styles.label}>{label}</span>
      <input
        id={inputId}
        className={cn(styles.input, error && styles.invalid, className)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        {...props}
      />
      {error ? (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={helperId} className={styles.helper}>
          {helperText}
        </span>
      ) : null}
    </label>
  );
}
