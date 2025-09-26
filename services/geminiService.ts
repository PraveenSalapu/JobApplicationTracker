import { GoogleGenAI, Type } from "@google/genai";
import { JobApplication } from '../types';

export type SkillTrendMomentum = 'emerging' | 'increasing' | 'steady';

export interface SkillTrendItem {
  name: string;
  frequency: number;
  momentum: SkillTrendMomentum;
  exampleMentions?: string[];
}

export interface SkillsAnalysis {
  technical: SkillTrendItem[];
  soft: SkillTrendItem[];
  insights: string[];
}



// WARNING: Storing API keys in client-side code is insecure.
// This is for demonstration purposes only in an environment without a build process.
const GEMINI_API_KEY = 'AIzaSyC_SryHk5BCUglc_TEufQM9HlYvDIPvaK4';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const checkApiKey = () => {
    if (!GEMINI_API_KEY) {
        throw new Error("Gemini API Key is not configured. AI features are disabled.");
    }
}


export type EmailDraftType = 'FOLLOW_UP' | 'THANK_YOU';

interface EmailDraftInput {
  application: JobApplication;
  type: EmailDraftType;
  customInstructions?: string;
}

export const generateEmailDraft = async ({ application, type, customInstructions }: EmailDraftInput): Promise<string> => {
  checkApiKey();

  const { jobTitle, companyName, contactName, contactEmail, notes, followUpNote, status, baseResume } = application;

  const tone = type === 'FOLLOW_UP'
    ? 'Write a concise, proactive follow-up email.'
    : 'Write a gracious, personalized thank-you email after an interview.';

  const contactLine = contactName ? `Primary contact name: ${contactName}.` : '';
  const contactEmailLine = contactEmail ? `Primary contact email: ${contactEmail}.` : '';
  const noteLine = notes ? `Internal notes from the candidate: ${notes}.` : '';
  const followUpLine = followUpNote ? `Specific context for the follow-up: ${followUpNote}.` : '';
  const statusLine = `Current pipeline status: ${status}.`;
  const resumeLine = baseResume ? `Candidate resume summary: ${baseResume}.` : '';

  const prompt = `
You are an assistant career coach drafting a professional email on behalf of a job seeker.
${tone}
Keep it under 170 words, and lean on specific details when possible.
Return only the email body (no subject line) formatted with newlines that can be pasted into an email client.

Application context:
Role: ${jobTitle}
Company: ${companyName}
${contactLine}
${contactEmailLine}
${statusLine}
${noteLine}
${followUpLine}
${resumeLine}
${customInstructions ? 'Additional guidance from the candidate: ' + customInstructions : ''}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error('Error generating email draft:', error);
    throw new Error('Failed to generate email draft.');
  }
};

export const generateResumeSummary = async (baseResume: string, jobDescription: string): Promise<string> => {
  checkApiKey();
  
  try {
    const prompt = `
      You are a world-class professional resume writer and career coach. 
      Your task is to craft a compelling and tailored professional summary for a resume.
      Analyze the provided base resume summary and the target job description.
      Generate a concise, impactful, 2-4 sentence professional summary that highlights the most relevant skills and experiences from the base resume that align with the job description.
      The tone should be professional, confident, and achievement-oriented. Do not include any introductory phrases like "Here is the summary:". Just provide the summary text directly.

      ---BASE RESUME SUMMARY---
      ${baseResume}

      ---TARGET JOB DESCRIPTION---
      ${jobDescription}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating resume summary:", error);
    throw new Error("Failed to generate AI summary. Please check your API Key and try again.");
  }
};

export const generateInterviewQuestions = async (baseResume: string, jobDescription: string, instruction?: string): Promise<{questions: string[]}> => {
  checkApiKey();
  
  const defaultInstruction = 'Generate a list of 5 to 7 likely interview questions. Include a mix of behavioral, technical, and situational questions relevant to the role.';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        As a senior hiring manager, analyze the following resume and job description. 
        ${instruction || defaultInstruction}

        ---RESUME---
        ${baseResume}

        ---JOB DESCRIPTION---
        ${jobDescription}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              description: 'A list of potential interview questions based on the instruction.',
              items: {
                type: Type.STRING,
                description: 'An interview question.'
              }
            }
          },
          required: ['questions']
        },
      },
    });

    const json = JSON.parse(response.text);
    return json;
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw new Error("Failed to generate interview questions.");
  }
};

