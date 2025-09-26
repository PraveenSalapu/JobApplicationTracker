import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { JobApplication } from '../types';
import { generateEmailDraft, EmailDraftType } from '../services/geminiService';
import { SparklesIcon } from './icons';

interface EmailDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: JobApplication;
}

const EMAIL_TYPES: { id: EmailDraftType; label: string; description: string }[] = [
  {
    id: 'FOLLOW_UP',
    label: 'Follow-up email',
    description: 'Check in after applying or interviewing to stay top of mind.',
  },
  {
    id: 'THANK_YOU',
    label: 'Thank-you email',
    description: 'Send appreciation and reinforce your value after an interview.',
  },
];

export const EmailDraftModal: React.FC<EmailDraftModalProps> = ({ isOpen, onClose, application }) => {
  const [selectedType, setSelectedType] = useState<EmailDraftType>('FOLLOW_UP');
  const [customInstructions, setCustomInstructions] = useState('');
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const contactEmail = application.contactEmail || '';

  useEffect(() => {
    if (isOpen) {
      setSelectedType('FOLLOW_UP');
      setCustomInstructions('');
      setDraft('');
      setError('');
      setCopied(false);
    }
  }, [isOpen, application]);

  const canGenerate = useMemo(
    () => !!application.jobDescription && !!application.baseResume,
    [application.jobDescription, application.baseResume]
  );

  const subjectLine = useMemo(() => {
    if (selectedType === 'THANK_YOU') {
      return `Thank you for the conversation about ${application.jobTitle}`;
    }
    return `Follow up on ${application.jobTitle} at ${application.companyName}`;
  }, [selectedType, application.jobTitle, application.companyName]);

  const handleGenerateDraft = useCallback(async () => {
    if (!canGenerate) {
      setError('Add both a job description and resume summary to generate an email draft.');
      return;
    }
    setIsGenerating(true);
    setError('');
    setCopied(false);
    try {
      const result = await generateEmailDraft({
        application,
        type: selectedType,
        customInstructions: customInstructions.trim() || undefined,
      });
      setDraft(result);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while generating the email draft.');
    } finally {
      setIsGenerating(false);
    }
  }, [application, selectedType, customInstructions, canGenerate]);

  const handleCopy = useCallback(async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Could not copy to clipboard. Try copying manually.');
    }
  }, [draft]);

  const handleOpenGmail = useCallback(() => {
    if (!draft) {
      setError('Generate a draft first before opening Gmail.');
      return;
    }
    if (!contactEmail) {
      setError('Add a contact email to the application before sending.');
      return;
    }
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(contactEmail)}&su=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(draft)}`;
    const win = window.open(gmailUrl, '_blank', 'noopener');
    if (!win) {
      window.location.href = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(draft)}`;
    }
  }, [draft, contactEmail, subjectLine]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">AI Email Drafts</h2>
            <p className="text-slate-600 mt-1">{application.jobTitle} at {application.companyName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">&times;</button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {!canGenerate && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="font-semibold text-yellow-800">Add more context first</p>
              <p className="text-yellow-700">Provide both a resume summary and job description inside the application to unlock AI email drafts.</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Email type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EMAIL_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`text-left border rounded-lg p-4 transition-colors ${selectedType === type.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                >
                  <h4 className="font-semibold text-slate-800">{type.label}</h4>
                  <p className="text-sm text-slate-500 mt-1">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="email-instructions" className="block text-sm font-semibold text-slate-700 mb-2">Optional guidance</label>
            <textarea
              id="email-instructions"
              value={customInstructions}
              onChange={(event) => setCustomInstructions(event.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-md shadow-sm text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Mention the project we discussed or keep the tone more casual."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerateDraft}
              disabled={isGenerating || !canGenerate}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-indigo-300"
            >
              <SparklesIcon className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate draft'}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!draft}
              className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <button
              type="button"
              onClick={handleOpenGmail}
              disabled={!draft || !contactEmail}
              className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Open in Gmail
            </button>
            {!contactEmail && (
              <span className="text-xs text-slate-400">Add a contact email to enable Gmail sending.</span>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Draft preview</label>
            <textarea
              readOnly
              value={draft}
              placeholder="Your AI-generated email will appear here."
              className="w-full border border-slate-300 rounded-md shadow-sm text-sm p-3 min-h-[220px] bg-slate-50"
            />
          </div>
        </div>

        <div className="p-6 bg-slate-100 border-t flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-200">Close</button>
        </div>
      </div>
    </div>
  );
};
