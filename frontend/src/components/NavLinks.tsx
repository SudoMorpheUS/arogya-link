"use client";

import {
  ArrowLeft,
  Building2,
  FlaskConical,
  Rocket,
  ScrollText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface TabMeta {
  Icon: LucideIcon;
  color: string;
  className: string;
}

const TAB_META: Record<string, TabMeta> = {
  dashboard: {
    Icon: Rocket,
    color: "#06B6D4",
    className: "neobrutal-tab--cyan",
  },
  patients: {
    Icon: Users,
    color: "#60A5FA",
    className: "neobrutal-tab--blue",
  },
  consent: {
    Icon: ShieldCheck,
    color: "#FACC14",
    className: "neobrutal-tab--yellow",
  },
  audit: {
    Icon: ScrollText,
    color: "#FB923C",
    className: "neobrutal-tab--orange",
  },
  hospitals: {
    Icon: Building2,
    color: "#10B981",
    className: "neobrutal-tab--emerald",
  },
  labs: {
    Icon: FlaskConical,
    color: "#A855F7",
    className: "neobrutal-tab--purple",
  },
};

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  count?: number;
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 neobrutal-tabs-bar" role="tablist">
      {pathname !== "/dashboard" ? (
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/dashboard");
            }
          }}
          className="neobrutal-tab neobrutal-tab-back group cursor-pointer relative inline-flex items-center justify-center gap-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 rounded-md px-3"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
          <span className="back-text origin-left scale-0 transition-transform group-hover:scale-100">
            Back
          </span>
        </button>
      ) : null}

      {items.map((item) => {
        const meta = TAB_META[item.icon] || {
          Icon: Rocket,
          color: "#06B6D4",
          className: "neobrutal-tab--cyan",
        };
        const Icon = meta.Icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        const count = item.count ?? 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            title={item.label}
            className={`neobrutal-tab ${meta.className} ${active ? "active" : ""} cursor-pointer relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3`}
          >
            <Icon
              size={18}
              strokeWidth={2}
              stroke={meta.color}
              style={{ color: meta.color }}
              aria-hidden="true"
            />
            <span style={{ fontWeight: 600 }}>{item.label}</span>
            {count > 0 ? (
              <span className="neobrutal-count" aria-label={`${count} attention items`}>
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
