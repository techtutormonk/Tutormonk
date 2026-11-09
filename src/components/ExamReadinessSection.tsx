import React from 'react';
import { CountryCode, NavTab } from '../types';
import { EXAMS_DATA } from '../data/tutorMonkData';
import { ArrowRight, BookCheck, ShieldAlert, Award, FileQuestion } from 'lucide-react';

interface ExamReadinessSectionProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenDemoModal: () => void;
  selectedCountry: CountryCode;
  onSelectCountry: (country: CountryCode) => void;
}

export const ExamReadinessSection: React.FC<ExamReadinessSectionProps> = ({
  onSelectTab,
  onOpenDemoModal,
  selectedCountry,
  onSelectCountry
}) => {
  const filterOptions: { code: CountryCode; label: string }[] = [
    { code: 'all', label: 'All' },
    { code: 'usa', label: 'USA' },
    { code: 'canada', label: 'Canada' },
    { code: 'india', label: 'India' },
    { code: 'australia', label: 'Australia' }
  ];

  const filteredExams = selectedCountry === 'all'
    ? EXAMS_DATA
    : EXAMS_DATA.filter((e) => e.countryCode === selectedCountry);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
      
      {/* Header with Breadcrumb (matching screenshot) */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-amber-400">
          <button onClick={() => onSelectTab('home')} className="hover:underline">Home</button>
          <span className="mx-2 text-slate-500">/</span>
          <span className="text-slate-300">Exam Readiness</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Exam Readiness
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Preparation built around past papers, timed practice and regular progress checks. Filter by country.
        </p>

        {/* Filter by Country Buttons (matching screenshot chips) */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          {filterOptions.map((f) => (
            <button
              key={f.code}
              onClick={() => onSelectCountry(f.code)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                selectedCountry === f.code
                  ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-[#180f3b] text-slate-300 border-indigo-800/60 hover:border-indigo-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exam Cards Grid (matching screenshot cards: Category badge, country, title, description, book demo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="p-6 sm:p-7 rounded-3xl bg-[#140b33] border border-indigo-900/60 hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2.5 py-1 rounded-md font-semibold ${
                  exam.category === 'Statutory'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                }`}>
                  {exam.category}
                </span>
                <span className="text-indigo-300 font-medium">{exam.country} &bull; {exam.grades}</span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">{exam.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-2">
                  {exam.description}
                </p>
              </div>

              {/* Key Exam Modules */}
              <div className="space-y-1.5 pt-3 border-t border-indigo-900/40 text-xs">
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Test Modules Covered:</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {exam.keyTopics.map((topic, i) => (
                    <span key={i} className="bg-indigo-950/90 text-slate-300 px-2.5 py-1 rounded-md border border-indigo-800/60">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-indigo-900/40 flex items-center justify-between">
              <button
                onClick={onOpenDemoModal}
                className="text-amber-400 hover:text-amber-300 font-bold text-sm flex items-center gap-1.5"
              >
                <span>Book a free demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <span className="text-xs text-slate-400">Past Papers &amp; Drills</span>
            </div>
          </div>
        ))}
      </div>

      {filteredExams.length === 0 && (
        <div className="p-8 rounded-2xl bg-[#140b33] border border-indigo-900 text-center text-slate-400">
          No exams found for this specific filter. Switch back to &ldquo;All&rdquo; or select another region.
        </div>
      )}

      {/* Tell us your grade card (directly from screenshot) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1a0f40] border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">Tell us your grade &amp; target exam</h3>
          <p className="text-sm text-slate-300 max-w-xl">
            We will suggest the right plan for your child with targeted past paper mocks. Start with a free demo.
          </p>
        </div>

        <button
          onClick={onOpenDemoModal}
          className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap"
        >
          Book a free demo &rarr;
        </button>
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
