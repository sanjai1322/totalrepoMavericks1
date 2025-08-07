import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = OPENROUTER_API_KEY;
    this.baseUrl = OPENROUTER_BASE_URL;
    
    if (!this.apiKey) {
      throw new Error("OpenRouter API key not found. Please set OPENROUTER_API_KEY environment variable.");
    }
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      
      messages.push({ role: "user", content: prompt });

      const response = await axios.post<OpenRouterResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: "openai/gpt-3.5-turbo",
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("AI completion error:", error);
      throw new Error("Failed to generate AI completion");
    }
  }

  async parseResume(resumeText: string): Promise<{
    skills: Array<{skill: string, level: number, vectorScore: number}>;
    experience: string;
    education: string;
  }> {
    const systemPrompt = `You are an expert resume parser. Extract and structure information from resumes.
    Return only valid JSON with this exact structure:
    {
      "skills": [{"skill": "JavaScript", "level": 85, "vectorScore": 0.85}],
      "experience": "Brief summary of work experience",
      "education": "Brief summary of educational background"
    }
    
    For skills:
    - level: 1-100 proficiency score
    - vectorScore: 0.0-1.0 normalized score for ML purposes
    - Include programming languages, frameworks, tools, and technical skills`;

    const prompt = `Parse this resume and extract structured information:\n\n${resumeText}`;
    
    const response = await this.generateCompletion(prompt, systemPrompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      throw new Error("Failed to parse resume data");
    }
  }

  async generateAssessment(technology: string, difficulty: string, questionCount: number = 15): Promise<{
    questions: Array<{
      id: string;
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>;
  }> {
    const systemPrompt = `You are an expert technical interviewer. Generate high-quality multiple choice questions for software developer assessments.
    Return only valid JSON with this exact structure:
    {
      "questions": [
        {
          "id": "q1",
          "question": "What is the primary purpose of React hooks?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Brief explanation of the correct answer"
        }
      ]
    }
    
    Requirements:
    - Each question should test practical knowledge
    - Options should be plausible but only one correct
    - Include explanations for learning purposes
    - Questions should be appropriate for the specified difficulty level`;

    const prompt = `Generate ${questionCount} multiple choice questions for ${technology} at ${difficulty} level.
    Focus on practical, real-world scenarios and best practices.`;
    
    const response = await this.generateCompletion(prompt, systemPrompt);
    
    try {
      const parsed = JSON.parse(response);
      // Add unique IDs if not provided
      parsed.questions.forEach((q: any, index: number) => {
        if (!q.id) {
          q.id = `q${index + 1}`;
        }
      });
      return parsed;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      throw new Error("Failed to generate assessment questions");
    }
  }

  async generateHackathonChallenges(theme: string, difficulty: string): Promise<{
    challenges: Array<{
      id: string;
      title: string;
      description: string;
      requirements: string[];
      points: number;
    }>;
  }> {
    const systemPrompt = `You are an expert hackathon organizer. Generate creative and challenging coding challenges.
    Return only valid JSON with this exact structure:
    {
      "challenges": [
        {
          "id": "challenge1",
          "title": "Challenge Title",
          "description": "Detailed description of what to build",
          "requirements": ["Requirement 1", "Requirement 2"],
          "points": 100
        }
      ]
    }
    
    Points should range from 50-500 based on complexity.`;

    const prompt = `Generate 3-5 hackathon challenges for theme: "${theme}" at ${difficulty} difficulty level.
    Challenges should be innovative, achievable within a hackathon timeframe, and clearly defined.`;
    
    const response = await this.generateCompletion(prompt, systemPrompt);
    
    try {
      const parsed = JSON.parse(response);
      // Add unique IDs if not provided
      parsed.challenges.forEach((c: any, index: number) => {
        if (!c.id) {
          c.id = `challenge${index + 1}`;
        }
      });
      return parsed;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      throw new Error("Failed to generate hackathon challenges");
    }
  }

  async generateRecommendations(userSkills: Array<{skill: string, level: number}>, assessmentHistory: any[]): Promise<{
    recommendations: Array<{
      technology: string;
      reason: string;
      priority: number;
    }>;
  }> {
    const systemPrompt = `You are an expert learning advisor for software developers. Analyze user data and provide personalized learning recommendations.
    Return only valid JSON with this exact structure:
    {
      "recommendations": [
        {
          "technology": "Technology name",
          "reason": "Why this is recommended for the user",
          "priority": 85
        }
      ]
    }
    
    Priority should be 1-100 where 100 is highest priority.`;

    const prompt = `Based on this user profile, recommend learning paths:
    
    Current Skills: ${JSON.stringify(userSkills)}
    Assessment History: ${JSON.stringify(assessmentHistory)}
    
    Consider skill gaps, current trends, and career progression.`;
    
    const response = await this.generateCompletion(prompt, systemPrompt);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      throw new Error("Failed to generate recommendations");
    }
  }
}

export const aiClient = new AIClient();
