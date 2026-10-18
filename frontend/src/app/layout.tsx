import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "AarogyaLink", template: "%s · AarogyaLink" },
  description:
    "Consent-driven multi-hospital health data sharing: one patient profile, every hospital, only with the patient's permission.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Sets data-shell (tall | portrait | standard | wide | ultra) from the viewport aspect ratio
// before first paint, so layouts can branch on it with attribute selectors.
const SHELL_SCRIPT = `(function(){var d=document.documentElement;function m(){var r=innerWidth/innerHeight,s=r<9/16?"tall":r<1?"portrait":r<16/10?"standard":r<21/9?"wide":"ultra";if(d.dataset.shell!==s)d.dataset.shell=s}m();addEventListener("resize",m);addEventListener("orientationchange",m)})()`;
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("al_theme")||"dark";var d=document.documentElement;d.setAttribute("data-color-mode",t);var dark=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);d.setAttribute("data-theme",dark?"dark":"light")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable} data-shell="standard" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SHELL_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
