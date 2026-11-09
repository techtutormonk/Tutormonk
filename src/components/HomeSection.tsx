import React, { useState } from 'react';
import { NavTab, CountryCode } from '../types';
import { COUNTRIES_DATA, SCHOOL_SUBJECTS, SKILL_ACADEMY_PROGRAMS, TESTIMONIALS, SAMPLE_DIAGNOSTIC_QUESTIONS } from '../data/tutorMonkData';
import { 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Globe2, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  Lightbulb,
  Zap,
  Star
} from 'lucide-react';

interface HomeSectionProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenDemoModal: () => void;
  selectedCountry: CountryCode;
  onSelectCountry: (country: CountryCode) => void;
  onTogglePortal: () => void;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  onSelectTab,
  onOpenDemoModal,
  selectedCountry,
  onSelectCountry,
  onTogglePortal
}) => {
  // Mini Diagnostic Quiz interactive state
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuiz = SAMPLE_DIAGNOSTIC_QUESTIONS[activeQuizIndex];

  const handleSelectOption = (index: number) => {
    setSelectedAnswer(index);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setActiveQuizIndex((prev) => (prev + 1) % SAMPLE_DIAGNOSTIC_QUESTIONS.length);
  };

  return (
    <div className="space-y-24 py-6 md:py-12">
      
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl space-y-6">
          
          {/* Live 1:1 indicator */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/90 border border-indigo-700/60 text-xs font-semibold text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live 1:1 classes</span>
          </div>

          {/* Hero Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
            One tutor. One child. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
              Real progress.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl">
            Live 1:1 online classes for ages 5 to 17, from school subjects to exam prep and future skills.
          </p>

          {/* Dual Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onOpenDemoModal}
              className="px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Book a free demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePortal}
              className="px-7 py-3.5 rounded-2xl bg-[#1d1245] hover:bg-[#27195d] text-slate-100 font-bold text-base border border-indigo-700/60 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Open portal</span>
            </button>
          </div>

          {/* Key Metrics Strip (directly matching screenshot) */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-6 max-w-xl">
            <div className="p-4 rounded-2xl bg-[#140b33]/80 border border-indigo-900/60">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-200 tabular-nums">5,000+</div>
              <div className="text-xs text-slate-400 mt-1">Learners taught</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#140b33]/80 border border-indigo-900/60">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-200 tabular-nums">300+</div>
              <div className="text-xs text-slate-400 mt-1">Verified tutors</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <div className="text-2xl sm:text-3xl font-black tabular-nums">15+</div>
              <div className="text-xs text-slate-900 font-semibold mt-1">Countries</div>
            </div>
          </div>

          {/* We teach in: selector tabs */}
          <div className="pt-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              We teach in:
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'usa' as CountryCode, label: 'USA', flag: '🇺🇸' },
                { code: 'canada' as CountryCode, label: 'Canada', flag: '🇨🇦' },
                { code: 'uk' as CountryCode, label: 'UK', flag: '🇬🇧' },
                { code: 'india' as CountryCode, label: 'India', flag: '🇮🇳' },
                { code: 'australia' as CountryCode, label: 'Australia', flag: '🇦🇺' },
                { code: 'international' as CountryCode, label: 'International', flag: '🌐' }
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    onSelectCountry(item.code);
                    onSelectTab('countries');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 ${
                    selectedCountry === item.code
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-sm'
                      : 'bg-[#180f3b] text-slate-200 border-indigo-800/60 hover:border-amber-400/60'
                  }`}
                >
                  <span>{item.flag}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Continuous Animated Ticker of Target Curricula (Always Moving) */}
      <section 
        aria-label="Target curricula ticker"
        className="border-y border-indigo-900/50 bg-[#0e0728]/85 backdrop-blur-md py-3 overflow-hidden relative"
      >
        <div className="flex items-center">
          {/* Pinned Left Label matching screenshot */}
          <div className="z-20 pl-4 sm:pl-8 pr-3.5 bg-gradient-to-r from-[#0e0728] via-[#0e0728] to-transparent flex items-center gap-2 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
              Target Curricula:
            </span>
            <div className="h-4 w-px bg-indigo-700/60 ml-1 hidden sm:block" />
          </div>

          {/* Smooth Continuous Moving Marquee Track */}
          <div className="relative w-full overflow-hidden">
            {/* Edge fade gradients */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0e0728] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0e0728] to-transparent z-10" />

            <div className="animate-continuous-ticker flex items-center gap-5 text-xs text-slate-300 whitespace-nowrap select-none">
              {/* First Set of Curricula Items */}
              {[
                { name: 'NAPLAN (Years 3, 5, 7, 9)', flag: '🇦🇺' },
                { name: 'ICAS Assessments', flag: '🇦🇺' },
                { name: 'HSC & ATAR Prep', flag: '🇦🇺' },
                { name: 'Selective School & OC', flag: '🇦🇺' },
                { name: '10th & 12th Boards (CBSE / ICSE)', flag: '🇮🇳' },
                { name: 'IIT-JEE (Main & Advanced)', flag: '🇮🇳' },
                { name: 'NEET Medical Entrance', flag: '🇮🇳' },
                { name: 'Digital SAT & ACT Math', flag: '🇺🇸' },
                { name: 'AP Calculus & Physics', flag: '🇺🇸' },
                { name: '11+ Grammar School Entrance', flag: '🇬🇧' },
                { name: 'GCSE & A-Levels', flag: '🇬🇧' },
                { name: 'Canadian Provincial K-12', flag: '🇨🇦' },
                { name: 'IB Diploma & MYP', flag: '🌐' },
                { name: 'Cambridge IGCSE', flag: '🌐' },
                { name: 'International Olympiads (IMO / NSO)', flag: '🏆' },
              ].map((item, idx) => (
                <React.Fragment key={`ticker-1-${idx}`}>
                  <button
                    onClick={() => onSelectTab('exams')}
                    className="inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors font-medium cursor-pointer group"
                  >
                    <span>{item.flag}</span>
                    <span className="group-hover:underline underline-offset-2">{item.name}</span>
                  </button>
                  <span className="text-violet-500/60 font-bold" aria-hidden="true">&bull;</span>
                </React.Fragment>
              ))}

              {/* Second Duplicated Set for Seamless Infinite Scrolling */}
              {[
                { name: 'NAPLAN (Years 3, 5, 7, 9)', flag: '🇦🇺' },
                { name: 'ICAS Assessments', flag: '🇦🇺' },
                { name: 'HSC & ATAR Prep', flag: '🇦🇺' },
                { name: 'Selective School & OC', flag: '🇦🇺' },
                { name: '10th & 12th Boards (CBSE / ICSE)', flag: '🇮🇳' },
                { name: 'IIT-JEE (Main & Advanced)', flag: '🇮🇳' },
                { name: 'NEET Medical Entrance', flag: '🇮🇳' },
                { name: 'Digital SAT & ACT Math', flag: '🇺🇸' },
                { name: 'AP Calculus & Physics', flag: '🇺🇸' },
                { name: '11+ Grammar School Entrance', flag: '🇬🇧' },
                { name: 'GCSE & A-Levels', flag: '🇬🇧' },
                { name: 'Canadian Provincial K-12', flag: '🇨🇦' },
                { name: 'IB Diploma & MYP', flag: '🌐' },
                { name: 'Cambridge IGCSE', flag: '🌐' },
                { name: 'International Olympiads (IMO / NSO)', flag: '🏆' },
              ].map((item, idx) => (
                <React.Fragment key={`ticker-2-${idx}`}>
                  <button
                    onClick={() => onSelectTab('exams')}
                    className="inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors font-medium cursor-pointer group"
                  >
                    <span>{item.flag}</span>
                    <span className="group-hover:underline underline-offset-2">{item.name}</span>
                  </button>
                  <span className="text-violet-500/60 font-bold" aria-hidden="true">&bull;</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How Every Learning Plan Works (4 Steps from screenshots) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Our Methodology</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How every learning plan works
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Four steps, from first test to ongoing review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1: Diagnose */}
          <div className="p-6 rounded-2xl bg-[#140b33] border border-indigo-900/60 hover:border-indigo-600 transition-all space-y-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 font-bold flex items-center justify-center text-lg">
              1
            </div>
            <h3 className="text-xl font-bold text-white">Diagnose</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              A free test shows exactly where your child stands today, pinpointing foundational strengths and specific gaps.
            </p>
            <div className="pt-2 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Free 20-min assessment</span> &rarr;
            </div>
          </div>

          {/* Step 2: Match */}
          <div className="p-6 rounded-2xl bg-[#140b33] border border-indigo-900/60 hover:border-indigo-600 transition-all space-y-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 font-bold flex items-center justify-center text-lg">
              2
            </div>
            <h3 className="text-xl font-bold text-white">Match</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              We pair your child with a vetted tutor, plus an AI helper for targeted practice and confidence between classes.
            </p>
            <div className="pt-2 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Top 2% educator vetting</span> &rarr;
            </div>
          </div>

          {/* Step 3: Personalise */}
          <div className="p-6 rounded-2xl bg-[#140b33] border border-indigo-900/60 hover:border-indigo-600 transition-all space-y-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 font-bold flex items-center justify-center text-lg">
              3
            </div>
            <h3 className="text-xl font-bold text-white">Personalise</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Lessons follow what is being taught in your child&apos;s classroom, pacing ahead for exams or reinforcing tough topics.
            </p>
            <div className="pt-2 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Custom syllabus pacing</span> &rarr;
            </div>
          </div>

          {/* Step 4: Review */}
          <div className="p-6 rounded-2xl bg-[#140b33] border border-indigo-900/60 hover:border-indigo-600 transition-all space-y-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 font-bold flex items-center justify-center text-lg">
              4
            </div>
            <h3 className="text-xl font-bold text-white">Review</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Regular check-ins and parent meetings keep progress visible, with recorded whiteboard logs and milestone tracking.
            </p>
            <div className="pt-2 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Bi-weekly parent reports</span> &rarr;
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 60-Second Diagnostic Simulator (Elevated feature from screenshot "Diagnose") */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1b1043] to-[#120a30] border border-indigo-700/50 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/50 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wide">
                <Lightbulb className="w-4 h-4" />
                <span>Interactive Concept Check</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Experience How Our Diagnostic Pinpoints Gaps
              </h3>
            </div>
            <div className="text-xs text-slate-400 font-medium self-start sm:self-center bg-indigo-950 px-3 py-1.5 rounded-lg border border-indigo-800">
              Question {activeQuizIndex + 1} of {SAMPLE_DIAGNOSTIC_QUESTIONS.length}
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              {currentQuiz.subject}
            </div>
            <div className="text-base sm:text-lg font-medium text-slate-100">
              {currentQuiz.question}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQuiz.options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === currentQuiz.correctIndex;
                let btnStyle = 'bg-[#140b33] border-indigo-800 text-slate-200 hover:border-indigo-500';

                if (showExplanation) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={showExplanation}
                    className={`p-3.5 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {showExplanation && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="p-4 rounded-xl bg-indigo-950/90 border border-indigo-700/60 text-xs sm:text-sm text-slate-200 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Zap className="w-4 h-4" />
                  <span>Tutor Insight &amp; Root Concept:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {currentQuiz.explanation}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                  >
                    Try Next Diagnostic &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Curricula & School Readiness Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">School &amp; Exam Readiness</div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Master core subjects &amp; competitive exams
            </h2>
          </div>
          <button
            onClick={() => onSelectTab('school')}
            className="text-amber-400 hover:text-amber-300 font-semibold text-sm flex items-center gap-1 self-start"
          >
            <span>View all subject programs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SCHOOL_SUBJECTS.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onSelectTab('school')}
              className="p-6 rounded-2xl bg-[#140b33] border border-indigo-900/60 hover:border-indigo-600 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-amber-400 font-bold group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  {sub.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {sub.description}
                </p>
              </div>

              <div className="pt-6 border-t border-indigo-900/40 mt-6 flex items-center justify-between text-xs font-semibold text-amber-400">
                <span>Explore syllabus</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skill Academy Preview (From screenshot: Vedic Maths, Chess, Coding & AI, Public Speaking) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Future Skills</div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Skill Academy
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Skills that school rarely teaches, in lessons that feel like play.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('skills')}
            className="text-amber-400 hover:text-amber-300 font-semibold text-sm flex items-center gap-1 self-start"
          >
            <span>Explore all skills</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SKILL_ACADEMY_PROGRAMS.slice(0, 3).map((skill) => (
            <div
              key={skill.id}
              onClick={() => onSelectTab('skills')}
              className="p-6 rounded-2xl bg-[#140b33] border border-indigo-900/60 hover:border-amber-400/50 transition-all cursor-pointer group space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-300 font-medium">{skill.ageGroup}</span>
                <span className="text-xs text-slate-400">{skill.duration}</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                {skill.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {skill.description}
              </p>
              <div className="pt-2 text-xs font-semibold text-amber-400 flex items-center gap-1">
                <span>See curriculum &amp; outcomes</span> &rarr;
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Parent Outcomes & Evidence Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Verified Outcomes</div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Loved by parents across 15+ countries
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-[#140b33]/70 border border-indigo-900/60 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <div className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md inline-block border border-emerald-800/60">
                  {t.metric}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-indigo-900/40 text-xs">
                <div className="font-bold text-white">{t.parent}</div>
                <div className="text-slate-400">{t.child} &bull; {t.location}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ready for a Free Demo CTA Card (Exactly matching screenshot) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-800 text-center text-white space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready for a free demo?
            </h2>
            <p className="text-violet-100 text-sm sm:text-base leading-relaxed">
              Start with a free demo and discover a learning approach built around your student.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenDemoModal}
              className="px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/30 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <span>Book a free demo</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
