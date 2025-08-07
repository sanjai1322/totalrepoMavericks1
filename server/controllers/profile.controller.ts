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

// Moonshot AI skill extraction
async function extractSkillsFromResume(resumeText: string): Promise<string[]> {
  try {
    const response = await axios.post(
      'https://api.moonshot.cn/v1/chat/completions',
      {
        model: 'kimi-k2:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing resumes and extracting technical skills. Extract only the technical skills, programming languages, frameworks, and tools mentioned in the resume. Return them as a JSON array of strings.'
          },
          {
            role: 'user',
            content: `Analyze this resume and extract technical skills:\n\n${resumeText}`
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content;
    
    // Try to parse JSON response, fallback to basic parsing
    try {
      return JSON.parse(aiResponse);
    } catch {
      // Fallback: extract skills from text response
      const skillMatches = aiResponse.match(/["']([^"']+)["']/g);
      return skillMatches ? skillMatches.map((s: string) => s.slice(1, -1)) : [];
    }
  } catch (error) {
    console.error('Moonshot AI Error:', error);
    // Fallback: basic skill extraction from resume text
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 
      'Express', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Git'
    ];
    
    return commonSkills.filter(skill => 
      resumeText.toLowerCase().includes(skill.toLowerCase())
    );
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

      // Extract skills using Moonshot AI
      const extractedSkills = await extractSkillsFromResume(resume);

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
      const skillsData = extractedSkills.map(skill => ({
        skill,
        level: 70, // Default skill level
        vectorScore: Math.random() * 100 // Placeholder score
      }));

      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId: newUser.id,
          resumeData: { originalText: resume },
          skills: skillsData,
        })
        .returning();

      // Return success response
      return res.status(201).json({
        message: 'Profile created successfully',
        userId: newUser.id,
        skills: extractedSkills,
        profile: {
          id: newProfile.id,
          name: newUser.fullName,
          email: newUser.email,
          skillCount: extractedSkills.length
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