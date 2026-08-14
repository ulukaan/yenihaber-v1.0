import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/cn";
import styles from "./button.module.css";

const buttonVariants = cva(styles.root, {
  variants: {
    variant: {
      primary: styles.primary,
      secondary: styles.secondary,
      success: styles.success,
      danger: styles.danger,
      warning: styles.warning,
      outline: styles.outline,
      ghost: styles.ghost,
      link: styles.link,
    },
    size: {
      sm: styles.sm,
      md: styles.md,
      lg: styles.lg,
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    children: ReactNode;
    loading?: boolean;
  };

/** Ortak buton — web ve admin aynı bileşeni kullanır */
export function Button({
  className,
  variant,
  size,
  children,
  type = "button",
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : null}
      <span className={loading ? styles.labelHidden : undefined}>{children}</span>
    </button>
  );
}
