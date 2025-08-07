import { Request, Response } from 'express';
import { db } from '../db';
import { users, profiles } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import axios from 'axios';

// Request validation schema
const createProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  resume: z.string().min(10, 'Resume content is required'),
});

// OpenRouter AI skill extraction with GPT-3.5-turbo
async function extractSkillsFromResume(resumeText: string): Promise<{
  skills: string[];
  experience: string;
  tech_stack: string[];
}> {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume parser. Extract structured information from resumes and return ONLY valid JSON in this exact format:
{
  "skills": ["JavaScript", "Node.js", "React"],
  "experience": "5 years in full-stack development",
  "tech_stack": ["React", "PostgreSQL", "Docker"]
}

Extract:
- skills: All technical skills, programming languages, frameworks, and tools
- experience: Brief summary of years and type of experience  
- tech_stack: Main technologies/frameworks used in their work`
          },
          {
            role: 'user',
            content: `Parse this resume and extract structured information:\n\n${resumeText}`
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content;
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(aiResponse);
      
      // Validate required fields
      if (!parsed.skills || !Array.isArray(parsed.skills)) {
        throw new Error("Invalid response: missing skills array");
      }
      
      return {
        skills: parsed.skills,
        experience: parsed.experience || "Experience not specified",
        tech_stack: parsed.tech_stack || []
      };
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      throw new Error("Failed to process resume");
    }
  } catch (error) {
    console.error('OpenRouter AI Error:', error);
    throw new Error("Failed to process resume");
  }
}

export class ProfileController {
  static async createProfile(req: Request, res: Response) {
    try {
      // Validate request body
      const validationResult = createProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: validationResult.error.errors
        });
      }

      const { name, email, resume } = validationResult.data;

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({
          message: 'User with this email already exists'
        });
      }

      // Extract skills using OpenRouter AI
      const aiResult = await extractSkillsFromResume(resume);

      // Create user record
      const [newUser] = await db
        .insert(users)
        .values({
          username: email.split('@')[0], // Use email prefix as username
          email: email,
          password: 'temp_password', // In production, implement proper authentication
          fullName: name,
        })
        .returning();

      // Create profile with extracted skills
      const skillsData = aiResult.skills.map(skill => ({
        skill,
        level: 70, // Default skill level
        vectorScore: Math.random() * 100 // Placeholder score
      }));

      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId: newUser.id,
          resumeData: { 
            originalText: resume,
            experience: aiResult.experience,
            techStack: aiResult.tech_stack
          },
          skills: skillsData,
          experience: aiResult.experience,
        })
        .returning();

      // Return success response
      return res.status(201).json({
        message: 'Profile created successfully',
        userId: newUser.id,
        skills: aiResult.skills,
        experience: aiResult.experience,
        tech_stack: aiResult.tech_stack,
        profile: {
          id: newProfile.id,
          name: newUser.fullName,
          email: newUser.email,
          skillCount: aiResult.skills.length
        }
      });

    } catch (error) {
      console.error('Profile creation error:', error);
      return res.status(500).json({
        message: 'Internal server error during profile creation'
      });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const userWithProfile = await db
        .select()
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(users.id, userId))
        .limit(1);

      if (userWithProfile.length === 0) {
        return res.status(404).json({
          message: 'Profile not found'
        });
      }

      const user = userWithProfile[0].users;
      const profile = userWithProfile[0].profiles;

      return res.json({
        userId: user.id,
        name: user.fullName,
        email: user.email,
        skills: profile?.skills || [],
        createdAt: user.createdAt
      });

    } catch (error) {
      console.error('Profile retrieval error:', error);
      return res.status(500).json({
        message: 'Error retrieving profile'
      });
    }
  }
}