export enum ApplicationStatus {
  WISHLIST = 'Wishlist',
  APPLIED = 'Applied',
  INTERVIEWING = 'Interviewing',
  OFFER = 'Offer',
  REJECTED = 'Rejected',
}

export interface InterviewQuestion {
  question: string;
  answer: string;
}

export interface JobApplication {
  id: string;
  contactName?: string;
  contactEmail?: string;
  followUpDate?: string;
  followUpNote?: string;
  companyName: string;
  jobTitle: string;
  dateApplied: string;
  status: ApplicationStatus;
  jobDescription: string;
  baseResume: string;
  customizedResume: string;
  notes: string;
  resumeFilename?: string;
  googleDriveFileId?: string;
  interviewQuestions?: InterviewQuestion[];
  interviewPrepDocId?: string;
}

