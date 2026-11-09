import React, { useState } from 'react';
import { PortalRole, ClassSession } from '../../types';
import { MOCK_SESSIONS } from '../../data/tutorMonkData';
import { Logo } from '../Logo';
import { apiJson, setToken, getToken } from '../../utils/api';
import { StudentDashboard } from './StudentDashboard';
import { TutorDashboard } from './TutorDashboard';
import AdminDashboard from './AdminDashboard';
import { InteractiveClassroomModal } from './InteractiveClassroomModal';
import { LivePortal } from './LivePortal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { 
  GraduationCap, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  LogOut, 
  Video, 
  ArrowLeft,
  Lock,
  Mail,
  Sparkles,
  Database
} from 'lucide-react';

export interface PortalUser {
  mustChange?: boolean;
  id: string;
  name: string;
  role: PortalRole;
  email: string;
  avatar: string;
  title?: string;
}

const DEMO_USERS: Record<PortalRole, PortalUser> = {
  student: {
    id: 'usr_stu_1',
    name: 'Aarav Sharma',
    role: 'student',
    email: 'aarav.sharma@tutormonk.student',
    avatar: 'A',
    title: 'Grade 9 - Australian Curriculum'
  },
  tutor: {
    id: 'usr_tut_1',
    name: 'Dr. Elena Vance',
    role: 'tutor',
    email: 'dr.elena.vance@tutormonk.faculty',
    avatar: 'E',
    title: 'Senior Mathematics & Physics Specialist'
  },
  admin: {
    id: 'usr_adm_1',
    name: 'Tutor Monk HQ',
    role: 'admin',
    email: 'admin@tutormonk.com',
    avatar: 'TM',
    title: 'Global Academic Operations'
  }
};

export interface PortalViewProps {
  onBackToHome: () => void;
  onOpenBooking: () => void;
  onOpenWhatsApp: () => void;
}

