import React, { useState } from 'react';
import { NavTab } from '../types';
import { 
  CheckCircle2, 
  ArrowRight, 
  Target, 
  UserCheck, 
  Sliders, 
  LineChart,
  ShieldCheck,
  Video,
  FileText
} from 'lucide-react';

interface HowItWorksSectionProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenDemoModal: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  onSelectTab,
  onOpenDemoModal
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      num: 1,
      title: 'Diagnose',
      subtitle: 'A free test shows exactly where your child stands today.',
      icon: Target,
      details: [
        '20-minute adaptive diagnostic across foundational core concepts.',
        'Zero stress: measures conceptual understanding rather than rote memory.',
        'Detailed diagnostic report shared with parents showing exact gaps and speed metrics.'
      ],
      tutorAction: 'Lead Academic Counselor assesses results and sets 90-day targets.'
    },
    {
      num: 2,
      title: 'Match',
      subtitle: 'We pair your child with a vetted tutor, plus an AI helper for practice between classes.',
      icon: UserCheck,
      details: [
        'Top 2% acceptance rate among applicants from top universities.',
        'Matched by subject mastery, personality, and your child’s learning pace.',
        '24/7 AI practice assistant provides instant hints between scheduled classes.'
      ],
      tutorAction: 'Tutor reviews past school reports and designs custom starter modules.'
    },
    {
      num: 3,
      title: 'Personalise',
      subtitle: 'Lessons follow what is being taught in your child’s classroom.',
      icon: Sliders,
      details: [
        'Direct alignment with school homework, upcoming tests, and board syllabi.',
        'Interactive live whiteboard with recorded sessions for easy revision.',
        'Step-by-step problem dissection without rushing to formula memorization.'
      ],
      tutorAction: 'Weekly lesson plans adapt dynamically based on classroom tests.'
    },
    {
      num: 4,
      title: 'Review',
      subtitle: 'Regular check-ins and parent meetings keep progress visible.',
      icon: LineChart,
      details: [
        'Transparent parent dashboard with attendance, notes, and mastery metrics.',
        'Scheduled 1-on-1 parent-tutor check-ins every 4 weeks.',
        'Periodic mock examinations with standardized grading rubrics.'
      ],
      tutorAction: 'Monthly progress audit submitted directly to parent app portal.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
      
      {/* Header with Breadcrumb (matching screenshot) */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-amber-400">
          <button onClick={() => onSelectTab('home')} className="hover:underline">Home</button>
          <span className="mx-2 text-slate-500">/</span>
          <span className="text-slate-300">How it works</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          How every learning plan works
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Four steps, from first test to ongoing review.
        </p>
      </div>

      {/* Interactive Step Switcher & Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s) => {
          const isSelected = activeStep === s.num;
          const IconComp = s.icon;

          return (
            <div
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`p-6 rounded-3xl bg-[#140b33] border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                isSelected 
                  ? 'border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50' 
                  : 'border-indigo-900/60 hover:border-indigo-600'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-violet-900/40 text-violet-300 border border-violet-700/50'
                  }`}>
                    {s.num}
                  </div>
                  <IconComp className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">{s.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mt-2">
                    {s.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-indigo-900/40 text-xs text-amber-400 font-semibold flex items-center justify-between">
                <span>{isSelected ? 'Active Details' : 'View Step Details'}</span>
                <span>&rarr;</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Active Step Deep Dive */}
      {(() => {
        const current = steps.find(s => s.num === activeStep) || steps[0];
        return (
          <div className="p-8 sm:p-10 rounded-3xl bg-[#1a0f40] border border-amber-400/30 space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/60 pb-5">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Deep Dive &bull; Step {current.num}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {current.title}: {current.subtitle}
                </h3>
              </div>
              <button
                onClick={onOpenDemoModal}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wide shadow-md active:scale-95 transition-all self-start sm:self-auto"
              >
                Experience This in Free Demo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                  What Happens in This Phase:
                </h4>
                <div className="space-y-3">
                  {current.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#120a30] border border-indigo-800/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Educator Accountability:</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {current.tutorAction}
                </p>
                <div className="pt-2 flex items-center gap-3 text-xs text-slate-400 border-t border-indigo-900/40">
                  <span className="flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-indigo-400" /> 1:1 Live Video
                  </span>
                  <span aria-hidden="true">&bull;</span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Recorded Notes
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tutor Quality & Vetting Standard */}
      <div className="p-8 rounded-3xl bg-[#140b33] border border-indigo-900/60 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="text-2xl font-black text-amber-400 tabular-nums">Top 2%</div>
          <h4 className="text-base font-bold text-white">Rigorously Vetted Educators</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every tutor undergoes identity checks, subject knowledge assessments, and simulated teaching evaluations.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-2xl font-black text-amber-400 tabular-nums">100%</div>
          <h4 className="text-base font-bold text-white">Live Whiteboard Recording</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every lesson and whiteboard annotation is saved to your child&apos;s portal for revision before school tests.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-2xl font-black text-amber-400 tabular-nums">Zero-Risk</div>
          <h4 className="text-base font-bold text-white">Tutor Replacement Guarantee</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            If you ever feel the chemistry or teaching style isn&apos;t a 100% match, we switch tutors instantly with zero hassle.
          </p>
        </div>
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
