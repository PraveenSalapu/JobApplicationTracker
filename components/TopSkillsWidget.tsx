import React from 'react';
import { SparklesIcon } from './icons';
import { SkillsAnalysis, SkillTrendItem } from '../services/geminiService';

interface TopSkillsWidgetProps {
  onAnalyze: () => void;
  skills: SkillsAnalysis | null;
  isLoading: boolean;
  error: string | null;
  hasApplications: boolean;
}

const momentumCopy: Record<string, { label: string; color: string }> = {
  emerging: { label: 'Emerging', color: 'bg-emerald-100 text-emerald-700' },
  increasing: { label: 'Rising demand', color: 'bg-indigo-100 text-indigo-700' },
  steady: { label: 'Consistent', color: 'bg-slate-200 text-slate-700' },
};

const MomentumBadge: React.FC<{ momentum: string }> = ({ momentum }) => {
  const meta = momentumCopy[momentum] || momentumCopy.steady;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
      {meta.label}
    </span>
  );
};

const TrendList: React.FC<{ title: string; items: SkillTrendItem[] }> = ({ title, items }) => (
  <div>
    <h4 className="font-semibold text-slate-600 mb-3">{title}</h4>
    {items.length === 0 ? (
      <p className="text-sm text-slate-500">No distinct trends detected yet.</p>
    ) : (
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.name} className="bg-slate-100/70 border border-slate-200 rounded-md p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800">{item.name}</span>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{item.frequency.toFixed(0)} mentions</span>
                <MomentumBadge momentum={item.momentum} />
              </div>
            </div>
            {item.exampleMentions && item.exampleMentions.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-medium text-slate-600">Mentions:</span> {item.exampleMentions.slice(0, 2).join(' • ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const TopSkillsWidget: React.FC<TopSkillsWidgetProps> = ({ onAnalyze, skills, isLoading, error, hasApplications }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-xl font-bold text-slate-700">Top Skills Analysis</h3>
          <p className="text-slate-500 text-sm mt-1">Spot recurring skills and emerging trends across your target roles.</p>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isLoading || !hasApplications}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
        >
          <SparklesIcon className={`mr-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Analyzing...' : 'Analyze My Applications'}
        </button>
      </div>

      <div className="mt-4">
        {!hasApplications && (
          <p className="text-slate-500 text-center py-4">Add applications with job descriptions to analyze required skills.</p>
        )}

        {error && <p className="text-red-500 font-medium text-center py-4">{error}</p>}

        {isLoading && (
          <div className="mt-4 text-center py-4">
            <p className="text-slate-600">Analyzing job descriptions with AI... this may take a moment.</p>
          </div>
        )}

        {skills && !isLoading && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TrendList title="Top Technical Skills" items={skills.technical} />
              <TrendList title="Top Soft Skills" items={skills.soft} />
            </div>

            {skills.insights.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-600 mb-2">Insights</h4>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                  {skills.insights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
