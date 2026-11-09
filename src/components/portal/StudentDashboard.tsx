import React, { useState } from 'react';
import { 
  Play, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  Brain, 
  Upload, 
  Award,
  Sparkles,
  Send,
  ArrowRight,
  ExternalLink,
  Presentation,
  Video
} from 'lucide-react';
import { MOCK_SESSIONS } from '../../data/tutorMonkData';
import { ClassSession } from '../../types';

interface StudentDashboardProps {
  onLaunchClassroom: (session: ClassSession) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLaunchClassroom }) => {
  const [activeSession, setActiveSession] = useState<ClassSession>(MOCK_SESSIONS[0]);
  
  // AI Practice Companion State
  const [studentQuestion, setStudentQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Homework submission state
  const [homeworkStatus, setHomeworkStatus] = useState<'pending' | 'submitted'>('pending');

  const handleAskAiCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentQuestion.trim()) return;

    setIsAiThinking(true);
    setAiResponse(null);

    setTimeout(() => {
      setIsAiThinking(false);
      if (studentQuestion.toLowerCase().includes('slope') || studentQuestion.toLowerCase().includes('equation')) {
        setAiResponse(
          'To find the slope between (x1, y1) and (x2, y2), use m = (y2 - y1) / (x2 - x1). For example, between (1, 3) and (4, 9): m = (9 - 3) / (4 - 1) = 6 / 3 = 2! Would you like a practice problem to try?'
        );
      } else {
        setAiResponse(
          `Great question on "${studentQuestion}". Breaking it down into first principles: Step 1: Identify given variables. Step 2: Set up the governing formula. Step 3: Solve step-by-step. Let me know if you want me to calculate a specific value!`
        );
      }
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Hero: Next 1:1 Class Banner with Launch Button */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-violet-900/90 via-[#221354] to-indigo-900 border border-amber-400/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Next Live 1:1 Class &bull; Today 4:30 PM</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {activeSession.subject}: {activeSession.topic}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                ER
              </span>
              <span>{activeSession.tutorName}</span>
            </span>
            <span aria-hidden="true">&bull;</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>60 Minutes Live Session</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {activeSession.meetLink && (
            <a
              href={activeSession.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>Google Meet</span>
            </a>
          )}
          {activeSession.whiteboardLink && (
            <a
              href={activeSession.whiteboardLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Presentation className="w-4 h-4" />
              <span>Whiteboard</span>
            </a>
          )}
          <button
            onClick={() => onLaunchClassroom(activeSession)}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Internal Classroom</span>
          </button>
        </div>
      </div>

      {/* Grid: 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#140b33] border border-indigo-900/60 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Classes Completed</span>
          <div className="text-2xl font-black text-white tabular-nums">14 <span className="text-xs text-emerald-400 font-semibold font-sans">/ 20</span></div>
          <div className="text-[11px] text-slate-400 pt-1">6 remaining in current batch</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#140b33] border border-indigo-900/60 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Study Streak</span>
          <div className="text-2xl font-black text-amber-400 tabular-nums">5 Days 🔥</div>
          <div className="text-[11px] text-slate-400 pt-1">Top 5% consistency this month</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#140b33] border border-indigo-900/60 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Average Topic Mastery</span>
          <div className="text-2xl font-black text-emerald-400 tabular-nums">92.4%</div>
          <div className="text-[11px] text-slate-400 pt-1">+18% improvement since diagnosis</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Course Progress & Homework (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Subjects Tracker */}
          <div className="p-6 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>My Enrolled Subjects</span>
              <span className="text-xs text-amber-400 font-semibold cursor-pointer hover:underline">Syllabus Breakdown</span>
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#1a0f40] border border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white text-sm">Grade 8 Mathematics</span>
                  <span className="font-bold text-emerald-400 tabular-nums">88% Mastered</span>
                </div>
                <div className="w-full h-2 rounded-full bg-indigo-950 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '88%' }} />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Current: Linear Equations &amp; Coordinates</span>
                  <span>Next: Polynomial Factorization</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1a0f40] border border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white text-sm">Science &bull; Physics &amp; Chemistry</span>
                  <span className="font-bold text-emerald-400 tabular-nums">76% Mastered</span>
                </div>
                <div className="w-full h-2 rounded-full bg-indigo-950 overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: '76%' }} />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Current: Kinetic Energy &amp; Motion Graphs</span>
                  <span>Next: Chemical Bonding &amp; Valency</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1a0f40] border border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white text-sm">Skill Academy &bull; Coding &amp; AI</span>
                  <span className="font-bold text-emerald-400 tabular-nums">94% Mastered</span>
                </div>
                <div className="w-full h-2 rounded-full bg-indigo-950 overflow-hidden">
                  <div className="h-full bg-violet-400 rounded-full" style={{ width: '94%' }} />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Current: Python Game Loops &amp; Sprites</span>
                  <span>Next: Deploying Browser Web App</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Homework Card */}
          <div className="p-6 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-4">
            <h3 className="text-lg font-bold text-white">Pending Homework &amp; Practice Sheets</h3>

            <div className="p-4 rounded-2xl bg-[#1c1144] border border-indigo-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-400">MATH EXERCISE 4.3</div>
                <h4 className="text-sm font-bold text-white">Slope-Intercept Graphing &amp; Perpendicular Slopes</h4>
                <p className="text-xs text-slate-400">Assigned by Dr. Evelyn Reed &bull; Due Tomorrow, 5:00 PM</p>
              </div>

              {homeworkStatus === 'pending' ? (
                <button
                  onClick={() => setHomeworkStatus('submitted')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Submit Solution</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submitted &bull; Pending Review</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: AI Practice Helper & Scheduled Sessions */}
        <div className="space-y-6">
          
          {/* AI Practice Companion (Feature mentioned in "Match" step) */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#1b1043] to-[#120a30] border border-indigo-700/60 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">AI Homework Helper</h3>
                <span className="text-[10px] text-slate-400">Instant step-by-step concept clarification</span>
              </div>
            </div>

            <form onSubmit={handleAskAiCompanion} className="space-y-2">
              <textarea
                value={studentQuestion}
                onChange={(e) => setStudentQuestion(e.target.value)}
                placeholder="Paste an algebra problem or ask: 'How do I find slope of perpendicular line?'"
                rows={3}
                className="w-full bg-[#140b33] border border-indigo-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
              />
              <button
                type="submit"
                disabled={isAiThinking}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiThinking ? 'Explaining Step-by-Step...' : 'Ask AI Helper'}</span>
              </button>
            </form>

            {aiResponse && (
              <div className="p-3.5 rounded-xl bg-indigo-950 border border-indigo-800 text-xs text-slate-200 space-y-2 animate-in fade-in">
                <div className="font-bold text-amber-300 flex items-center gap-1">
                  <span>Step-by-Step Solution:</span>
                </div>
                <p className="leading-relaxed text-slate-300">{aiResponse}</p>
              </div>
            )}
          </div>

          {/* Upcoming Schedule */}
          <div className="p-6 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Upcoming 1:1 Schedule</span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </h3>

            <div className="space-y-3">
              {MOCK_SESSIONS.slice(1).map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-[#1a0f40] border border-indigo-800/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{s.subject}</div>
                      <div className="text-indigo-300 text-[11px]">{s.topic}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {s.meetLink && (
                        <a href={s.meetLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all" title="Join Google Meet">
                          <Video className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {s.whiteboardLink && (
                        <a href={s.whiteboardLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-all" title="Open Whiteboard">
                          <Presentation className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={() => onLaunchClassroom(s)} className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-all" title="Internal Whiteboard">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-slate-400 text-[10px] flex items-center justify-between pt-1 border-t border-indigo-800/30">
                    <span>{s.date} &bull; {s.time}</span>
                    <span className="text-amber-400 font-semibold">{s.tutorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
