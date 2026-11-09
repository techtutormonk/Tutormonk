import React from 'react';
import { NavTab } from '../types';
import { SKILL_ACADEMY_PROGRAMS } from '../data/tutorMonkData';
import { 
  Binary, 
  Crown, 
  Laptop, 
  Mic, 
  Feather, 
  Coins, 
  CheckCircle2, 
  ArrowRight,
  Flame
} from 'lucide-react';

interface SkillAcademySectionProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenDemoModal: () => void;
}

export const SkillAcademySection: React.FC<SkillAcademySectionProps> = ({
  onSelectTab,
  onOpenDemoModal
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Binary': return <Binary className="w-8 h-8 text-amber-400" />;
      case 'Crown': return <Crown className="w-8 h-8 text-amber-400" />;
      case 'Laptop': return <Laptop className="w-8 h-8 text-sky-400" />;
      case 'Mic': return <Mic className="w-8 h-8 text-rose-400" />;
      case 'Feather': return <Feather className="w-8 h-8 text-emerald-400" />;
      case 'Coins': return <Coins className="w-8 h-8 text-amber-400" />;
      default: return <Flame className="w-8 h-8 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
      
      {/* Header with Breadcrumb (matching screenshot) */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-amber-400">
          <button onClick={() => onSelectTab('home')} className="hover:underline">Home</button>
          <span className="mx-2 text-slate-500">/</span>
          <span className="text-slate-300">Skill Academy</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Skill Academy
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Skills that school rarely teaches, in lessons that feel like play.
        </p>
      </div>

      {/* Program Cards Grid (matching screenshot: rounded card with icon square, title, subtitle, outcomes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SKILL_ACADEMY_PROGRAMS.map((prog) => (
          <div
            key={prog.id}
            className="p-6 sm:p-7 rounded-3xl bg-[#140b33] border border-indigo-900/60 hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                  {getIcon(prog.iconName)}
                </div>
                <div className="text-right text-xs">
                  <span className="block font-bold text-indigo-300">{prog.ageGroup}</span>
                  <span className="text-slate-400 text-[11px]">{prog.duration}</span>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">{prog.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-1.5">
                  {prog.description}
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-indigo-900/40 text-xs">
                <div className="font-bold text-amber-300 uppercase tracking-wide text-[10px]">What Students Master:</div>
                {prog.outcomes.map((out, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{out}</span>
                  </div>
                ))}
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

              <span className="text-xs text-slate-400 font-medium">1:1 Mentorship</span>
            </div>
          </div>
        ))}
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