export const PortalView: React.FC<PortalViewProps> = ({ 
  onBackToHome, 
  onOpenBooking,
  onOpenWhatsApp 
}) => {
  const [realUser, setRealUser] = useState<PortalUser | null>(() => {
    try {
      const raw = localStorage.getItem('tm_user');
      return raw && getToken() ? (JSON.parse(raw) as PortalUser) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!realUser);
  const [currentRole, setCurrentRole] = useState<PortalRole>(realUser?.role || 'student');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const canSwitchRole = !realUser;
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<ClassSession>(MOCK_SESSIONS[0]);

  const currentUser = realUser || DEMO_USERS[currentRole];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const data = await apiJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const u = data.user;
      const portalUser: PortalUser = {
        id: String(u.id),
        name: u.name,
        role: u.role,
        email: u.email,
        avatar: (u.name || '?').trim().charAt(0).toUpperCase(),
        title: u.role === 'admin' ? 'Administrator' : undefined,
        mustChange: !!data.mustChangePassword
      };
      setToken(data.token);
      try { localStorage.setItem('tm_user', JSON.stringify(portalUser)); } catch { /* ignore */ }
      setRealUser(portalUser);
      setCurrentRole(portalUser.role);
      setPasswordInput('');
      setIsAuthenticated(true);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSelectRolePreset = (role: PortalRole) => {
    setCurrentRole(role);
    setEmailInput(DEMO_USERS[role].email);
    setPasswordInput('password123');
    setIsAuthenticated(true);
  };

  const handlePasswordChanged = () => {
    if (realUser) {
      const updated = { ...realUser, mustChange: false };
      try { localStorage.setItem('tm_user', JSON.stringify(updated)); } catch { /* ignore */ }
      setRealUser(updated);
    }
    setShowPw(false);
  };

  const handleLogout = () => {
    setToken(null);
    try { localStorage.removeItem('tm_user'); } catch { /* ignore */ }
    setRealUser(null);
    setEmailInput('');
    setPasswordInput('');
    setIsAuthenticated(false);
  };

  const handleLaunchClassroom = (session: ClassSession) => {
    setActiveSession(session);
    setIsClassroomOpen(true);
  };

  return (
    <div className="clay-portal min-h-screen text-white flex flex-col">
      {/* Portal Top Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-violet-900/30"
              title="Return to Public Website"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Main Website</span>
            </button>
            <div className="h-5 w-px bg-violet-800/60" />
            <Logo onClick={onBackToHome} className="h-10 sm:h-12 cursor-pointer" />
            <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-violet-800/40 text-violet-300 text-xs font-mono font-medium border border-violet-700/30">
              LMS / TMS Portal
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 text-xs font-mono font-medium border border-emerald-800/60">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Storage Library</span>
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
              {/* Role Quick Selector (demo mode only) */}
              {canSwitchRole && (<div className="hidden lg:flex items-center bg-violet-950/80 p-1 rounded-xl border border-violet-700/30 text-xs">
                {(['student', 'tutor', 'admin'] as PortalRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => setCurrentRole(role)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                      currentRole === role
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>)}

              {/* Classroom Launch Trigger */}
              {(!realUser || realUser.role === 'admin') && (
<button
                onClick={() => setIsClassroomOpen(true)}
                aria-label="Launch 1:1 Classroom"
                className="flex items-center gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Launch 1:1 Classroom</span>
              </button>
              )}

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-1 sm:gap-2 pl-1.5 sm:pl-2 border-l border-violet-800/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-violet-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md">
                  {currentUser.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-amber-300 capitalize">{currentUser.role}</div>
                </div>
                {realUser && (
                  <button
                    onClick={() => setShowPw(true)}
                    title="Change password"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onBackToHome}
              className="text-xs text-slate-300 hover:text-white"
            >
              Exit to Homepage
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!isAuthenticated ? (
          /* Authentication Screen (Directly matching Screenshot_20261026-195502_Chrome_ac9f70a0.png) */
          <div className="max-w-md mx-auto py-12 px-4">
            <div className="bg-[#140b33] rounded-3xl p-6 sm:p-8 border border-violet-600/30 shadow-2xl shadow-violet-950/80">
              <div className="flex justify-center mb-6">
                <Logo className="h-20" />
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white text-center mb-1">
                Tutor Monk Portal
              </h2>
              <p className="text-xs text-slate-400 text-center mb-6">
                Students, tutors and admin use the same login.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="Email"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0b061d] border border-violet-800/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="Password"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0b061d] border border-violet-800/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="text-xs text-red-300 bg-red-950/50 border border-red-800/60 rounded-lg px-3 py-2">
                    {loginError}
                  </div>
                )}

                {/* Amber button matching screenshot */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-98 mt-2"
                >
                  {isLoggingIn ? 'Signing in...' : 'Log in'}
                </button>
              </form>

              {!import.meta.env.PROD && (
              <div className="mt-8 pt-6 border-t border-violet-900/50">
                <div className="text-xs font-semibold text-slate-300 text-center mb-3 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Instant Test Login (Select a Role):
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSelectRolePreset('student')}
                    className="p-2.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/40 border border-violet-700/30 text-left transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                      Student
                    </div>
                    <div className="text-[11px] text-slate-400">Aarav (Grade 9)</div>
                  </button>

                  <button
                    onClick={() => handleSelectRolePreset('tutor')}
                    className="p-2.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/40 border border-violet-700/30 text-left transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Tutor
                    </div>
                    <div className="text-[11px] text-slate-400">Dr. Elena Vance</div>
                  </button>

                  <button
                    onClick={() => handleSelectRolePreset('admin')}
                    className="p-2.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/40 border border-violet-700/30 text-left transition-all"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                      Admin
                    </div>
                    <div className="text-[11px] text-slate-400">Operations HQ</div>
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>
        ) : (
          /* Role Dashboard Content */
          <div>
            {/* Mobile Role Switcher (demo mode only) */}
            {canSwitchRole && (<div className="lg:hidden flex items-center justify-between bg-violet-950/80 p-1.5 rounded-2xl border border-violet-700/30 text-xs mb-6 overflow-x-auto">
              {(['student', 'tutor', 'admin'] as PortalRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`flex-1 py-1.5 px-2 rounded-xl capitalize font-medium text-center transition-all ${
                    currentRole === role
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>)}

            {realUser && realUser.role !== 'admin' && (
              <LivePortal
                user={{ id: realUser.id, name: realUser.name, role: realUser.role }}
                onLaunchClassroom={handleLaunchClassroom}
              />
            )}
            {!realUser && currentRole === 'student' && (
              <StudentDashboard onLaunchClassroom={handleLaunchClassroom} />
            )}
            {!realUser && currentRole === 'tutor' && (
              <TutorDashboard onLaunchClassroom={handleLaunchClassroom} />
            )}
            {currentRole === 'admin' && (
              <AdminDashboard onOpenClassroom={() => setIsClassroomOpen(true)} />
            )}
          </div>
        )}
      </main>

      {realUser && (realUser.mustChange || showPw) && (
        <ChangePasswordModal
          forced={!!realUser.mustChange}
          onDone={handlePasswordChanged}
          onClose={() => setShowPw(false)}
        />
      )}

      {/* Live Classroom Modal */}
      <InteractiveClassroomModal
        session={activeSession}
        isOpen={isClassroomOpen}
        onClose={() => setIsClassroomOpen(false)}
      />
    </div>
  );
};

export default PortalView;
