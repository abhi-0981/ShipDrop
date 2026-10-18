import { useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { THEMES } from "../../constants/themes";

const CheckIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const PaletteIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const SparklesIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);

/**
 * Realistic UI Mini-Preview Component
 * Displays an authentic micro mockup of ParcelDrop Dashboard
 * using the exact colors of the previewed theme.
 */
const MiniUIPreview = ({ theme }) => {
  const { colors } = theme;

  return (
    <div
      className="relative w-full rounded-xl p-3 shadow-inner transition-all duration-200 overflow-hidden select-none border"
      style={{
        backgroundColor: colors.canvas,
        borderColor: colors.border,
      }}
    >
      {/* Mini Top Bar */}
      <div
        className="flex items-center justify-between rounded-lg px-2.5 py-1.5 shadow-xs border mb-2.5"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: colors.primary }}
          >
            P
          </div>
          <span
            className="text-[11px] font-bold tracking-tight"
            style={{ color: colors.primary }}
          >
            ParcelDrop
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className="px-1.5 py-0.5 rounded text-[9px] font-semibold border"
            style={{
              backgroundColor: colors.light,
              color: colors.primary,
              borderColor: colors.border,
            }}
          >
            ₹50,400
          </div>
          <div
            className="w-4 h-4 rounded-full border flex items-center justify-center text-[8px] font-bold"
            style={{
              backgroundColor: colors.light,
              color: colors.primary,
              borderColor: colors.border,
            }}
          >
            U
          </div>
        </div>
      </div>

      {/* Mini Body: Sidebar + Main Workspace */}
      <div className="flex gap-2">
        {/* Mini Sidebar */}
        <div
          className="w-20 shrink-0 rounded-lg p-1.5 border flex flex-col gap-1 shadow-xs"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          {/* Active Link */}
          <div
            className="flex items-center gap-1 rounded px-1.5 py-1 text-[9px] font-semibold text-white shadow-2xs"
            style={{ backgroundColor: colors.primary }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />
            <span>Dashboard</span>
          </div>
          {/* Inactive links */}
          <div
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium"
            style={{ color: colors.muted }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span>Orders</span>
          </div>
          <div
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium"
            style={{ color: colors.muted }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span>Wallet</span>
          </div>
        </div>

        {/* Mini Main Content */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          {/* Mini Stat Cards Row */}
          <div className="grid grid-cols-2 gap-1.5">
            <div
              className="rounded-lg p-1.5 border shadow-2xs"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="text-[8px] font-medium uppercase tracking-wider truncate"
                style={{ color: colors.muted }}
              >
                Delivered
              </div>
              <div
                className="text-[13px] font-extrabold leading-tight mt-0.5"
                style={{ color: colors.text }}
              >
                1,428
              </div>
            </div>

            <div
              className="rounded-lg p-1.5 border shadow-2xs"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="text-[8px] font-medium uppercase tracking-wider truncate"
                style={{ color: colors.muted }}
              >
                In Transit
              </div>
              <div
                className="text-[13px] font-extrabold leading-tight mt-0.5"
                style={{ color: colors.text }}
              >
                392
              </div>
            </div>
          </div>

          {/* Mini Action Area / Mini Table row */}
          <div
            className="rounded-lg p-2 border shadow-2xs flex items-center justify-between gap-1"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className="min-w-0">
              <div
                className="text-[9px] font-bold truncate"
                style={{ color: colors.text }}
              >
                #SHP-90241
              </div>
              <div
                className="text-[8px] truncate"
                style={{ color: colors.muted }}
              >
                Standard Delhivery Express
              </div>
            </div>

            <button
              type="button"
              className="px-2 py-0.5 rounded text-[8px] font-bold text-white shadow-2xs shrink-0"
              style={{ backgroundColor: colors.primary }}
            >
              Track
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ThemeSettings() {
  const { currentTheme, setTheme, isUpdating } = useTheme();

  const activeThemeObj = useMemo(
    () => THEMES.find((t) => t.id === currentTheme) || THEMES[0],
    [currentTheme]
  );

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Settings</span>
            <span>/</span>
            <span className="text-[#008dd2] flex items-center gap-1">
              <PaletteIcon className="w-3.5 h-3.5" />
              Theme Customization
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Workspace Themes
          </h1>

          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Choose a visual appearance for your ParcelDrop User Panel. Themes
            apply immediately across your sidebar, headers, metrics, and tables,
            and persist automatically across sessions.
          </p>
        </div>

        {/* Current Active Indicator */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-2.5 px-4 shadow-xs shrink-0 self-start sm:self-auto">
          <div
            className="w-4 h-4 rounded-full border border-black/10 shadow-xs shrink-0"
            style={{ backgroundColor: activeThemeObj.colors.primary }}
          />
          <div className="text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Theme
            </span>
            <span className="text-xs font-bold text-slate-800">
              {activeThemeObj.name}
            </span>
          </div>
        </div>
      </div>

      {/* THEMES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {THEMES.map((theme) => {
          const isActive = theme.id === currentTheme;

          return (
            <div
              key={theme.id}
              className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 transition-all duration-200 hover:shadow-md ${
                isActive
                  ? "border-[#008dd2] ring-2 ring-[#008dd2]/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* CARD TOP INFO */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {theme.name}
                      </h2>
                      {theme.isDefault && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#008dd2] border border-blue-100">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      {theme.tagline}
                    </span>
                  </div>

                  {isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
                      <CheckIcon className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                  {theme.description}
                </p>

                {/* REALISTIC MICRO UI PREVIEW */}
                <div className="mb-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Live UI Preview
                  </span>
                  <MiniUIPreview theme={theme} />
                </div>

                {/* COLOR SWATCHES WITH HEX CODES */}
                <div className="mb-5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Palette Breakdown
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {theme.swatches.map((swatch) => (
                      <div
                        key={swatch.label}
                        className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-1.5 px-2.5 transition hover:bg-slate-100/60"
                      >
                        <div
                          className="w-4 h-4 rounded-md border border-black/15 shadow-2xs shrink-0"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[10px] font-medium text-slate-400 truncate">
                            {swatch.label}
                          </span>
                          <span className="block font-mono text-[11px] font-bold text-slate-700 uppercase">
                            {swatch.hex}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div>
                {isActive ? (
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/80 py-2.5 text-xs font-bold text-emerald-700 cursor-default"
                  >
                    <CheckIcon className="w-4 h-4" />
                    Currently Applied
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTheme(theme.id)}
                    disabled={isUpdating}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xs"
                    style={{
                      backgroundColor: theme.colors.primary,
                    }}
                  >
                    <SparklesIcon className="w-4 h-4 text-white/80" />
                    Apply {theme.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER HELPER NOTICE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#008dd2]">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Safe &amp; Accessible Color System
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                All optional themes maintain standard safety indicators (Delivered green,
                Pending amber, Cancelled red) for clear shipment monitoring.
                You can revert back to <strong>ParcelDrop Classic</strong> at any time.
              </p>
            </div>
          </div>

          {currentTheme !== "ocean-blue" && (
            <button
              type="button"
              onClick={() => setTheme("ocean-blue")}
              disabled={isUpdating}
              className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition active:scale-95 cursor-pointer"
            >
              Reset to Classic Default
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
