import { storage } from "../storage";
import { aiClient } from "../utils/aiClient";
import { type InsertProfile } from "@shared/schema";

export class ProfileAgent {
  async parseAndStoreResume(userId: string, resumeText: string): Promise<void> {
    try {
      // Parse resume using AI
      const parsedData = await aiClient.parseResume(resumeText);
      
      // Check if profile exists
      const existingProfile = await storage.getProfile(userId);
      
      const profileData: Partial<InsertProfile> = {
        userId,
        resumeData: { rawText: resumeText, parsedAt: new Date() },
        skills: parsedData.skills,
        experience: parsedData.experience,
        education: parsedData.education,
      };
      
      if (existingProfile) {
        await storage.updateProfile(userId, profileData);
      } else {
        await storage.createProfile(profileData as InsertProfile);
      }
      
      // Generate new recommendations based on updated profile
      await this.generateRecommendations(userId);
      
    } catch (error) {
      console.error("Failed to parse resume:", error);
      throw new Error("Failed to process resume");
    }
  }

  async updateSkillScores(userId: string, assessmentResults: { technology: string; score: number }[]): Promise<void> {
    try {
      const profile = await storage.getProfile(userId);
      if (!profile) {
        throw new Error("Profile not found");
      }

      const existingSkills = profile.skills || [];
      
      // Update skill scores based on assessment results
      assessmentResults.forEach(result => {
        const skillIndex = existingSkills.findIndex(s => s.skill.toLowerCase() === result.technology.toLowerCase());
        
        if (skillIndex >= 0) {
          // Update existing skill
          existingSkills[skillIndex].level = Math.max(existingSkills[skillIndex].level, result.score);
          existingSkills[skillIndex].vectorScore = existingSkills[skillIndex].level / 100;
        } else {
          // Add new skill
          existingSkills.push({
            skill: result.technology,
            level: result.score,
            vectorScore: result.score / 100
          });
        }
      });

      await storage.updateProfile(userId, { skills: existingSkills });
      
      // Generate new recommendations based on updated skills
      await this.generateRecommendations(userId);
      
    } catch (error) {
      console.error("Failed to update skill scores:", error);
      throw new Error("Failed to update skill scores");
    }
  }

  async extractSkillsFromText(text: string): Promise<Array<{skill: string, level: number, vectorScore: number}>> {
    try {
      const parsedData = await aiClient.parseResume(text);
      return parsedData.skills;
    } catch (error) {
      console.error("Failed to extract skills:", error);
      return [];
    }
  }

  private async generateRecommendations(userId: string): Promise<void> {
    try {
      const profile = await storage.getProfile(userId);
      const assessmentHistory = await storage.getUserAssessments(userId);
      
      if (!profile || !profile.skills) {
        return;
      }

      const recommendations = await aiClient.generateRecommendations(
        profile.skills,
        assessmentHistory
      );

      // Get available learning modules
      const allModules = await storage.getLearningModules();
      
      // Create recommendations for matching modules
      for (const rec of recommendations.recommendations) {
        const matchingModules = allModules.filter(module => 
          module.technology.toLowerCase().includes(rec.technology.toLowerCase()) ||
          module.title.toLowerCase().includes(rec.technology.toLowerCase())
        );

        for (const module of matchingModules) {
          await storage.createRecommendation(
            userId,
            module.id,
            rec.priority / 100,
            rec.reason
          );
        }
      }
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
    }
  }

  async getProfileWithStats(userId: string) {
    const profile = await storage.getProfile(userId);
    const assessments = await storage.getUserAssessments(userId);
    const moduleProgress = await storage.getUserModuleProgress(userId);
    
    if (!profile) {
      return null;
    }

    // Calculate stats
    const totalAssessments = assessments.length;
    const avgScore = totalAssessments > 0 
      ? assessments.reduce((sum, a) => sum + a.score, 0) / totalAssessments 
      : 0;
    
    const totalLearningHours = moduleProgress.reduce((sum, p) => {
      return sum + (p.module.duration * ((p.progress ?? 0) / 100));
    }, 0);

    return {
      profile,
      stats: {
        skillsAssessed: profile.skills?.length || 0,
        avgScore: Math.round(avgScore),
        learningHours: Math.round(totalLearningHours),
        totalAssessments
      }
    };
  }
}

export const profileAgent = new ProfileAgent();
