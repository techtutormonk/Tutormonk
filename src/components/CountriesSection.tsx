import React, { useState } from 'react';
import { CountryCode, NavTab } from '../types';
import { COUNTRIES_DATA } from '../data/tutorMonkData';
import { ArrowRight, CheckCircle2, ChevronRight, GraduationCap } from 'lucide-react';

interface CountriesSectionProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenDemoModal: () => void;
  selectedCountry: CountryCode;
  onSelectCountry: (country: CountryCode) => void;
}

export const CountriesSection: React.FC<CountriesSectionProps> = ({
  onSelectTab,
  onOpenDemoModal,
  selectedCountry,
  onSelectCountry
}) => {
  const [expandedCountry, setExpandedCountry] = useState<string | null>(
    selectedCountry !== 'all' ? selectedCountry : 'usa'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
      
      {/* Header with Breadcrumb (matching screenshot) */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-amber-400">
          <button onClick={() => onSelectTab('home')} className="hover:underline">Home</button>
          <span className="mx-2 text-slate-500">/</span>
          <span className="text-slate-300">Countries</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Countries we teach in
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Live 1:1 classes matched to your country&apos;s curriculum and exams. Learners from 15+ countries study with Tutor Monk.
        </p>
      </div>

      {/* Country Cards Grid (matching screenshot design with flag, title, summary, and action) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COUNTRIES_DATA.map((country) => {
          const isSelected = expandedCountry === country.code;

          return (
            <div
              key={country.id}
              className={`p-6 sm:p-7 rounded-3xl bg-[#140b33] border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected 
                  ? 'border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50' 
                  : 'border-indigo-900/60 hover:border-indigo-600'
              }`}
              onClick={() => {
                setExpandedCountry(country.code);
                onSelectCountry(country.code);
              }}
            >
              <div className="space-y-4">
                <div className="text-4xl">{country.flag}</div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{country.name}</h3>
                  <div className="text-xs text-indigo-300 font-medium mt-0.5">{country.gradesOffered}</div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {country.tagline}
                </p>

                {/* Expanded Details when active */}
                {isSelected && (
                  <div className="pt-3 border-t border-indigo-900/60 space-y-3 animate-in fade-in text-xs">
                    <div>
                      <span className="font-bold text-amber-300 block mb-1">Supported Curriculums:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {country.curriculums.map((c, i) => (
                          <span key={i} className="bg-indigo-950 px-2 py-0.5 rounded text-slate-300 border border-indigo-800">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-amber-300 block mb-1">Target Key Exams:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {country.keyExams.map((ex, i) => (
                          <span key={i} className="bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/20">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      {country.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 mt-4 border-t border-indigo-900/40 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCountry(country.code);
                    onSelectTab('exams');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold text-sm flex items-center gap-1"
                >
                  <span>See programmes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDemoModal();
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-slate-200 border border-indigo-700/60"
                >
                  Book Demo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-border live matching highlight */}
      <div className="p-8 rounded-3xl bg-[#140b33]/80 border border-indigo-900/60 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="text-amber-400 font-bold text-sm flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span>Time-Zone Synchronized</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Classes run during student after-school hours in EST, PST, GMT, AEST, and IST without awkward schedules.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-amber-400 font-bold text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Curriculum-Native Educators</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tutors are certified and deeply familiar with local school rubrics, state mark schemes, and national assessments.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-amber-400 font-bold text-sm flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            <span>Single Seamless Portal</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Regardless of your country, parents and students log into one unified dashboard with local currency support.
          </p>
        </div>
      </div>

      {/* Bottom Demo Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-800 text-center text-white space-y-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold">Ready for a free demo?</h2>
        <p className="text-violet-100 text-sm max-w-xl mx-auto">
          Start with a free demo and discover a learning approach built around your student.
        </p>
        <button
          onClick={onOpenDemoModal}
          className="px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
        >
          Book a free demo
        </button>
      </div>

    </div>
  );
};
