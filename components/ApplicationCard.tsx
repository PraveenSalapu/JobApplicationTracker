import React, { useMemo } from 'react';
import { JobApplication } from '../types';
import { STATUS_COLORS } from '../constants';
import { EditIcon, TrashIcon, PaperClipIcon, ChatBubbleIcon, CalendarIcon, MailIcon, SparklesIcon } from './icons';

interface ApplicationCardProps {
  application: JobApplication;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
  onStartPrep: (application: JobApplication) => void;
  onGenerateEmail: (application: JobApplication) => void;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const toStartOfDay = (date: Date) => {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const sanitizeForFilename = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onEdit, onDelete, onStartPrep, onGenerateEmail }) => {
  const {
    companyName,
    jobTitle,
    dateApplied,
    status,
    googleDriveFileId,
    resumeFilename,
    followUpDate,
    followUpNote,
    contactName,
    contactEmail,
  } = application;

  const followUpMeta = useMemo(() => {
    if (!followUpDate) return null;
    const parsed = new Date(followUpDate);
    if (Number.isNaN(parsed.getTime())) return null;
    const followStart = toStartOfDay(parsed);
    const today = toStartOfDay(new Date());
    const diffDays = Math.round((followStart.getTime() - today.getTime()) / MS_PER_DAY);

    if (diffDays < 0) {
      return { badgeClass: 'bg-red-100 text-red-700 border-red-200', label: 'Follow-up overdue', displayDate: followStart.toLocaleDateString() };
    }
    if (diffDays <= 3) {
      return { badgeClass: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Follow-up soon', displayDate: followStart.toLocaleDateString() };
    }
    return { badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Follow-up scheduled', displayDate: followStart.toLocaleDateString() };
  }, [followUpDate]);

  const handleAddToCalendar = () => {
    if (!followUpMeta || !followUpDate) return;
    const followStart = toStartOfDay(new Date(followUpDate));
    followStart.setHours(9, 0, 0, 0);
    const followEnd = new Date(followStart.getTime() + 30 * 60 * 1000);

    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const details = [
      `Role: ${jobTitle}`,
      contactName ? `Contact: ${contactName}${contactEmail ? ` (${contactEmail})` : ''}` : '',
      followUpNote ? `Next steps: ${followUpNote}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&sf=true&output=xml&text=${encodeURIComponent(`Follow up with ${companyName}`)}&dates=${formatDate(followStart)}/${formatDate(followEnd)}&details=${encodeURIComponent(details)}`;

    const newWindow = window.open(calendarUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      alert('Allow pop-ups from this site to open Google Calendar.');
    } else {
      newWindow.focus();
    }
  };

  const handleComposeEmail = () => {
    if (!contactEmail) return;
    const subject = `Follow up on ${jobTitle} at ${companyName}`;
    const greeting = contactName ? `Hi ${contactName},` : 'Hello,';
    const bodyLines = [
      greeting,
      '',
      `I wanted to follow up regarding the ${jobTitle} role at ${companyName}.`,
      followUpNote ? followUpNote : '',
      '',
      'Thanks for your time,',
    ].filter(Boolean);
    const body = bodyLines.join('\n');
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(contactEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const newWindow = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      alert('Allow pop-ups from this site to open Gmail compose.');
    } else {
      newWindow.focus();
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col">
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-800 pr-2">{companyName}</h3>
            <p className="text-slate-600 mt-1">{jobTitle}</p>
            {contactName || contactEmail ? (
              <p className="text-sm text-slate-500 mt-2">
                {contactName && <span className="font-medium text-slate-700">{contactName}</span>}
                {contactName && contactEmail && ' • '}
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">
                    {contactEmail}
                  </a>
                )}
              </p>
            ) : null}
            {followUpMeta && (
              <div className={`mt-3 inline-flex items-center gap-2 text-xs font-medium px-3 py-1 border rounded-full ${followUpMeta.badgeClass}`}>
                <CalendarIcon className="h-4 w-4" />
                <span>{followUpMeta.label} • {followUpMeta.displayDate}</span>
              </div>
            )}
            {followUpNote && (
              <p className="mt-2 text-sm text-slate-500 border-l-4 border-slate-200 pl-3">{followUpNote}</p>
            )}
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[status]}`}>
            {status}
          </span>
        </div>

        <div className="mt-auto pt-4 space-y-2">
          {googleDriveFileId && (
            <a
              href={`https://drive.google.com/file/d/${googleDriveFileId}/view?usp=sharing`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              <PaperClipIcon className="h-4 w-4 mr-1" />
              {resumeFilename || 'View Resume'}
            </a>
          )}
          <p className="text-sm text-slate-400">Applied: {new Date(dateApplied).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="bg-slate-50 p-3 border-t border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAddToCalendar}
            disabled={!followUpMeta}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-600 hover:border-slate-400 disabled:opacity-50"
          >
            <CalendarIcon className="h-4 w-4" />
            Add to Calendar
          </button>
          <button
            type="button"
            onClick={handleComposeEmail}
            disabled={!contactEmail}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-600 hover:border-slate-400 disabled:opacity-50"
          >
            <MailIcon className="h-4 w-4" />
            Gmail Reminder
          </button>
          <button
            type="button"
            onClick={() => onGenerateEmail(application)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-indigo-300 text-indigo-600 hover:border-indigo-400"
          >
            <SparklesIcon className="h-4 w-4" />
            AI Email Drafts
          </button>
        </div>
        <div className="flex justify-end items-center space-x-2">
          <button
            onClick={() => onStartPrep(application)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
            aria-label="Prep for Interview"
          >
            <ChatBubbleIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onEdit(application)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
            aria-label="Edit Application"
          >
            <EditIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(application)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
            aria-label="Delete Application"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard;









