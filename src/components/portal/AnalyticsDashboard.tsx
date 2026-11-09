import React from 'react';
import { TrendingUp, Users, DollarSign, BookOpen } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Revenue', value: '$124,500', icon: DollarSign },
          { title: 'Active Students', value: '5,240', icon: Users },
          { title: 'New Enrollments', value: '142', icon: BookOpen },
          { title: 'Growth Rate', value: '+12.5%', icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/60 p-5 rounded-2xl border border-violet-500/20">
            <div className="text-slate-400 text-xs flex items-center gap-2">
              <stat.icon className="w-4 h-4" />
              {stat.title}
            </div>
            <div className="text-2xl font-bold text-white mt-2">{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-violet-500/20">
        <h3 className="text-lg font-bold text-white mb-4">Revenue Trends</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-700 text-slate-500">
          Analytics Chart Placeholder
        </div>
      </div>
    </div>
  );
};
