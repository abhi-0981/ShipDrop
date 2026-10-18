import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeSettings() {
  const { theme: activeTheme, themeId, themes, setTheme, saving } = useTheme();
  const [hoveredTheme, setHoveredTheme] = useState(null);

  const handleSelectTheme = (selectedId) => {
    if (selectedId === themeId) {
      toast.success(`${activeTheme.name} is already your active theme`, {
        id: "theme-active",
      });
      return;
    }

    setTheme(selectedId);
    const target = themes.find((t) => t.id === selectedId);
    toast.success(`Theme switched to ${target?.name || "new theme"}`, {
      id: "theme-switched",
      icon: "🎨",
    });
  };

  return (
    <div className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      {/* =========================================================
          PAGE HEADER
      ========================================================= */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Settings
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-700">
              Theme Customization
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Theme Customization
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Personalize your ParcelDrop workspace with curated high-contrast palettes.
            Your selection syncs seamlessly with your account and persists across sessions.
          </p>
        </div>

        {/* CLOUD PERSISTENCE STATUS PILL */}
        <div className="flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 shadow-xs backdrop-blur-sm sm:self-auto">
          <span
            className={`h-2 w-2 rounded-full ${
              saving ? "animate-pulse bg-amber-500" : "bg-emerald-500"
            }`}
          />
          <span className="text-[11px] font-semibold text-slate-700">
            {saving ? "Saving to Cloud..." : "Synced with Database"}
          </span>
        </div>
      </div>

      {/* =========================================================
          ACTIVE THEME HERO PREVIEW BANNER
      ========================================================= */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--theme-primary)] text-xs text-white">
                ✓
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                Currently Active Palette
              </span>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-12 lg:items-center">
          {/* LEFT: COLOR SWATCH CAROUSEL */}
          <div className="space-y-3 lg:col-span-5">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {activeTheme.name}
              </h2>
              <p className="text-xs text-slate-500">{activeTheme.subtitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* PRIMARY SWATCH */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                <div
                  className="h-10 w-10 shrink-0 rounded-lg shadow-xs"
                  style={{ backgroundColor: activeTheme.primary }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Primary
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-800">
                    {activeTheme.primary}
                  </div>
                </div>
              </div>

              {/* BACKGROUND SWATCH */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                <div
                  className="h-10 w-10 shrink-0 rounded-lg border border-slate-300/60 shadow-xs"
                  style={{ backgroundColor: activeTheme.bg }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Background
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-800">
                    {activeTheme.bg}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: MINI WORKSPACE MOCKUP PREVIEW */}
          <div className="lg:col-span-7">
            <div
              className="rounded-xl border p-4 transition-all duration-300"
              style={{
                backgroundColor: activeTheme.bg,
                borderColor: activeTheme.border || "#cbd5e1",
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                Live Interface Preview
              </div>

              <div className="space-y-2.5">
                {/* MOCK TOP BAR */}
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-xs border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: activeTheme.primary }}
                    />
                    <span
                      className="font-black text-xs"
                      style={{ color: activeTheme.primary }}
                    >
                      ParcelDrop
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: activeTheme.primary }}
                    >
                      + Create Order
                    </button>
                  </div>
                </div>

                {/* MOCK METRICS CARDS */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-white p-2 shadow-xs border border-slate-200/80">
                    <span className="text-[9px] font-semibold text-slate-400 block uppercase">
                      Total Orders
                    </span>
                    <span className="text-sm font-black text-slate-800">
                      1,428
                    </span>
                  </div>
                  <div className="rounded-lg bg-white p-2 shadow-xs border border-slate-200/80">
                    <span className="text-[9px] font-semibold text-slate-400 block uppercase">
                      In Transit
                    </span>
                    <span className="text-sm font-black text-blue-600">
                      240
                    </span>
                  </div>
                  <div className="rounded-lg bg-white p-2 shadow-xs border border-slate-200/80">
                    <span className="text-[9px] font-semibold text-slate-400 block uppercase">
                      Delivered
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      1,180
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          THE FIVE THEME CARDS
      ========================================================= */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Available Curated Palettes
          </h2>
          <p className="text-xs text-slate-500">
            Select any palette below to immediately update your user panel.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          5 Distinct Themes
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t, index) => {
          const isSelected = t.id === themeId;
          const isHovered = hoveredTheme === t.id;

          return (
            <div
              key={t.id}
              onMouseEnter={() => setHoveredTheme(t.id)}
              onMouseLeave={() => setHoveredTheme(null)}
              onClick={() => handleSelectTheme(t.id)}
              className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                isSelected
                  ? "border-2 shadow-md ring-4"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              style={{
                borderColor: isSelected ? t.primary : undefined,
                boxShadow: isSelected
                  ? `0 10px 25px -5px rgba(${t.primaryRgb}, 0.25)`
                  : undefined,
                outlineColor: isSelected ? t.primary : undefined,
              }}
            >
              {/* TOP ROW: BADGE + NUMBER */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100">
                    Theme #{index + 1}
                  </span>

                  {isSelected ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: t.primary }}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Selected
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-600">
                      Click to apply
                    </span>
                  )}
                </div>

                {/* THEME TITLE */}
                <div className="mt-3">
                  <h3 className="text-base font-black text-slate-900 group-hover:text-slate-800">
                    {t.name}
                  </h3>
                  <p className="text-xs text-slate-500">{t.subtitle}</p>
                </div>

                {/* LIVE PREVIEW CANVAS */}
                <div
                  className="mt-4 rounded-xl border p-3.5 transition-all duration-200"
                  style={{
                    backgroundColor: t.bg,
                    borderColor: t.border,
                  }}
                >
                  <div className="flex items-center justify-between rounded-lg bg-white/95 px-3 py-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full shadow-xs"
                        style={{ backgroundColor: t.primary }}
                      />
                      <span
                        className="text-xs font-bold"
                        style={{ color: t.primary }}
                      >
                        Sample UI
                      </span>
                    </div>

                    <button
                      type="button"
                      tabIndex={-1}
                      className="rounded-md px-2.5 py-1 text-[10px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: t.primary }}
                    >
                      Action
                    </button>
                  </div>

                  {/* MINI FORM MOCKUP */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-6 flex-1 rounded-md border border-slate-200 bg-white/90 px-2 flex items-center text-[9px] font-medium text-slate-400">
                      Input focus state
                    </div>
                    <div
                      className="h-6 w-6 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: t.primary }}
                    >
                      ✓
                    </div>
                  </div>
                </div>

                {/* COLOR PALETTE HEX CODES */}
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {/* PRIMARY HEX */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-5 w-5 shrink-0 rounded-md shadow-xs"
                        style={{ backgroundColor: t.primary }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Primary
                        </span>
                        <span className="block font-mono text-xs font-black text-slate-800 truncate">
                          {t.primary}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BACKGROUND HEX */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-5 w-5 shrink-0 rounded-md border border-slate-300 shadow-xs"
                        style={{ backgroundColor: t.bg }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Background
                        </span>
                        <span className="block font-mono text-xs font-black text-slate-800 truncate">
                          {t.bg}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTheme(t.id);
                  }}
                  className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? "text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  style={{
                    backgroundColor: isSelected ? t.primary : undefined,
                  }}
                >
                  {isSelected ? "Active Theme" : "Apply This Theme"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================
          CONSISTENT STATUS COLORS NOTICE (LOGISTICS GUARANTEE)
      ========================================================= */}
      <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Logistics Status Color Integrity
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              To guarantee immediate operational clarity for courier dispatches,
              critical status badges remain standardized across all themes:
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Delivered (Green)
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Pending (Amber)
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Cancelled / RTO (Red)
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                In Transit (Blue)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
