import React, { useState, useCallback, useMemo } from 'react';
import { JobApplication, ApplicationStatus, InterviewQuestion } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ApplicationCard from './ApplicationCard';
import { STATUS_OPTIONS } from '../constants';
import ApplicationFormModal from './ApplicationFormModal';
import InterviewPrepModal from './InterviewPrepModal';
import DashboardStats from './DashboardStats';
import { EmailDraftModal } from './EmailDraftModal';
import { PlusIcon } from './icons';
import { TopSkillsWidget } from './TopSkillsWidget';
import { analyzeSkillsFromJDs, generateInterviewQuestions, SkillsAnalysis } from '../services/geminiService';

interface ApplicationTrackerProps {
  isSignedIn: boolean;
  uploadFile: (file: File) => Promise<{id: string; name: string}>;
  deleteFile: (fileId: string) => Promise<void>;
  authError: string | null;
  isApiReady: boolean;
}

type StatusFilter = ApplicationStatus | 'ALL';

const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ isSignedIn, uploadFile, deleteFile, authError, isApiReady }) => {
  const [applications, setApplications] = useLocalStorage<JobApplication[]>('jobApplications', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);
  const [preppingApplication, setPreppingApplication] = useState<JobApplication | null>(null);
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [emailModalApplication, setEmailModalApplication] = useState<JobApplication | null>(null);

  const [topSkills, setTopSkills] = useState<SkillsAnalysis | null>(null);
  const [isAnalyzingSkills, setIsAnalyzingSkills] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  const handleOpenModal = useCallback(() => {
    setEditingApplication(null);
    setError(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingApplication(null);
  }, []);

  const handleUpdateApplication = useCallback((updatedApp: JobApplication) => {
    setApplications(prev => prev.map(app => app.id === updatedApp.id ? updatedApp : app));
    if(preppingApplication?.id === updatedApp.id) {
        setPreppingApplication(updatedApp);
    }
  }, [preppingApplication, setApplications]);

  const generateInitialQuestions = useCallback(async (appToUpdate: JobApplication) => {
    try {
        const instruction = "Generate 3-5 initial phone screen interview questions. Focus on high-level fit and experience validation.";
        const result = await generateInterviewQuestions(appToUpdate.baseResume, appToUpdate.jobDescription, instruction);
        const newQuestions: InterviewQuestion[] = result.questions.map(q => ({ question: q, answer: '' }));

        setApplications(prev => {
            const currentApp = prev.find(a => a.id === appToUpdate.id);
            if (currentApp && (!currentApp.interviewQuestions || currentApp.interviewQuestions.length === 0)) {
                return prev.map(a => a.id === appToUpdate.id ? { ...a, interviewQuestions: newQuestions } : a);
            }
            return prev;
        });
    } catch (err) {
        console.error("Failed to auto-generate initial questions:", err);
    }
  }, [setApplications]);


  const handleSaveApplication = useCallback(async (applicationData: JobApplication, resumeFile: File | null) => {
    setIsSaving(true);
    setError(null);

    try {
        let savedApplicationData = { ...applicationData };
        const originalApplication = applications.find(app => app.id === applicationData.id);

        if (resumeFile) {
            if (!isSignedIn) throw new Error("You must be signed in to upload a resume.");
            if (originalApplication?.googleDriveFileId) {
                await deleteFile(originalApplication.googleDriveFileId);
            }
            const { id, name } = await uploadFile(resumeFile);
            savedApplicationData.googleDriveFileId = id;
            savedApplicationData.resumeFilename = name;
        } 
        else if (originalApplication?.googleDriveFileId && !savedApplicationData.googleDriveFileId) {
             if (!isSignedIn) throw new Error("You must be signed in to remove a resume.");
             await deleteFile(originalApplication.googleDriveFileId);
             savedApplicationData.googleDriveFileId = undefined;
             savedApplicationData.resumeFilename = undefined;
        }

        if (savedApplicationData.status === ApplicationStatus.REJECTED && originalApplication?.status !== ApplicationStatus.REJECTED) {
            if (savedApplicationData.interviewPrepDocId) {
                if (!isSignedIn) throw new Error("Sign in to delete the prep doc from Drive.");
                await deleteFile(savedApplicationData.interviewPrepDocId);
            }
            savedApplicationData.interviewPrepDocId = undefined;
            savedApplicationData.interviewQuestions = [];
        }

        const isNewApplication = !originalApplication;
        const appInfoChanged = originalApplication && (originalApplication.jobDescription !== savedApplicationData.jobDescription || originalApplication.baseResume !== savedApplicationData.baseResume);
        
        const exists = applications.some(app => app.id === savedApplicationData.id);
         let newApps;
         if (exists) {
            newApps = applications.map(app => (app.id === savedApplicationData.id ? savedApplicationData : app));
         } else {
            newApps = [...applications, savedApplicationData];
         }
        const sortedApps = newApps.sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
        setApplications(sortedApps);


        handleCloseModal();
        
        if (savedApplicationData.baseResume && savedApplicationData.jobDescription && (isNewApplication || appInfoChanged)) {
            generateInitialQuestions(savedApplicationData);
        }

    } catch (err: any) {
        console.error("Failed to save application:", err);
        setError(err.message || 'An unexpected error occurred while saving.');
    } finally {
        setIsSaving(false);
    }
  }, [applications, setApplications, handleCloseModal, uploadFile, deleteFile, isSignedIn, generateInitialQuestions]);


  const handleEditApplication = useCallback((application: JobApplication) => {
    setEditingApplication(application);
    setError(null);
    setIsModalOpen(true);
  }, []);

  const handleDeleteApplication = useCallback(async (applicationToDelete: JobApplication) => {
    if (window.confirm('Are you sure you want to delete this application? This will also remove the resume and prep doc from Google Drive.')) {
        setError(null);
        try {
            if (!isSignedIn) throw new Error("You must be signed in to delete associated files.");
            if (applicationToDelete.googleDriveFileId) {
                await deleteFile(applicationToDelete.googleDriveFileId);
            }
            if(applicationToDelete.interviewPrepDocId) {
                await deleteFile(applicationToDelete.interviewPrepDocId);
            }
            setApplications(prev => prev.filter(app => app.id !== applicationToDelete.id));
        } catch (err: any) {
            console.error("Failed to delete application:", err);
            setError(err.message || 'Failed to delete application. Some files may still exist in Google Drive.');
        }
    }
  }, [setApplications, deleteFile, isSignedIn]);

  const handleStartPrep = useCallback((application: JobApplication) => {
    setPreppingApplication(application);
    setIsPrepModalOpen(true);
  }, []);

  const handleClosePrepModal = useCallback(() => {
    setIsPrepModalOpen(false);
    setPreppingApplication(null);
  }, []);
  
  const handleSavePrepDoc = useCallback(async (application: JobApplication) => {
      if (!application.interviewQuestions || !isSignedIn) {
          setError("Cannot save document. Ensure you are signed in and have generated questions.");
          return;
      }
      setIsSavingDoc(true);
      setError(null);
      try {
          let docContent = `Interview Preparation for ${application.jobTitle} at ${application.companyName}\n\n`;
          docContent += "========================================\n\n";
          application.interviewQuestions.forEach((q, index) => {
              docContent += `Question ${index + 1}: ${q.question}\n\n`;
              docContent += `Answer:\n${q.answer || 'Not generated yet.'}\n\n`;
              docContent += "----------------------------------------\n\n";
          });
          
          const filename = `Interview Prep - ${application.companyName} - ${application.jobTitle}.txt`;
          const textFile = new File([docContent], filename, { type: 'text/plain' });

          if(application.interviewPrepDocId) {
            await deleteFile(application.interviewPrepDocId);
          }

          const { id } = await uploadFile(textFile);
          const updatedApp = { ...application, interviewPrepDocId: id };
          handleUpdateApplication(updatedApp);

      } catch (err: any) {
          console.error("Failed to save prep doc:", err);
          setError(err.message || "An unexpected error occurred while saving the prep document.");
      } finally {
          setIsSavingDoc(false);
      }

  }, [isSignedIn, deleteFile, uploadFile, handleUpdateApplication]);

  const handleAnalyzeSkills = useCallback(async () => {
    setIsAnalyzingSkills(true);
    setSkillsError(null);
    setTopSkills(null);
    try {
        const descriptions = applications
            .filter(app => app.status !== ApplicationStatus.REJECTED && app.status !== ApplicationStatus.OFFER && app.jobDescription)
            .map(app => app.jobDescription);

        if (descriptions.length === 0) {
            setSkillsError("No job descriptions available to analyze. Add applications with descriptions first.");
            setIsAnalyzingSkills(false);
            return;
        }

        const skills = await analyzeSkillsFromJDs(descriptions);
        setTopSkills(skills);
    } catch (err: any) {
        setSkillsError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
        setIsAnalyzingSkills(false);
    }
}, [applications]);
  
  const downloadFile = useCallback((filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleOpenEmailModal = useCallback((application: JobApplication) => {
    setEmailModalApplication(application);
  }, []);

  const handleCloseEmailModal = useCallback(() => {
    setEmailModalApplication(null);
  }, []);

  const handleExportAnalytics = useCallback(() => {
    if (applications.length === 0) {
      setError('Add at least one application before exporting analytics.');
      return;
    }

    const statusCounts: Record<ApplicationStatus, number> = {
      [ApplicationStatus.WISHLIST]: 0,
      [ApplicationStatus.APPLIED]: 0,
      [ApplicationStatus.INTERVIEWING]: 0,
      [ApplicationStatus.OFFER]: 0,
      [ApplicationStatus.REJECTED]: 0,
    };

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toStartOfDay = (date: Date) => {
      const clone = new Date(date);
      clone.setHours(0, 0, 0, 0);
      return clone;
    };

    const sanitizeText = (value?: string | null) => {
      if (!value) return '';
      return value.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const classifyFollowUp = (followUpDate?: string) => {
      if (!followUpDate) {
        return { status: 'NONE', daysUntil: null } as const;
      }
      const parsed = new Date(followUpDate);
      if (Number.isNaN(parsed.getTime())) {
        return { status: 'INVALID', daysUntil: null } as const;
      }
      const followStart = toStartOfDay(parsed);
      const diffDays = Math.round((followStart.getTime() - today.getTime()) / MS_PER_DAY);
      if (diffDays < 0) {
        return { status: 'OVERDUE', daysUntil: diffDays } as const;
      }
      if (diffDays <= 3) {
        return { status: 'DUE_SOON', daysUntil: diffDays } as const;
      }
      return { status: 'SCHEDULED', daysUntil: diffDays } as const;
    };

    const daysSinceAppliedList: number[] = [];
    const daysByStatus: Record<ApplicationStatus, number[]> = {
      [ApplicationStatus.WISHLIST]: [],
      [ApplicationStatus.APPLIED]: [],
      [ApplicationStatus.INTERVIEWING]: [],
      [ApplicationStatus.OFFER]: [],
      [ApplicationStatus.REJECTED]: [],
    };

    const applicationRecords = applications.map((app) => {
      statusCounts[app.status] += 1;

      let daysSinceApplied: number | null = null;
      const appliedDate = new Date(app.dateApplied);
      if (!Number.isNaN(appliedDate.getTime())) {
        const appliedStart = toStartOfDay(appliedDate);
        daysSinceApplied = Math.max(0, Math.round((today.getTime() - appliedStart.getTime()) / MS_PER_DAY));
        daysSinceAppliedList.push(daysSinceApplied);
        daysByStatus[app.status].push(daysSinceApplied);
      }

      const followUp = classifyFollowUp(app.followUpDate);

      return {
        id: app.id,
        companyName: app.companyName,
        jobTitle: app.jobTitle,
        status: app.status,
        contactName: app.contactName || null,
        contactEmail: app.contactEmail || null,
        followUpDate: app.followUpDate || null,
        followUpStatus: followUp.status,
        daysUntilFollowUp: followUp.daysUntil,
        followUpNote: sanitizeText(app.followUpNote),
        dateApplied: app.dateApplied,
        daysSinceApplied,
        resumeFilename: app.resumeFilename || null,
        hasInterviewPrepDoc: Boolean(app.interviewPrepDocId),
        notes: sanitizeText(app.notes),
      };
    });

    const total = applications.length;
    const responded = total - statusCounts[ApplicationStatus.WISHLIST];
    const interviews = statusCounts[ApplicationStatus.INTERVIEWING];
    const offers = statusCounts[ApplicationStatus.OFFER];
    const rejections = statusCounts[ApplicationStatus.REJECTED];
    const responseRate = total ? (responded / total) * 100 : 0;

    const computeAverage = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
    const computeMedian = (values: number[]) => {
      if (!values.length) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
      }
      return sorted[mid];
    };

    const averageDaysSinceApplied = computeAverage(daysSinceAppliedList);
    const medianDaysSinceApplied = computeMedian(daysSinceAppliedList);

    const perStatusVelocity = STATUS_OPTIONS.reduce((acc, status) => {
      const values = daysByStatus[status];
      acc[status] = {
        average: computeAverage(values),
        median: computeMedian(values),
        count: values.length,
      };
      return acc;
    }, {} as Record<ApplicationStatus, { average: number; median: number; count: number }>);

    const csvRows: string[][] = [
      ['Company', 'Job Title', 'Job ID', 'Status', 'Date Received', 'Notes', 'Next Steps', 'Application Date'],
      ...applicationRecords.map((record) => [
        record.companyName,
        record.jobTitle,
        record.id,
        record.status,
        record.followUpDate ?? record.dateApplied ?? '',
        record.notes ?? '',
        record.followUpNote ?? '',
        record.dateApplied ?? '',
      ]),
    ];

    const csvContent = csvRows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    downloadFile('analytics-summary.csv', csvContent, 'text/csv');

    const pipelineVelocity = STATUS_OPTIONS.reduce((acc, status) => {
      const stats = perStatusVelocity[status];
      acc[status] = {
        averageDays: Number(stats.average.toFixed(1)),
        medianDays: Number(stats.median.toFixed(1)),
        sampleSize: stats.count,
      };
      return acc;
    }, {} as Record<ApplicationStatus, { averageDays: number; medianDays: number; sampleSize: number }>);

    const notionPayload = {
      generatedAt: new Date().toISOString(),
      metrics: {
        totalApplications: total,
        statusCounts,
        responseRate: Number(responseRate.toFixed(1)),
        interviews,
        offers,
        rejections,
        pipelineVelocity: {
          averageDaysSinceApplied: Number(averageDaysSinceApplied.toFixed(1)),
          medianDaysSinceApplied: Number(medianDaysSinceApplied.toFixed(1)),
          perStatus: pipelineVelocity,
        },
      },
      applications: applicationRecords,
    };

    downloadFile('analytics-summary.json', JSON.stringify(notionPayload, null, 2), 'application/json');
    setError(null);
  }, [applications, downloadFile]);

  const handleStatusFilterChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as StatusFilter;
    setStatusFilter(value);
  }, []);

  const filteredApplications = useMemo(() => {
    if (statusFilter === 'ALL') {
      return applications;
    }
    return applications.filter(app => app.status === statusFilter);
  }, [applications, statusFilter]);

  const displayError = error || authError;

  return (
    <div>
      <DashboardStats applications={applications} />

      <div className="my-8">
        <TopSkillsWidget
          onAnalyze={handleAnalyzeSkills}
          skills={topSkills}
          isLoading={isAnalyzingSkills}
          error={skillsError}
          hasApplications={applications.some(app => !!app.jobDescription)}
        />
      </div>

       {displayError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Operation Failed</p>
            <p>{displayError}</p>
          </div>
        )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-700">My Applications</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-3">
          <div className="flex items-center space-x-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-slate-600">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="border border-slate-300 rounded-md shadow-sm text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportAnalytics}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
          >
            Export Analytics
          </button>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Application
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
          <h3 className="text-xl font-medium text-slate-700">No applications yet.</h3>
          <p className="text-slate-500 mt-2">Click "Add Application" to get started!</p>
        </div>
      ) : filteredApplications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredApplications.map(app => (
            <ApplicationCard
              key={app.id}
              application={app}
              onEdit={handleEditApplication}
              onDelete={handleDeleteApplication}
              onStartPrep={handleStartPrep}
              onGenerateEmail={handleOpenEmailModal}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
          <h3 className="text-xl font-medium text-slate-700">No applications in this status.</h3>
          <p className="text-slate-500 mt-2">Try selecting a different status or add a new application.</p>
        </div>
      )}

      {isModalOpen && (
        <ApplicationFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveApplication}
            applicationToEdit={editingApplication}
            isSaving={isSaving}
            isSignedIn={isSignedIn}
            isApiReady={isApiReady}
        />
      )}
      
      {isPrepModalOpen && preppingApplication && (
        <InterviewPrepModal
          isOpen={isPrepModalOpen}
          onClose={handleClosePrepModal}
          application={preppingApplication}
          onUpdateApplication={handleUpdateApplication}
          onSavePrepDoc={handleSavePrepDoc}
          isSavingDoc={isSavingDoc}
          isSignedIn={isSignedIn}
        />
      )}

      {emailModalApplication && (
        <EmailDraftModal
          isOpen={!!emailModalApplication}
          onClose={handleCloseEmailModal}
          application={emailModalApplication}
        />
      )}
    </div>
  );
};

export default ApplicationTracker;




