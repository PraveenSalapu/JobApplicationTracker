import React, { useState, useCallback } from 'react';
import { JobApplication, InterviewQuestion } from '../types';
import { generateInterviewQuestions, generateAnswerForQuestion, generateCompanyTalkingPoints, generateTechnologyTalkingPoints } from '../services/geminiService';
import { SparklesIcon, PaperClipIcon } from './icons';

interface InterviewPrepModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: JobApplication;
    onUpdateApplication: (application: JobApplication) => void;
    onSavePrepDoc: (application: JobApplication) => void;
    isSavingDoc: boolean;
    isSignedIn: boolean;
}

const AccordionItem: React.FC<{
    question: InterviewQuestion;
    index: number;
    onGenerateAnswer: (index: number) => void;
    onAnswerChange: (index: number, newAnswer: string) => void;
    isLoading: boolean;
}> = ({ question, index, onGenerateAnswer, onAnswerChange, isLoading }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b">
            <h2>
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full p-5 font-medium text-left text-slate-700 hover:bg-slate-100">
                    <span className="flex-1 pr-4">{`Q${index + 1}: ${question.question}`}</span>
                    <svg className={`w-3 h-3 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5"/>
                    </svg>
                </button>
            </h2>
            {isOpen && (
                <div className="p-5 border-t bg-white">
                    <div className="mb-3">
                         <button type="button" onClick={() => onGenerateAnswer(index)} disabled={isLoading} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">
                            <SparklesIcon className={`-ml-0.5 mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Generating...' : (question.answer ? 'Regenerate Answer' : 'Generate Answer')}
                        </button>
                    </div>
                    <textarea 
                        className="w-full p-2 border border-slate-300 rounded-md"
                        rows={8}
                        placeholder="Your AI-generated answer will appear here..."
                        value={question.answer}
                        onChange={(e) => onAnswerChange(index, e.target.value)}
                    />
                </div>
            )}
        </div>
    );
};

