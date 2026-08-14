import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  wide?: boolean;
  children?: ReactNode;
  className?: string;
};

/**
 * Tüm admin sayfalarında aynı başlık düzeni.
 */
export function AdminPage({
  title,
  subtitle,
  actions,
  wide = false,
  children,
  className,
}: Props) {
  return (
    <div
      className={["adminPage", wide ? "adminPageWide" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="adminHead">
        <div className="adminHeadText">
          <h1 className="adminTitle">{title}</h1>
          {subtitle ? <p className="adminSub">{subtitle}</p> : null}
        </div>
        {actions ? <div className="adminActions">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
