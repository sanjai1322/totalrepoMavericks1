import { storage } from "../storage";
import { aiClient } from "../utils/aiClient";

export class RecommenderAgent {
  async generatePersonalizedRecommendations(userId: string): Promise<void> {
    try {
      const profile = await storage.getProfile(userId);
      const assessmentHistory = await storage.getUserAssessments(userId);
      const moduleProgress = await storage.getUserModuleProgress(userId);
      
      if (!profile || !profile.skills) {
        throw new Error("User profile not found or incomplete");
      }

      // Analyze user's current skill levels and learning patterns
      const skillGaps = this.identifySkillGaps(profile.skills);
      const learningPatterns = this.analyzeLearningPatterns(assessmentHistory, moduleProgress);
      
      // Generate AI-powered recommendations
      const aiRecommendations = await aiClient.generateRecommendations(
        profile.skills,
        assessmentHistory
      );

      // Get available learning modules
      const allModules = await storage.getLearningModules();
      
      // Create weighted recommendations
      const recommendations = this.createWeightedRecommendations(
        aiRecommendations.recommendations,
        skillGaps,
        learningPatterns,
        allModules
      );

      // Clear old recommendations (keep only recent ones)
      // Note: In a real implementation, you might want to expire old recommendations
      
      // Store new recommendations
      for (const rec of recommendations) {
        await storage.createRecommendation(
          userId,
          rec.moduleId,
          rec.score,
          rec.reason
        );
      }

    } catch (error) {
      console.error("Failed to generate recommendations:", error);
      throw new Error("Failed to generate personalized recommendations");
    }
  }

