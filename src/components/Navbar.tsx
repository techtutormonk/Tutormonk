import React, { useState } from 'react';
import { Logo } from './Logo';
import { NavTab, CountryCode } from '../types';
import { Menu, X, ArrowRight, LayoutDashboard, Globe } from 'lucide-react';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenDemoModal: () => void;
  selectedCountry: CountryCode;
  onSelectCountry: (country: CountryCode) => void;
  isPortalActive: boolean;
  onTogglePortal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenDemoModal,
  selectedCountry,
  onSelectCountry,
  isPortalActive,
  onTogglePortal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const countries: { code: CountryCode; label: string }[] = [
    { code: 'all', label: 'Global' },
    { code: 'usa', label: 'USA' },
    { code: 'canada', label: 'Canada' },
    { code: 'india', label: 'India' },
    { code: 'australia', label: 'Australia' }
  ];

  return (
    <>
      {/* Strict Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (Nav links) - Zone 3 (1 Primary Action) */}
      <header className="sticky top-0 z-40 w-full bg-[#0d0724]/90 backdrop-blur-md border-b border-indigo-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
          
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center shrink-0">
            <Logo onClick={() => handleNavClick('home')} />
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => handleNavClick('home')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'home' && !isPortalActive ? 'text-amber-400 border-amber-400' : 'border-transparent text-slate-300'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('countries')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'countries' && !isPortalActive ? 'text-amber-400 border-amber-400' : 'border-transparent text-slate-300'
              }`}
            >
              Countries
            </button>
            <button
              onClick={() => handleNavClick('school')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'school' && !isPortalActive ? 'text-amber-400 border-amber-400' : 'border-transparent text-slate-300'
              }`}
            >
              School Readiness
            </button>
            <button
              onClick={() => handleNavClick('exams')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'exams' && !isPortalActive ? 'text-amber-400 border-amber-400' : 'border-transparent text-slate-300'
              }`}
            >
              Exam Readiness
            </button>
            <button
              onClick={() => handleNavClick('skills')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'skills' && !isPortalActive ? 'text-amber-400 border-amber-400' : 'border-transparent text-slate-300'
              }`}
            >
              Skill Academy
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'how-it-works' && !isPortalActive ? 'text-amber-400 border-amber-400' : 'border-transparent text-slate-300'
              }`}
            >
              How It Works
            </button>
          </nav>

          {/* Zone 3: Primary Action & Portal switch */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onTogglePortal}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 border ${
                isPortalActive 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/50' 
                  : 'bg-[#1e1342] text-slate-200 border-indigo-700/60 hover:bg-[#281b57] hover:border-indigo-500'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>{isPortalActive ? 'Public Site' : 'TMS / LMS Portal'}</span>
            </button>

            <button
              onClick={onOpenDemoModal}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 whitespace-nowrap shrink-0"
            >
              Book a free demo
            </button>

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-900/40 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu (matching the screenshots with dark purple canvas, clean menu items, country chips, and book demo button) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#0d0624] text-white flex flex-col p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-6 border-b border-indigo-900/50">
            <Logo onClick={() => handleNavClick('home')} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-indigo-950"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col py-6 space-y-4 text-lg font-bold">
            <button
              onClick={() => handleNavClick('home')}
              className={`text-left py-2.5 transition-colors border-b border-indigo-950/80 ${
                activeTab === 'home' && !isPortalActive ? 'text-amber-400' : 'text-slate-100 hover:text-amber-300'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('countries')}
              className={`text-left py-2.5 transition-colors border-b border-indigo-950/80 ${
                activeTab === 'countries' && !isPortalActive ? 'text-amber-400' : 'text-slate-100 hover:text-amber-300'
              }`}
            >
              Countries
            </button>
            <button
              onClick={() => handleNavClick('school')}
              className={`text-left py-2.5 transition-colors border-b border-indigo-950/80 ${
                activeTab === 'school' && !isPortalActive ? 'text-amber-400' : 'text-slate-100 hover:text-amber-300'
              }`}
            >
              School Readiness
            </button>
            <button
              onClick={() => handleNavClick('exams')}
              className={`text-left py-2.5 transition-colors border-b border-indigo-950/80 ${
                activeTab === 'exams' && !isPortalActive ? 'text-amber-400' : 'text-slate-100 hover:text-amber-300'
              }`}
            >
              Exam Readiness
            </button>
            <button
              onClick={() => handleNavClick('skills')}
              className={`text-left py-2.5 transition-colors border-b border-indigo-950/80 ${
                activeTab === 'skills' && !isPortalActive ? 'text-amber-400' : 'text-slate-100 hover:text-amber-300'
              }`}
            >
              Skill Academy
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className={`text-left py-2.5 transition-colors border-b border-indigo-950/80 ${
                activeTab === 'how-it-works' && !isPortalActive ? 'text-amber-400' : 'text-slate-100 hover:text-amber-300'
              }`}
            >
              How it works
            </button>
            <button
              onClick={() => {
                onTogglePortal();
                setMobileMenuOpen(false);
              }}
              className="text-left py-2.5 text-indigo-300 hover:text-indigo-100 flex items-center justify-between border-b border-indigo-950/80"
            >
              <span>{isPortalActive ? 'Back to Public Website' : 'Portal login (TMS / LMS)'}</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Regional shortcut filter chips in mobile menu */}
          <div className="mt-2 pt-4 border-t border-indigo-950">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
              <Globe className="w-3.5 h-3.5" />
              <span>Browse exams by region</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {countries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    onSelectCountry(c.code);
                    handleNavClick('exams');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    selectedCountry === c.code 
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold' 
                      : 'bg-indigo-950/60 text-slate-300 border-indigo-800/80 hover:border-indigo-600'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDemoModal();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base text-center shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
            >
              Book a free demo
            </button>
          </div>
        </div>
      )}
    </>
  );
};
