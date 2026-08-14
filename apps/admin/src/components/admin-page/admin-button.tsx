import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "ghost" | "danger" | "default";

type Common = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

type AsButton = Common &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type AsLink = Common & {
  href: string;
  onClick?: () => void;
};

function variantClass(variant: Variant): string {
  if (variant === "primary") return "adminBtn adminBtnPrimary";
  if (variant === "ghost") return "adminBtn adminBtnGhost";
  if (variant === "danger") return "adminBtn adminBtnDanger";
  return "adminBtn";
}

/** Kurumsal admin butonu — link veya button */
export function AdminButton(props: AsButton | AsLink) {
  const { variant = "default", children, className } = props;
  const cls = [variantClass(variant), className].filter(Boolean).join(" ");

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls} onClick={props.onClick}>
        {children}
      </Link>
    );
  }

  const {
    variant: _variant,
    children: _children,
    className: _className,
    type,
    ...rest
  } = props as AsButton;
  return (
    <button type={type ?? "button"} className={cls} {...rest}>
      {children}
    </button>
  );
}
