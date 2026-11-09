import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Globe, 
  Calendar,
  MoreVertical,
  ShieldCheck,
  Video,
  Database,
  Sparkles
} from 'lucide-react';
import { StorageManager } from './StorageManager';
import { apiJson } from '../../utils/api';
import { UserManager } from './UserManager';
import { ClassManager } from './ClassManager';
import { QuizSection } from './QuizSection';
import { AuditLogView } from './AuditLogView';
import { DeleteCenter } from './DeleteCenter';

interface Lead {
  id: string;
  dbId: number;
  studentName: string;
  parentName: string;
  grade: string;
  country: string;
  curriculum: string;
  subjects: string[];
  contact: string;
  email: string;
  status: 'New' | 'Demo Scheduled' | 'Follow-up' | 'Enrolled';
  assignedTutor?: string;
  scheduledTime?: string;
}

const STATUS_FROM_DB: Record<string, Lead['status']> = {
  new: 'New',
  contacted: 'Follow-up',
  demo_booked: 'Demo Scheduled',
  converted: 'Enrolled',
  lost: 'Follow-up'
};
const STATUS_TO_DB: Record<Lead['status'], string> = {
  'New': 'new',
  'Follow-up': 'contacted',
  'Demo Scheduled': 'demo_booked',
  'Enrolled': 'converted'
};

const mapLead = (r: any): Lead => ({
  id: `LD-${r.id}`,
  dbId: r.id,
  studentName: r.student_name || r.name || 'Unknown',
  parentName: r.name || '-',
  grade: r.grade || '-',
  country: r.country || '-',
  curriculum: r.source || 'website',
  subjects: r.subject ? [r.subject] : [],
  contact: r.phone || '-',
  email: r.email || '',
  status: STATUS_FROM_DB[r.status] || 'New',
  assignedTutor: undefined,
  scheduledTime: r.message || ''
});


export default function AdminDashboard({ onOpenClassroom }: { onOpenClassroom: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const loadLeads = async () => {
    setLeadsLoading(true);
    try {
      const rows = await apiJson<any[]>('/api/leads');
      setLeads(rows.map(mapLead));
      setLeadsError(null);
    } catch (e: any) {
      setLeadsError(e.message || 'Could not load leads');
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'database' | 'leads' | 'users' | 'classes' | 'quizzes' | 'audit' | 'delete'>('database');

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesSearch = 
      lead.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const updateLeadStatus = async (id: string, newStatus: Lead['status']) => {
    const target = leads.find(l => l.id === id);
    if (!target) return;
    const previous = target.status;
    setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
    try {
      await apiJson(`/api/leads/${target.dbId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: STATUS_TO_DB[newStatus] })
      });
    } catch (e: any) {
      setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, status: previous } : lead));
      setLeadsError(e.message || 'Could not update lead');
    }
  };

  return (
    <div className="space-y-8">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-violet-800/40 pb-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'database'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-amber-400 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Data Storage</span>
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'leads'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-violet-900/30'
            }`}
          >
            Demo Booking Queue ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-violet-900/30'
            }`}
          >
            Users & Passwords
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'classes'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-violet-900/30'
            }`}
          >
            Classes & Billing
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'quizzes'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-violet-900/30'
            }`}
          >
            Quizzes
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-violet-900/30'
            }`}
          >
            Audit Log
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'delete'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'text-red-300 hover:text-white hover:bg-red-900/30'
            }`}
          >
            Delete Center
          </button>
        </div>
      </div>

      {/* DATA STORAGE MANAGER */}
      {activeTab === 'database' && (
        <StorageManager />
      )}

      {activeTab === 'users' && <UserManager />}

      {activeTab === 'classes' && <ClassManager />}

      {activeTab === 'quizzes' && <QuizSection role="admin" />}

      {activeTab === 'audit' && <AuditLogView />}

      {activeTab === 'delete' && <DeleteCenter />}

      {/* LEADS QUEUE */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-violet-950/40 p-4 rounded-2xl border border-violet-500/20">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student, parent, country, or subject..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-violet-500/30 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900/80 border border-violet-500/30 text-slate-200 text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Statuses</option>
                <option value="New">New Leads</option>
                <option value="Demo Scheduled">Demo Scheduled</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Enrolled">Enrolled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-violet-500/20 bg-slate-900/60 backdrop-blur-md">
            <table className="w-full text-left text-sm">
              <thead className="bg-violet-950/60 border-b border-violet-800/40 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Lead ID & Student</th>
                  <th className="px-5 py-3.5 font-semibold">Region / Curriculum</th>
                  <th className="px-5 py-3.5 font-semibold">Requested Subjects</th>
                  <th className="px-5 py-3.5 font-semibold">Tutor Assignment</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-900/20 text-slate-200">
                {leadsLoading && (
                  <tr><td colSpan={6} className="px-5 py-6 text-center text-slate-400 text-sm">Loading leads from database...</td></tr>
                )}
                {!leadsLoading && leadsError && (
                  <tr><td colSpan={6} className="px-5 py-6 text-center text-red-300 text-sm">{leadsError}</td></tr>
                )}
                {!leadsLoading && !leadsError && filteredLeads.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-6 text-center text-slate-400 text-sm">No demo bookings yet.</td></tr>
                )}
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-violet-900/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{lead.studentName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{lead.parentName}</span>
                        <span>•</span>
                        <span className="font-mono text-amber-300">{lead.id}</span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-400" /> {lead.contact}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-950 border border-violet-600/40 text-xs text-violet-200 font-medium">
                        <Globe className="w-3 h-3 text-cyan-400" />
                        {lead.country}
                      </div>
                      <div className="text-xs text-slate-300 mt-1">{lead.curriculum}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{lead.grade}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {lead.subjects.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-700/30 text-[11px] text-indigo-200 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-white">{lead.assignedTutor || 'Unassigned'}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {lead.scheduledTime}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        lead.status === 'New'
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : lead.status === 'Demo Scheduled'
                          ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                          : lead.status === 'Enrolled'
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                          : 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                      }`}>
                        {lead.status === 'Enrolled' && <CheckCircle2 className="w-3 h-3" />}
                        {lead.status === 'New' && <AlertCircle className="w-3 h-3" />}
                        {lead.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={lead.status}
                          onChange={e => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                          className="text-xs bg-slate-900 border border-violet-500/30 text-white rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400"
                        >
                          <option value="New">Mark New</option>
                          <option value="Demo Scheduled">Schedule Demo</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Enrolled">Enroll Student</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