  async getUserRecommendations(userId: string, limit: number = 10) {
    const recommendations = await storage.getUserRecommendations(userId);
    
    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getRecommendationsByTechnology(userId: string, technology: string) {
    const allRecommendations = await storage.getUserRecommendations(userId);
    
    return allRecommendations.filter(rec => 
      rec.module.technology.toLowerCase().includes(technology.toLowerCase()) ||
      rec.module.title.toLowerCase().includes(technology.toLowerCase())
    );
  }

  private identifySkillGaps(skills: Array<{skill: string, level: number, vectorScore: number}>): Array<{skill: string, gapScore: number}> {
    // Identify skills that need improvement (below certain thresholds)
    const gaps: Array<{skill: string, gapScore: number}> = [];
    
    skills.forEach(skill => {
      if (skill.level < 70) { // Consider skills below 70% as needing improvement
        gaps.push({
          skill: skill.skill,
          gapScore: (70 - skill.level) / 70 // Higher gap score means more improvement needed
        });
      }
    });

    return gaps.sort((a, b) => b.gapScore - a.gapScore);
  }

  private analyzeLearningPatterns(assessmentHistory: any[], moduleProgress: any[]): {
    preferredDifficulty: string;
    preferredDuration: number;
    completionRate: number;
    avgTimeToComplete: number;
  } {
    let preferredDifficulty = "intermediate";
    let preferredDuration = 3; // hours
    let completionRate = 0;
    let avgTimeToComplete = 0;

    if (assessmentHistory.length > 0) {
      // Analyze preferred difficulty based on performance
      const difficultyPerformance: Record<string, number[]> = {};
      
      assessmentHistory.forEach(assessment => {
        const difficulty = assessment.assessment.difficulty;
        if (!difficultyPerformance[difficulty]) {
          difficultyPerformance[difficulty] = [];
        }
        difficultyPerformance[difficulty].push(assessment.score);
      });

      // Find difficulty level with best average performance
      let bestAvg = 0;
      Object.keys(difficultyPerformance).forEach(difficulty => {
        const scores = difficultyPerformance[difficulty];
        const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        if (avg > bestAvg) {
          bestAvg = avg;
          preferredDifficulty = difficulty;
        }
      });
    }

    if (moduleProgress.length > 0) {
      // Calculate completion rate
      const completedModules = moduleProgress.filter(p => p.progress >= 100);
      completionRate = completedModules.length / moduleProgress.length;

      // Calculate average preferred duration
      const completedWithDuration = completedModules.filter(p => p.completedAt && p.startedAt);
      if (completedWithDuration.length > 0) {
        avgTimeToComplete = completedWithDuration.reduce((sum, p) => {
          const timeDiff = new Date(p.completedAt!).getTime() - new Date(p.startedAt).getTime();
          return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / completedWithDuration.length;
      }

      // Prefer modules with duration similar to user's completion patterns
      preferredDuration = Math.max(1, Math.min(8, Math.round(avgTimeToComplete || 3)));
    }

    return {
      preferredDifficulty,
      preferredDuration,
      completionRate,
      avgTimeToComplete
    };
  }

  private createWeightedRecommendations(
    aiRecommendations: Array<{technology: string, reason: string, priority: number}>,
    skillGaps: Array<{skill: string, gapScore: number}>,
    learningPatterns: any,
    allModules: any[]
  ): Array<{moduleId: string, score: number, reason: string}> {
    const recommendations: Array<{moduleId: string, score: number, reason: string}> = [];

    aiRecommendations.forEach(aiRec => {
      // Find matching modules
      const matchingModules = allModules.filter(module => 
        module.technology.toLowerCase().includes(aiRec.technology.toLowerCase()) ||
        module.title.toLowerCase().includes(aiRec.technology.toLowerCase())
      );

      matchingModules.forEach(module => {
        let score = aiRec.priority / 100; // Base score from AI

        // Boost score for skill gaps
        const relatedGap = skillGaps.find(gap => 
          gap.skill.toLowerCase().includes(aiRec.technology.toLowerCase()) ||
          aiRec.technology.toLowerCase().includes(gap.skill.toLowerCase())
        );
        if (relatedGap) {
          score += relatedGap.gapScore * 0.3;
        }

        // Adjust score based on learning patterns
        if (module.difficulty === learningPatterns.preferredDifficulty) {
          score += 0.2;
        }

        // Prefer modules with duration matching user patterns
        const durationDiff = Math.abs(module.duration - learningPatterns.preferredDuration);
        if (durationDiff <= 1) {
          score += 0.1;
        }

        // Boost highly rated modules
        if (module.rating >= 4.5) {
          score += 0.15;
        }

        // Ensure score is between 0 and 1
        score = Math.min(1, Math.max(0, score));

        recommendations.push({
          moduleId: module.id,
          score,
          reason: `${aiRec.reason} ${relatedGap ? 'This addresses a skill gap in your profile.' : ''}`
        });
      });
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }

  async refreshRecommendations(userId: string): Promise<void> {
    await this.generatePersonalizedRecommendations(userId);
  }

  async getRecommendationStats(userId: string) {
    const recommendations = await storage.getUserRecommendations(userId);
    const moduleProgress = await storage.getUserModuleProgress(userId);
    
    // Calculate how many recommendations were acted upon
    const recommendedModuleIds = new Set(recommendations.map(r => r.moduleId));
    const startedRecommendations = moduleProgress.filter(p => 
      recommendedModuleIds.has(p.moduleId) && (p.progress ?? 0) > 0
    );

    const actionRate = recommendations.length > 0 
      ? startedRecommendations.length / recommendations.length 
      : 0;

    return {
      totalRecommendations: recommendations.length,
      actedUpon: startedRecommendations.length,
      actionRate: Math.round(actionRate * 100),
      topTechnologies: this.getTopRecommendedTechnologies(recommendations)
    };
  }

  private getTopRecommendedTechnologies(recommendations: any[]): Array<{technology: string, count: number}> {
    const techCounts: Record<string, number> = {};
    
    recommendations.forEach(rec => {
      const tech = rec.module.technology;
      techCounts[tech] = (techCounts[tech] || 0) + 1;
    });

    return Object.entries(techCounts)
      .map(([technology, count]) => ({ technology, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

export const recommenderAgent = new RecommenderAgent();
