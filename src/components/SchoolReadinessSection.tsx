import React, { useState } from 'react';
import { NavTab } from '../types';
import { SCHOOL_SUBJECTS } from '../data/tutorMonkData';
import { 
  Calculator, 
  Microscope, 
  BookOpen, 
  FileEdit, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface SchoolReadinessSectionProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenDemoModal: () => void;
}

export const SchoolReadinessSection: React.FC<SchoolReadinessSectionProps> = ({
  onSelectTab,
  onOpenDemoModal
}) => {
  const [selectedGradeBand, setSelectedGradeBand] = useState<'elementary' | 'middle' | 'high'>('middle');

  const gradeLabels = {
    elementary: 'Grades 1 to 5 (Foundational Years)',
    middle: 'Grades 6 to 8 (Middle School)',
    high: 'Grades 9 to 12 (High School & Senior Secondary)'
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Calculator': return <Calculator className="w-7 h-7 text-amber-400" />;
      case 'Microscope': return <Microscope className="w-7 h-7 text-sky-400" />;
      case 'BookOpen': return <BookOpen className="w-7 h-7 text-emerald-400" />;
      case 'FileEdit': return <FileEdit className="w-7 h-7 text-rose-400" />;
      default: return <Sparkles className="w-7 h-7 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
      
      {/* Header with Breadcrumb (matching screenshot) */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-amber-400">
          <button onClick={() => onSelectTab('home')} className="hover:underline">Home</button>
          <span className="mx-2 text-slate-500">/</span>
          <span className="text-slate-300">School Readiness</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          School Readiness
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Weekly support that keeps pace with your child&apos;s school syllabus, or helps them move ahead of it.
        </p>

        {/* Grade Band Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filter Grade Band:</span>
          {(['elementary', 'middle', 'high'] as const).map((band) => (
            <button
              key={band}
              onClick={() => setSelectedGradeBand(band)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                selectedGradeBand === band
                  ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-[#180f3b] text-slate-300 border-indigo-800/60 hover:border-indigo-500'
              }`}
            >
              {band === 'elementary' ? 'Grades 1-5' : band === 'middle' ? 'Grades 6-8' : 'Grades 9-12'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Subject Cards (matching screenshot layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SCHOOL_SUBJECTS.map((subject) => (
          <div
            key={subject.id}
            className="p-6 sm:p-8 rounded-3xl bg-[#140b33] border border-indigo-900/60 hover:border-amber-400/50 transition-all space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-800/80 flex items-center justify-center">
                  {getIcon(subject.iconName)}
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-900/50 text-indigo-300 border border-indigo-800/50">
                  {gradeLabels[selectedGradeBand]}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">{subject.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-2">
                  {subject.description}
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-2 pt-2 border-t border-indigo-900/50">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">Key Learning Outcomes:</div>
                {subject.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-indigo-900/40 flex items-center justify-between">
              <button
                onClick={onOpenDemoModal}
                className="text-amber-400 hover:text-amber-300 font-bold text-sm flex items-center gap-1.5"
              >
                <span>Book a free demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <span className="text-xs text-slate-400 font-medium">1:1 Personalized Class</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tell us your grade card (from screenshot) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1a0f40] border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white">Tell us your child&apos;s grade &amp; goals</h3>
          <p className="text-sm text-slate-300 max-w-xl">
            We will suggest the right plan for your child and match the top educator in their syllabus.
          </p>
        </div>

        <button
          onClick={onOpenDemoModal}
          className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all whitespace-nowrap"
        >
          Book a free demo &rarr;
        </button>
      </div>

      {/* Ready for a Free Demo CTA Card */}
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
