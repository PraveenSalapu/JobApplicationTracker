import React, { useState, useEffect, useCallback } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import { STATUS_OPTIONS } from '../constants';
import { generateResumeSummary } from '../services/geminiService';
import { SparklesIcon, PaperClipIcon, TrashIcon } from './icons';

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (application: JobApplication, resumeFile: File | null) => void;
  applicationToEdit?: JobApplication | null;
  isSaving: boolean;
  isSignedIn: boolean;
  isApiReady: boolean;
}

const initialFormState: Omit<JobApplication, 'id'> = {
  companyName: '',
  jobTitle: '',
  dateApplied: new Date().toISOString().split('T')[0],
  status: ApplicationStatus.WISHLIST,
  jobDescription: '',
  baseResume: '',
  customizedResume: '',
  notes: '',
  contactName: '',
  contactEmail: '',
  followUpDate: '',
  followUpNote: '',
  resumeFilename: '',
  googleDriveFileId: '',
};

const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({ isOpen, onClose, onSave, applicationToEdit, isSaving, isSignedIn, isApiReady }) => {
  const [formData, setFormData] = useState<Omit<JobApplication, 'id'>>(initialFormState);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (applicationToEdit) {
      setFormData({
        ...initialFormState,
        ...applicationToEdit,
      });
    } else {
      setFormData(initialFormState);
    }
    setResumeFile(null);
    setError('');
  }, [applicationToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setFormData(prev => ({ ...prev, resumeFilename: file.name }));
    }
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setFormData(prev => ({ ...prev, resumeFilename: '', googleDriveFileId: '' }));
    // Reset file input value
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const handleGenerateSummary = useCallback(async () => {
    if (!formData.baseResume || !formData.jobDescription) {
      setError('Please provide both a base resume and a job description to generate a summary.');
      return;
    }
    setError('');
    setIsGenerating(true);
    try {
      const summary = await generateResumeSummary(formData.baseResume, formData.jobDescription);
      setFormData(prev => ({ ...prev, customizedResume: summary }));
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  }, [formData.baseResume, formData.jobDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const finalApplication: JobApplication = {
      ...formData,
      id: applicationToEdit?.id || new Date().toISOString(),
    };
    
    onSave(finalApplication, resumeFile);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800">
            {applicationToEdit ? 'Edit Application' : 'Add New Application'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
              </div>
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                <input type="text" name="jobTitle" id="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
              </div>
              <div>
                <label htmlFor="dateApplied" className="block text-sm font-medium text-slate-700 mb-1">Date Applied</label>
                <input type="date" name="dateApplied" id="dateApplied" value={formData.dateApplied} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" required />
              </div>
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-slate-700 mb-1">Primary Contact Name</label>
                <input type="text" name="contactName" id="contactName" value={formData.contactName || ''} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" placeholder="Jane Recruiter" />
              </div>
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700 mb-1">Primary Contact Email</label>
                <input type="email" name="contactEmail" id="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm" placeholder="jane.recruiter@example.com" />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm">
                  {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>

            {/* Attached Resume */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Attached Resume</label>
              {isSignedIn ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        {formData.resumeFilename ? (
                            <div className="flex items-center text-slate-700">
                                <PaperClipIcon className="h-6 w-6 mr-2 text-green-500" />
                                <span className="font-medium">{formData.resumeFilename}</span>
                                <button type="button" onClick={handleRemoveFile} className="ml-4 p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-slate-600">
                                    <label htmlFor="resume-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                        <span>Upload a file</span>
                                        <input id="resume-upload" name="resume-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-slate-500">PDF, DOCX, TXT up to 10MB</p>
                            </>
                        )}
                    </div>
                </div>
              ) : (
                <div className="text-center p-4 border-2 border-dashed rounded-md bg-slate-50 text-slate-500">
                  <p>Please sign in to attach a resume from Google Drive.</p>
                </div>
              )}
            </div>

            {/* AI Customization Section */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">AI Resume Customization</h3>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">{error}</div>}
                 <div>
                    <label htmlFor="baseResume" className="block text-sm font-medium text-slate-700 mb-1">Your Base Resume/Summary</label>
                    <textarea name="baseResume" id="baseResume" value={formData.baseResume} onChange={handleChange} rows={4} className="w-full border-slate-300 rounded-md shadow-sm" placeholder="Paste your general resume summary or key skills here."></textarea>
                </div>
                <div className="mt-4">
                    <label htmlFor="jobDescription" className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
                    <textarea name="jobDescription" id="jobDescription" value={formData.jobDescription} onChange={handleChange} rows={6} className="w-full border-slate-300 rounded-md shadow-sm" placeholder="Paste the full job description here."></textarea>

                </div>
                 <div className="mt-4">
                    <button type="button" onClick={handleGenerateSummary} disabled={isGenerating} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                        <SparklesIcon className={`mr-2 h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? 'Generating...' : 'Generate Customized Resume Snippet'}
                    </button>
                </div>
                <div className="mt-4">
                    <label htmlFor="customizedResume" className="block text-sm font-medium text-slate-700 mb-1">AI-Generated Resume Snippet</label>
                    <textarea name="customizedResume" id="customizedResume" value={formData.customizedResume} onChange={handleChange} rows={5} className="w-full border-slate-300 rounded-md shadow-sm bg-indigo-50" placeholder="Your AI-generated summary will appear here..."></textarea>
                </div>
            </div>

            {/* Follow-up Reminder */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="followUpDate" className="block text-sm font-medium text-slate-700 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  name="followUpDate"
                  id="followUpDate"
                  value={formData.followUpDate || ''}
                  onChange={handleChange}
                  className="w-full border-slate-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="followUpNote" className="block text-sm font-medium text-slate-700 mb-1">Follow-up Context</label>
                <textarea
                  name="followUpNote"
                  id="followUpNote"
                  value={formData.followUpNote || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border-slate-300 rounded-md shadow-sm"
                  placeholder="Mention what to cover in the follow-up conversation."
                />
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full border-slate-300 rounded-md shadow-sm" placeholder="Add any notes about this application (e.g., contacts, interview details)."></textarea>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-wait">
              {isSaving ? 'Saving...' : 'Save Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationFormModal;