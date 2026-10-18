import { CircleCheck, Eye, Info, Inbox, OctagonAlert, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AttentionItem } from "@/lib/attention";
import type { LabFlag } from "@/lib/lab-ranges";

// ---------- chips ----------

export type Tone = "info" | "neutral" | "strong" | "attention" | "critical";

const ICON = { size: 14, strokeWidth: 1.75 } as const;

/** Severity is never colour alone: info = circle-i, watch = triangle, critical = filled octagon. */
export function Chip({ tone = "info", icon = true, children }: { tone?: Tone; icon?: boolean; children: ReactNode }) {
  const cls = tone === "info" ? "chip" : `chip chip--${tone}`;
  return (
    <span className={cls}>
      {icon && tone === "info" ? <Info {...ICON} aria-hidden="true" /> : null}
      {icon && tone === "attention" ? <TriangleAlert {...ICON} aria-hidden="true" /> : null}
      {icon && tone === "critical" ? (
        <OctagonAlert {...ICON} aria-hidden="true" style={{ fill: "var(--white)", stroke: "var(--maroon-700)" }} />
      ) : null}
      {children}
    </span>
  );
}

export function visitTone(type: string): Tone {
  return type === "Emergency" ? "strong" : type === "Inpatient" ? "info" : "neutral";
}

export function LabChip({ flag, direction }: { flag: LabFlag; direction: "high" | "low" | null }) {
  if (flag === "critical") return <Chip tone="critical">Critical {direction}</Chip>;
  if (flag === "watch") return <Chip tone="attention">{direction === "low" ? "Low" : "High"}</Chip>;
  return <Chip tone="neutral" icon={false}>In range</Chip>;
}

export function ActionChip({ action }: { action: string }) {
  if (action === "DENIED") return <Chip tone="attention">Denied</Chip>;
  if (action === "EMERGENCY_READ") return <Chip tone="critical">Emergency read</Chip>;
  if (action === "READ") return <Chip tone="info">Read</Chip>;
  if (action === "CONSENT_CHANGE") return <Chip tone="neutral" icon={false}>Consent change</Chip>;
  return <Chip tone="neutral" icon={false}>{action === "INSERT" ? "Visit recorded" : action}</Chip>;
}

// ---------- page furniture ----------

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </header>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card card-host kpi">
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{value}</div>
      {hint ? <div className="kpi__hint">{hint}</div> : null}
    </div>
  );
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <Inbox size={28} strokeWidth={1.75} aria-hidden="true" />
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Notice({ tone = "success", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  const Icon = tone === "error" ? TriangleAlert : tone === "info" ? Info : CircleCheck;
  return (
    <p className={tone === "error" ? "notice notice--error" : "notice"} role={tone === "error" ? "alert" : "status"}>
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function VisibilityNote({ children }: { children: ReactNode }) {
  return (
    <p className="visibility">
      <Eye size={16} strokeWidth={1.75} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const letters = name
    .replace(/^Dr\.\s*/, "")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={large ? "avatar lg" : "avatar"} aria-hidden="true">
      {letters}
    </span>
  );
}

// ---------- attention ----------

/** One full-width banner per view: sentence plus one action. */
export function AttentionBanner({ title, children, href, action }: { title: string; children: ReactNode; href?: string; action?: string }) {
  return (
    <div className="attention-banner" role="alert">
      <OctagonAlert size={22} strokeWidth={1.75} aria-hidden="true" />
      <div className="attention-banner__body">
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
      {href && action ? (
        <Link className="btn btn--critical btn--sm" href={href}>
          {action}
        </Link>
      ) : null}
    </div>
  );
}

/** "Needs attention (n)": top three items, critical first, with a View all link beyond that. */
export function AttentionSummary({ items, showAll = false, viewAllHref }: { items: AttentionItem[]; showAll?: boolean; viewAllHref: string }) {
  if (items.length === 0) {
    return (
      <section className="calm" id="attention" aria-label="Needs attention">
        <CircleCheck size={20} strokeWidth={1.75} aria-hidden="true" />
        <p>Nothing needs your attention right now.</p>
      </section>
    );
  }
  const shown = showAll ? items : items.slice(0, 3);
  return (
    <section className="card attention-card" id="attention" aria-label="Needs attention">
      <div className="attention-card__head">
        <h2>
          <TriangleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
          Needs attention ({items.length})
        </h2>
        {items.length > shown.length ? <Link href={viewAllHref}>View all</Link> : null}
      </div>
      <div className="attention-card__body">
        {shown.map((i) => (
          <div className="attention-row" key={i.id} role={i.severity === "critical" ? "alert" : "status"}>
            {i.severity === "critical" ? (
              <OctagonAlert size={20} strokeWidth={1.75} aria-hidden="true" style={{ fill: "var(--maroon-700)", stroke: "var(--maroon-50)" }} />
            ) : (
              <TriangleAlert size={20} strokeWidth={1.75} aria-hidden="true" />
            )}
            <div className="attention-row__body">
              <strong>{i.title}</strong>
              <p>{i.detail}</p>
            </div>
            <Link className="btn btn--secondary btn--sm" href={i.href}>
              {i.action}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- tables ----------

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  nowrap?: boolean;
}

/** Tables never widen the page: they scroll inside a wrapper, or become stacked cards when narrow. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  rowClass,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  caption: string;
  rowClass?: (row: T) => string | undefined;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header} scope="col">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className={rowClass?.(r)}>
              {columns.map((c) => (
                <td key={c.header} data-label={c.header} className={c.nowrap ? "nowrap" : undefined}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ page, pages, hrefFor, total, pageSize }: { page: number; pages: number; hrefFor: (p: number) => string; total: number; pageSize: number }) {
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav className="pager" aria-label="Pagination">
      <span>
        {from}–{to} of {total}
      </span>
      <span className="actions">
        {page > 1 ? (
          <Link className="btn btn--secondary btn--sm" href={hrefFor(page - 1)}>
            Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link className="btn btn--secondary btn--sm" href={hrefFor(page + 1)}>
            Next
          </Link>
        ) : null}
      </span>
    </nav>
  );
}
