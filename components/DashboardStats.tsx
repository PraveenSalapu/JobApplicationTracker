import React from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { STATUS_OPTIONS } from '../constants';

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

interface DashboardStatsProps {
  applications: JobApplication[];
}

const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
  <div className={`p-4 rounded-lg shadow-sm ${color}`}>
    <p className="text-sm font-medium text-slate-700">{title}</p>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

const DashboardStats: React.FC<DashboardStatsProps> = ({ applications }) => {
  const stats = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = applications.filter(app => app.status === status).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  const totalApplications = applications.length;
  const today = startOfDay(new Date());
  let followUpsDueSoon = 0;
  let followUpsOverdue = 0;

  applications.forEach((app) => {
    if (!app.followUpDate) return;
    const followDate = startOfDay(new Date(app.followUpDate));
    const diff = followDate.getTime() - today.getTime();
    if (diff < 0) {
      followUpsOverdue += 1;
    } else if (diff <= 3 * 24 * 60 * 60 * 1000) {
      followUpsDueSoon += 1;
    }
  });

  const responded = totalApplications - (stats[ApplicationStatus.WISHLIST] || 0);
  const responseRate = totalApplications ? Math.round((responded / totalApplications) * 100) : 0;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-slate-700 mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
        <StatCard title="Total" value={totalApplications} color="bg-slate-200" />
        <StatCard title="Follow-ups (3d)" value={followUpsDueSoon} color="bg-amber-200" />
        <StatCard title="Follow-ups Overdue" value={followUpsOverdue} color="bg-rose-200" />
        <StatCard title="Response %" value={responseRate} color="bg-emerald-200" />
        {STATUS_OPTIONS.map(status => (
          <StatCard
            key={status}
            title={status}
            value={stats[status]}
            color={
              {
                [ApplicationStatus.WISHLIST]: 'bg-blue-200',
                [ApplicationStatus.APPLIED]: 'bg-indigo-200',
                [ApplicationStatus.INTERVIEWING]: 'bg-yellow-200',
                [ApplicationStatus.OFFER]: 'bg-green-200',
                [ApplicationStatus.REJECTED]: 'bg-red-200',
              }[status]
            }
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;
