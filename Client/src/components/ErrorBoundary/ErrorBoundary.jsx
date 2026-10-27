import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-3 shadow-xs">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-[17px] font-bold text-slate-800">Something went wrong</h2>
          <p className="mt-1 text-[13px] text-slate-500 max-w-sm">
            {this.state.error?.message || "An unexpected error occurred while loading this section."}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="rounded-xl bg-[#008dd2] px-3.5 py-2 text-[12px] font-semibold text-white shadow-xs hover:bg-[#007bb8] active:scale-95 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
