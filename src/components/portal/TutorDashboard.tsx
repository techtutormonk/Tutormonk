import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Play, 
  FileEdit, 
  Star,
  Award,
  Sparkles
} from 'lucide-react';
import { MOCK_SESSIONS } from '../../data/tutorMonkData';
import { ClassSession } from '../../types';

interface TutorDashboardProps {
  onLaunchClassroom: (session: ClassSession) => void;
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({ onLaunchClassroom }) => {
  const [remarkText, setRemarkText] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const students = [
    { name: 'Aarav Sharma', grade: 'Grade 8', subject: 'Linear Algebra', progress: '88%', status: 'Next Class Today, 4:30 PM' },
    { name: 'Maya Lin', grade: 'Grade 11', subject: 'Digital SAT Prep', progress: '94%', status: 'Tomorrow, 6:00 PM' },
    { name: 'Ethan Brooks', grade: 'Year 5 (Australia)', subject: 'NAPLAN Numeracy', progress: '82%', status: 'Thursday, 3:30 PM' }
  ];

  const handleSaveRemarks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkText.trim()) return;
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setRemarkText('');
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Tutor Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#140b33] border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            ER
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white">Dr. Evelyn Reed</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800">
                Verified Lead Tutor
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Oxford University Alum &bull; Mathematics &amp; Statistics Specialist &bull; 640+ Hours Taught
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onLaunchClassroom(MOCK_SESSIONS[0])}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Open Whiteboard Studio</span>
          </button>
        </div>
      </div>

      {/* Tutor Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#140b33] border border-indigo-900/60 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Assigned Students</span>
          <div className="text-2xl font-black text-white tabular-nums">12 Active</div>
          <div className="text-[11px] text-slate-400">USA, India &amp; Australia</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#140b33] border border-indigo-900/60 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Student Rating</span>
          <div className="text-2xl font-black text-amber-400 tabular-nums flex items-center gap-1">
            <span>4.98</span>
            <Star className="w-4 h-4 fill-amber-400" />
          </div>
          <div className="text-[11px] text-slate-400">From 118 student reviews</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#140b33] border border-indigo-900/60 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Classes This Month</span>
          <div className="text-2xl font-black text-emerald-400 tabular-nums">48 Hours</div>
          <div className="text-[11px] text-slate-400">100% on-time start rate</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#140b33] border border-indigo-900/60 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Upcoming Session</span>
          <div className="text-2xl font-black text-white text-base pt-1">Today, 4:30 PM</div>
          <div className="text-[11px] text-amber-300">With Aarav Sharma</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Assigned Students Roster (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>My Active Students Roster</span>
              <span className="text-xs text-slate-400 font-normal">3 Countries Represented</span>
            </h3>

            <div className="space-y-3">
              {students.map((st, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#1a0f40] border border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{st.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                        {st.grade}
                      </span>
                    </div>
                    <div className="text-xs text-amber-300 font-medium">{st.subject}</div>
                    <div className="text-[11px] text-slate-400">{st.status}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Mastery</div>
                      <div className="text-sm font-bold text-emerald-400 tabular-nums">{st.progress}</div>
                    </div>

                    <button
                      onClick={() => onLaunchClassroom(MOCK_SESSIONS[0])}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase transition-colors"
                    >
                      Start Class
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Post-Class Remarks logger */}
          <div className="p-6 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-4">
            <h3 className="text-lg font-bold text-white">Log Class Remarks &amp; Homework</h3>

            {savedSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Remarks successfully synced to Student Portal!</span>
              </div>
            )}

            <form onSubmit={handleSaveRemarks} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">Select Student</label>
                  <select className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl px-3 py-2 text-white">
                    <option>Aarav Sharma (Grade 8 Math)</option>
                    <option>Maya Lin (Grade 11 SAT)</option>
                    <option>Ethan Brooks (Year 5 NAPLAN)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">Engagement Score (1-5)</label>
                  <select className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl px-3 py-2 text-white">
                    <option>5 - Exceptional Focus &amp; Questions</option>
                    <option>4 - Very Good Comprehension</option>
                    <option>3 - Moderate (Needs Homework Revision)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold text-xs">Tutor Note for Student</label>
                <textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="e.g. Mastered slope calculation quickly today. Assigned 6 homework practice questions on coordinate geometry."
                  rows={3}
                  className="w-full bg-[#1e1342] border border-indigo-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all shadow-md active:scale-95"
              >
                Publish Feedback to Student
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Time Zone Availability & Resource Upload & Attendance */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-4">
            <h3 className="font-bold text-sm text-white">Resource &amp; Notes Upload</h3>
            <p className="text-xs text-slate-300">Upload PDF worksheets, formulas, or lecture notes for your students.</p>
            <input type="file" className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-400 file:text-slate-950 hover:file:bg-amber-300 cursor-pointer" />
            <button onClick={() => alert('Resource uploaded successfully!')} className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">
              Upload File
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-4">
            <h3 className="font-bold text-sm text-white">Attendance Tracker</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#1a0f40]">
                <span>Aarav Sharma</span>
                <span className="text-emerald-400 font-bold">Present (14/14)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#1a0f40]">
                <span>Maya Lin</span>
                <span className="text-emerald-400 font-bold">Present (10/10)</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#140b33] border border-indigo-900/60 space-y-4">
            <h3 className="font-bold text-sm text-white">My Weekly Availability</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Open slots are automatically matched to students across North America, Europe, and Asia-Pacific.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#1b1043] border border-indigo-800 flex justify-between items-center">
                <span className="font-semibold text-white">Monday - Friday</span>
                <span className="text-amber-400 font-mono">3:00 PM - 9:00 PM</span>
              </div>
              <div className="p-3 rounded-xl bg-[#1b1043] border border-indigo-800 flex justify-between items-center">
                <span className="font-semibold text-white">Saturday - Sunday</span>
                <span className="text-amber-400 font-mono">9:00 AM - 6:00 PM</span>
              </div>
            </div>

            <button
              onClick={() => alert('Your classes are on the Class calendar in the Live Portal tab. Times show in your timezone and in each student\'s timezone.')}
              className="w-full py-2.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-slate-200 font-semibold text-xs border border-indigo-700 transition-colors"
            >
              Where is my class calendar?
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