const InterviewPrepModal: React.FC<InterviewPrepModalProps> = ({ isOpen, onClose, application, onUpdateApplication, onSavePrepDoc, isSavingDoc, isSignedIn }) => {
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [loadingAnswerIndex, setLoadingAnswerIndex] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [customQuestionPrompt, setCustomQuestionPrompt] = useState('');
    const [isGeneratingCustomQuestions, setIsGeneratingCustomQuestions] = useState(false);
    const [companyInsights, setCompanyInsights] = useState<string[] | null>(null);
    const [isGeneratingCompanyInsights, setIsGeneratingCompanyInsights] = useState(false);
    const [techTalkingPoints, setTechTalkingPoints] = useState<string[] | null>(null);
    const [manualQuestion, setManualQuestion] = useState('');
    const [isGeneratingManualQuestion, setIsGeneratingManualQuestion] = useState(false);
    const [isGeneratingTechTalkingPoints, setIsGeneratingTechTalkingPoints] = useState(false);

    const canGenerate = application.baseResume && application.jobDescription;

    const handleGenerateQuestions = useCallback(async () => {
        if (!canGenerate) {
            setError('Base resume and job description are required to generate questions.');
            return;
        }
        setIsLoadingQuestions(true);
        setError('');
        try {
            const result = await generateInterviewQuestions(application.baseResume, application.jobDescription);
            const newQuestions: InterviewQuestion[] = result.questions.map(q => ({ question: q, answer: '' }));
            onUpdateApplication({ ...application, interviewQuestions: newQuestions });
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while generating questions.');
        } finally {
            setIsLoadingQuestions(false);
        }
    }, [application, onUpdateApplication, canGenerate]);

    const handleGenerateCustomQuestions = useCallback(async () => {
        const prompt = customQuestionPrompt.trim();
        if (!prompt) {
            setError('Add some guidance before generating additional questions.');
            return;
        }
        if (!canGenerate) {
            setError('Base resume and job description are required to generate questions.');
            return;
        }

        setIsGeneratingCustomQuestions(true);
        setError('');
        try {
            const instruction = `Focus on the following guidance from the candidate: ${prompt}. Craft 3-4 targeted interview questions that test their depth in this area.`;
            const result = await generateInterviewQuestions(application.baseResume, application.jobDescription, instruction);
            const newQuestions: InterviewQuestion[] = result.questions.map(q => ({ question: q, answer: '' }));
            const existing = application.interviewQuestions || [];
            const merged = [...existing];
            newQuestions.forEach((question) => {
                const isDuplicate = merged.some(existingQuestion => existingQuestion.question.toLowerCase() === question.question.toLowerCase());
                if (!isDuplicate) {
                    merged.push(question);
                }
            });
            onUpdateApplication({ ...application, interviewQuestions: merged });
            setCustomQuestionPrompt('');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while generating custom questions.');
        } finally {
            setIsGeneratingCustomQuestions(false);
        }
    }, [application, canGenerate, customQuestionPrompt, onUpdateApplication]);

    const handleGenerateCompanyInsights = useCallback(async () => {
        if (!application.companyName.trim()) {
            setError('Company name is required to generate company talking points.');
            return;
        }
        if (!application.jobDescription.trim()) {
            setError('Job description is required to generate company talking points.');
            return;
        }

        setIsGeneratingCompanyInsights(true);
        setError('');
        try {
            const points = await generateCompanyTalkingPoints(application.companyName, application.jobDescription);
            setCompanyInsights(points);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while generating company talking points.');
        } finally {
            setIsGeneratingCompanyInsights(false);
        }
    }, [application.companyName, application.jobDescription]);

    const handleGenerateTechnologyTalkingPoints = useCallback(async () => {
        if (!canGenerate) {
            setError('Base resume and job description are required to generate technology talking points.');
            return;
        }

        setIsGeneratingTechTalkingPoints(true);
        setError('');
        try {
            const points = await generateTechnologyTalkingPoints(application.jobDescription, application.baseResume);
            setTechTalkingPoints(points);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while generating technology talking points.');
        } finally {
            setIsGeneratingTechTalkingPoints(false);
        }
    }, [application.baseResume, application.jobDescription, canGenerate]);

    const handleAddManualQuestion = useCallback(async () => {
        const questionText = manualQuestion.trim();
        if (!questionText) {
            setError('Please type a question before asking for an answer.');
            return;
        }
        if (!canGenerate) {
            setError('Base resume and job description are required to answer custom questions.');
            return;
        }

        setIsGeneratingManualQuestion(true);
        setError('');
        try {
            const answer = await generateAnswerForQuestion(application.baseResume, application.jobDescription, questionText);
            const existing = application.interviewQuestions || [];
            const alreadyExists = existing.some(q => q.question.toLowerCase() === questionText.toLowerCase());
            const updatedQuestions = alreadyExists
                ? existing.map(q => q.question.toLowerCase() === questionText.toLowerCase() ? { ...q, answer } : q)
                : [...existing, { question: questionText, answer }];
            onUpdateApplication({ ...application, interviewQuestions: updatedQuestions });
            setManualQuestion('');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while answering your custom question.');
        } finally {
            setIsGeneratingManualQuestion(false);
        }
    }, [application, canGenerate, manualQuestion, onUpdateApplication]);


    const handleGenerateAnswer = useCallback(async (index: number) => {
        const question = application.interviewQuestions?.[index];
        if (!question || !canGenerate) {
            setError('Base resume, job description, and a question are required.');
            return;
        }
        setLoadingAnswerIndex(index);
        setError('');
        try {
            const answer = await generateAnswerForQuestion(application.baseResume, application.jobDescription, question.question);
            const updatedQuestions = [...(application.interviewQuestions || [])];
            updatedQuestions[index] = { ...question, answer };
            onUpdateApplication({ ...application, interviewQuestions: updatedQuestions });
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while generating the answer.');
        } finally {
            setLoadingAnswerIndex(null);
        }
    }, [application, onUpdateApplication, canGenerate]);


    const handleAnswerChange = (index: number, newAnswer: string) => {
        const question = application.interviewQuestions?.[index];
        if (!question) return;
        const updatedQuestions = [...(application.interviewQuestions || [])];
        updatedQuestions[index] = { ...question, answer: newAnswer };
        onUpdateApplication({ ...application, interviewQuestions: updatedQuestions });
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-slate-50 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Interview Prep</h2>
                        <p className="text-slate-600 mt-1">{application.jobTitle} at {application.companyName}</p>
                    </div>
                     <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">&times;</button>
                </div>

                <div className="flex-grow p-6 overflow-y-auto">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">{error}</div>}

            {!canGenerate && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <p className="font-bold text-yellow-800">Missing Information</p>
                    <p className="text-yellow-700">Please edit this application to add content to both the "Base Resume/Summary" and "Job Description" fields to enable AI features.</p>
                </div>
            )}

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">Potential Interview Questions</h3>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-3">
                        <button
                            type="button"
                            onClick={handleGenerateQuestions}
                            disabled={isLoadingQuestions || !canGenerate}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            <SparklesIcon className={`mr-2 h-5 w-5 ${isLoadingQuestions ? 'animate-spin' : ''}`} />
                            {isLoadingQuestions ? 'Generating...' : (application.interviewQuestions ? 'Regenerate Questions' : 'Generate Questions')}
                        </button>
                        <button
                            type="button"
                            onClick={handleGenerateCustomQuestions}
                            disabled={isGeneratingCustomQuestions || !canGenerate || !customQuestionPrompt.trim()}
                            className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-100 disabled:bg-slate-100"
                        >
                            <SparklesIcon className={`mr-2 h-5 w-5 ${isGeneratingCustomQuestions ? 'animate-spin' : ''}`} />
                            {isGeneratingCustomQuestions ? 'Adding...' : 'Add Focused Questions'}
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <label htmlFor="manual-question" className="block text-sm font-semibold text-slate-700 mb-2">Ask a custom interview question</label>
                    <textarea
                        id="manual-question"
                        value={manualQuestion}
                        onChange={(event) => setManualQuestion(event.target.value)}
                        rows={3}
                        className="w-full border border-slate-300 rounded-md shadow-sm text-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type the exact question you expect to hear (e.g., How would you scale our ingestion pipeline?)."
                    />
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-2">
                        <button
                            type="button"
                            onClick={handleAddManualQuestion}
                            disabled={isGeneratingManualQuestion || !manualQuestion.trim() || !canGenerate}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
                        >
                            <SparklesIcon className={`mr-2 h-5 w-5 ${isGeneratingManualQuestion ? 'animate-spin' : ''}`} />
                            {isGeneratingManualQuestion ? 'Generating Answer...' : 'Add Question & Get Answer'}
                        </button>
                        <p className="text-xs text-slate-500">We will add this to your prep list and draft a suggested answer automatically.</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <label htmlFor="custom-question-guidance" className="block text-sm font-semibold text-slate-700 mb-2">Add guidance for more custom questions</label>
                    <textarea
                        id="custom-question-guidance"
                        value={customQuestionPrompt}
                        onChange={(event) => setCustomQuestionPrompt(event.target.value)}
                        rows={3}
                        className="w-full border border-slate-300 rounded-md shadow-sm text-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Dive deeper into platform scalability trade-offs or ask about cross-functional collaboration."
                    />
                    <p className="text-xs text-slate-500 mt-2">We will append 3-4 additional questions tailored to this focus area.</p>
                </div>

                {application.interviewQuestions && application.interviewQuestions.length > 0 ? (
                    <div className="bg-slate-200 rounded-lg">
                        {application.interviewQuestions.map((q, i) => (
                            <AccordionItem
                                key={i}
                                index={i}
                                question={q}
                                onGenerateAnswer={handleGenerateAnswer}
                                onAnswerChange={handleAnswerChange}
                                isLoading={loadingAnswerIndex === i}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-slate-300 rounded-lg bg-white">
                        <h3 className="text-lg font-medium text-slate-600">No questions generated yet.</h3>
                        <p className="text-slate-500 mt-1">Click "Generate Questions" to get started!</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Company Talking Points</h3>
                                <p className="text-sm text-slate-500 mt-1">Highlight what stands out about {application.companyName || 'this company'}.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerateCompanyInsights}
                                disabled={isGeneratingCompanyInsights || !application.companyName.trim() || !application.jobDescription.trim()}
                                className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
                            >
                                <SparklesIcon className={`mr-2 h-4 w-4 ${isGeneratingCompanyInsights ? 'animate-spin' : ''}`} />
                                {isGeneratingCompanyInsights ? 'Generating...' : 'Generate Talking Points'}
                            </button>
                        </div>
                        {isGeneratingCompanyInsights ? (
                            <p className="mt-4 text-sm text-slate-500">Collecting company highlights...</p>
                        ) : companyInsights && companyInsights.length > 0 ? (
                            <ul className="mt-4 space-y-2 text-sm text-slate-700 list-disc list-inside">
                                {companyInsights.map((point, index) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-4 text-sm text-slate-500">Generate quick talking points to weave into introductions, closing remarks, or follow-up emails.</p>
                        )}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Technology Deep-Dive</h3>
                                <p className="text-sm text-slate-500 mt-1">Prep concise stories for the technologies mentioned in the job description.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerateTechnologyTalkingPoints}
                                disabled={isGeneratingTechTalkingPoints || !canGenerate}
                                className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300"
                            >
                                <SparklesIcon className={`mr-2 h-4 w-4 ${isGeneratingTechTalkingPoints ? 'animate-spin' : ''}`} />
                                {isGeneratingTechTalkingPoints ? 'Generating...' : 'Generate Tech Briefing'}
                            </button>
                        </div>
                        {isGeneratingTechTalkingPoints ? (
                            <p className="mt-4 text-sm text-slate-500">Reviewing the role for the most relevant technologies...</p>
                        ) : techTalkingPoints && techTalkingPoints.length > 0 ? (
                            <ul className="mt-4 space-y-2 text-sm text-slate-700 list-disc list-inside">
                                {techTalkingPoints.map((point, index) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-4 text-sm text-slate-500">Use your resume and the job description to craft bite-sized answers for the stack, architecture patterns, and metrics the team cares about.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>

                <div className="p-6 bg-slate-100 border-t flex justify-between items-center">
                    {isSignedIn ? (
                        application.interviewPrepDocId ? (
                            <a 
                              href={`https://docs.google.com/document/d/${application.interviewPrepDocId}/edit`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-green-700 font-semibold hover:underline"
                            >
                              <PaperClipIcon className="h-4 w-4 mr-1" /> 
                              View Prep Doc in Google Drive
                            </a>
                        ) : (
                            <span className="text-sm text-slate-500">Save to generate a link to Google Drive.</span>
                        )
                    ) : (
                         <span className="text-sm text-slate-500">Sign in to save to Google Drive.</span>
                    )}
                    <div className="flex space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-200">Close</button>
                        <button type="button" onClick={() => onSavePrepDoc(application)} disabled={isSavingDoc || !isSignedIn || !application.interviewQuestions?.length} className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-300">
                            {isSavingDoc ? 'Saving...' : 'Save Prep Doc to Drive'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewPrepModal;

