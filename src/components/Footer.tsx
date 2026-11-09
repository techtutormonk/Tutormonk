import React from 'react';
import { Logo } from './Logo';
import { NavTab, CountryCode } from '../types';
import { Phone, MessageSquare, Mail, MapPin } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: NavTab) => void;
  onSelectCountry: (country: CountryCode) => void;
  onOpenDemoModal: () => void;
  onOpenWhatsApp: () => void;
  onTogglePortal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onSelectCountry,
  onOpenDemoModal,
  onOpenWhatsApp,
  onTogglePortal
}) => {
  return (
    <footer className="w-full bg-[#080315] border-t border-indigo-950/90 text-slate-300 pt-16 pb-28 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-indigo-950/70">
          
          {/* Brand & Direct Contact */}
          <div className="lg:col-span-2 space-y-5">
            <Logo onClick={() => onSelectTab('home')} />
            
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Personalized online learning designed around every student&apos;s goals, pace, and learning needs.
            </p>

            <div className="space-y-2.5 text-sm">
              <a 
                href="tel:+919031400899" 
                className="flex items-center gap-3 text-slate-300 hover:text-amber-400 transition-colors"
              >
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="tabular-nums">+91 90314 00899</span>
              </a>

              <button 
                onClick={onOpenWhatsApp}
                className="flex items-center gap-3 text-slate-300 hover:text-emerald-400 transition-colors text-left"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Chat on WhatsApp</span>
              </button>

              <a 
                href="mailto:tech.tutormonk@gmail.com" 
                className="flex items-center gap-3 text-slate-300 hover:text-amber-400 transition-colors"
              >
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>tech.tutormonk@gmail.com</span>
              </a>

              <div className="flex items-center gap-3 text-slate-300">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>India (Serving Global Learners)</span>
              </div>
            </div>
          </div>

          {/* Column: Learning */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide">Learning</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => onSelectTab('home')} className="hover:text-amber-400 transition-colors">
                  1-on-1 Tutoring
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('school')} className="hover:text-amber-400 transition-colors">
                  Homework Help
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('school')} className="hover:text-amber-400 transition-colors">
                  Math &amp; Science
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('school')} className="hover:text-amber-400 transition-colors">
                  English &amp; Language
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('exams')} className="hover:text-amber-400 transition-colors">
                  Test Preparation
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('skills')} className="hover:text-amber-400 transition-colors">
                  Skill Academy
                </button>
              </li>
            </ul>
          </div>

          {/* Column: Courses & Exams */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide">Courses</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => { onSelectCountry('australia'); onSelectTab('exams'); }} className="hover:text-amber-400 transition-colors">
                  NAPLAN, ICAS &amp; HSC
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCountry('india'); onSelectTab('exams'); }} className="hover:text-amber-400 transition-colors">
                  Boards 10th &amp; 12th
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCountry('india'); onSelectTab('exams'); }} className="hover:text-amber-400 transition-colors">
                  IIT-JEE &amp; NEET
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCountry('india'); onSelectTab('exams'); }} className="hover:text-amber-400 transition-colors">
                  Olympiad Preparation
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCountry('usa'); onSelectTab('exams'); }} className="hover:text-amber-400 transition-colors">
                  SAT &amp; ACT Prep
                </button>
              </li>
              <li>
                <button onClick={() => { onSelectCountry('international'); onSelectTab('exams'); }} className="hover:text-amber-400 transition-colors">
                  IB &amp; Cambridge IGCSE
                </button>
              </li>
            </ul>
          </div>

          {/* Column: Learn with us & Portal */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white tracking-wide">Learn with us</h4>
              <ul className="space-y-1.5 text-sm text-slate-400">
                <li>
                  <button onClick={() => { onSelectCountry('usa'); onSelectTab('countries'); }} className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <span>🇺🇸</span> USA
                  </button>
                </li>
                <li>
                  <button onClick={() => { onSelectCountry('canada'); onSelectTab('countries'); }} className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <span>🇨🇦</span> Canada
                  </button>
                </li>
                <li>
                  <button onClick={() => { onSelectCountry('uk'); onSelectTab('countries'); }} className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <span>🇬🇧</span> UK
                  </button>
                </li>
                <li>
                  <button onClick={() => { onSelectCountry('india'); onSelectTab('countries'); }} className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <span>🇮🇳</span> India
                  </button>
                </li>
                <li>
                  <button onClick={() => { onSelectCountry('australia'); onSelectTab('countries'); }} className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <span>🇦🇺</span> Australia
                  </button>
                </li>
                <li>
                  <button onClick={() => { onSelectCountry('international'); onSelectTab('countries'); }} className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <span>🌐</span> Other
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-indigo-950/60">
              <h4 className="text-sm font-bold text-white tracking-wide">Portal</h4>
              <button 
                onClick={onTogglePortal}
                className="text-sm text-indigo-400 hover:text-amber-300 font-medium transition-colors block text-left"
              >
                Admin / TMS / LMS portal &rarr;
              </button>
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; 2026 Tutor Monk. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span aria-hidden="true">&middot;</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span aria-hidden="true">&middot;</span>
            <span className="hover:text-slate-400 cursor-pointer">Student Safety Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
