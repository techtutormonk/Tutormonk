import React from 'react';
import { openHelpWhatsApp, WHATSAPP_DISPLAY } from '../utils/whatsapp';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Without this, one uncaught error inside any component unmounts the whole app
// and the visitor is left staring at a blank page.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('[Tutor Monk] Something crashed in the UI:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0622] text-white p-6">
        <div className="max-w-md w-full text-center space-y-5 p-8 rounded-3xl bg-[#140b33] border border-indigo-800/60">
          <h1 className="text-2xl font-extrabold">Something went wrong</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Sorry about that! Please reload the page. If it keeps happening, message us on WhatsApp
            ({WHATSAPP_DISPLAY}) and we will help right away.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-all"
            >
              Reload page
            </button>
            <button
              onClick={openHelpWhatsApp}
              className="px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm transition-all"
            >
              Chat on WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
  }
}