export const generateAnswerForQuestion = async (baseResume: string, jobDescription: string, question: string): Promise<string> => {
  checkApiKey();

  try {
    const prompt = `
      You are a career coach preparing a candidate for an interview.
      Your task is to craft a strong, concise answer to a specific interview question.
      Base the answer on the candidate's resume and the target job description.
      Where appropriate, use the STAR (Situation, Task, Action, Result) method.
      The answer should sound natural and confident.

      ---CANDIDATE'S RESUME---
      ${baseResume}

      ---JOB DESCRIPTION---
      ${jobDescription}

      ---INTERVIEW QUESTION---
      ${question}

      Provide the answer directly, without any introductory phrases like "Here is a possible answer:".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating answer:", error);
    throw new Error("Failed to generate an answer for the question.");
  }
};


export const analyzeSkillsFromJDs = async (jobDescriptions: string[]): Promise<SkillsAnalysis> => {
  checkApiKey();

  if (jobDescriptions.length === 0) {
    return { technical: [], soft: [], insights: [] };
  }

  const content = `
    You are analyzing a set of job descriptions to summarize the most relevant skills for a candidate's search.
    Identify the top technical and soft skills, grouping related terms together. Provide frequency counts that reflect
    how often each skill appears across the descriptions and indicate whether the skill seems emerging, increasing, or steady
    in demand based on the language used. Include short example phrases for the skills when helpful.

    --- JOB DESCRIPTIONS ---
    ${jobDescriptions.map((jd, i) => `--- Job Description ${i + 1} ---\n${jd}`).join('\n\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: content,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            technical: {
              type: Type.ARRAY,
              description: 'Top technical skills with counts and momentum.',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  frequency: { type: Type.NUMBER },
                  momentum: { type: Type.STRING },
                  exampleMentions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ['name', 'frequency', 'momentum']
              }
            },
            soft: {
              type: Type.ARRAY,
              description: 'Top soft skills with counts and momentum.',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  frequency: { type: Type.NUMBER },
                  momentum: { type: Type.STRING },
                  exampleMentions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ['name', 'frequency', 'momentum']
              }
            },
            insights: {
              type: Type.ARRAY,
              description: 'Narrative insights about hiring trends and recommendations.',
              items: { type: Type.STRING }
            }
          },
          required: ['technical', 'soft', 'insights']
        },
      },
    });

    return JSON.parse(response.text) as SkillsAnalysis;
  } catch (error) {
    console.error("Error analyzing skills:", error);
    throw new Error("Failed to analyze skills with AI.");
  }
};

export const generateCompanyTalkingPoints = async (companyName: string, jobDescription: string): Promise<string[]> => {
  checkApiKey();

  if (!companyName.trim()) {
    throw new Error('Company name is required to generate company insights.');
  }
  if (!jobDescription.trim()) {
    throw new Error('Job description is required to generate company insights.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are preparing a candidate for an interview with ${companyName}.
        Using only the information in the job description, craft 3-5 concise talking points the candidate can mention
        that show familiarity with the company, its mission, key products, or recent initiatives.
        Focus on concrete facts the candidate can reference in conversation. Each talking point should be one sentence.

        ---JOB DESCRIPTION---
        ${jobDescription}
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            talkingPoints: {
              type: Type.ARRAY,
              description: 'Concise company-specific talking points.',
              items: { type: Type.STRING },
            },
          },
          required: ['talkingPoints'],
        },
      },
    });

    const json = JSON.parse(response.text);
    return json.talkingPoints as string[];
  } catch (error) {
    console.error('Error generating company talking points:', error);
    throw new Error('Failed to generate company talking points.');
  }
};

export const generateTechnologyTalkingPoints = async (jobDescription: string, baseResume: string): Promise<string[]> => {
  checkApiKey();

  if (!jobDescription.trim()) {
    throw new Error('Job description is required to generate technology talking points.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are a senior technologist coaching a candidate for a technical interview.
        Analyse the job description and the candidate's resume highlights to identify the most relevant technologies,
        frameworks, and architecture topics the candidate should be ready to discuss.
        Provide 5-7 bullet points that blend the role's expectations with the candidate's experience.
        Each bullet should mention the technology and the angle the candidate can take when answering technical questions.

        ---JOB DESCRIPTION---
        ${jobDescription}

        ---CANDIDATE RESUME SUMMARY---
        ${baseResume}
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            talkingPoints: {
              type: Type.ARRAY,
              description: 'Technology topics and how the candidate can address them.',
              items: { type: Type.STRING },
            },
          },
          required: ['talkingPoints'],
        },
      },
    });

    const json = JSON.parse(response.text);
    return json.talkingPoints as string[];
  } catch (error) {
    console.error('Error generating technology talking points:', error);
    throw new Error('Failed to generate technology talking points.');
  }
};
