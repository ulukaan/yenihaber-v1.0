import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

/** Boş durum — tek tip */
export function AdminEmpty({ title, description, action }: Props) {
  return (
    <div className="adminEmpty" role="status">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
