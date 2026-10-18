"use client";

import { useEffect, useId, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const switchId = useId();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("al_theme") || "dark";
      const darkActive = stored === "dark";
      setIsDark(darkActive);
      applyTheme(darkActive ? "dark" : "light");
    } catch {
      setIsDark(true);
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (theme: "dark" | "light") => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-color-mode", theme);
  };

  const handleToggle = (checked: boolean) => {
    const next = checked ? "dark" : "light";
    setIsDark(checked);
    try {
      localStorage.setItem("al_theme", next);
    } catch {}
    applyTheme(next);
  };

  return (
    <div
      className="knife-toggle-wrapper"
      title={`Dark mode is currently ${isDark ? "ON" : "OFF"}. Click switch to toggle.`}
    >
      <div
        className="knife-toggle-box w-48 aspect-video rounded-xl has-[:checked]:bg-[#3a3347] bg-[#ebe6ef] border-4 border-[#121331]"
      >
        <div className="knife-toggle-inner flex h-full w-full px-2 items-center gap-x-2">
          <div
            className="knife-rivet-circle w-6 h-6 flex-shrink-0 rounded-full border-4 border-[#121331]"
          ></div>
          <label
            htmlFor={switchId}
            className="knife-lever-label has-[:checked]:scale-x-[-1] w-full h-10 border-4 border-[#121331] rounded cursor-pointer"
          >
            <input
              type="checkbox"
              id={switchId}
              className="hidden"
              style={{ display: "none" }}
              checked={isDark}
              onChange={(e) => handleToggle(e.target.checked)}
              aria-label="Toggle dark mode"
            />
            <div className="knife-lever-track w-full h-full bg-[#f24c00] relative">
              <div
                className="knife-triangle-outer w-0 h-0 z-20 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[20px] border-t-[#121331] relative"
              >
                <div
                  className="knife-triangle-inner w-0 h-0 absolute border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[15px] border-t-[#e44901] -top-5 -left-[18px]"
                ></div>
              </div>
              <div
                className="knife-facet-left w-[24px] h-9 z-10 absolute top-[9px] left-0 bg-[#f24c00] border-r-2 border-b-4 border-[#121331] transform skew-y-[39deg]"
              ></div>
              <div
                className="knife-facet-right w-[25px] h-9 z-10 absolute top-[9px] left-[24px] bg-[#c44002] border-r-4 border-l-2 border-b-4 border-[#121331] transform skew-y-[-39deg]"
              ></div>
            </div>
          </label>
          <div className="knife-rivet-line w-6 h-1 flex-shrink-0 bg-[#121331] rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
