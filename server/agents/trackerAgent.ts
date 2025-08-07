import { storage } from "../storage";

export class TrackerAgent {
  async updateProgress(userId: string, moduleId: string, progressPercentage: number): Promise<void> {
    try {
      await storage.updateModuleProgress(userId, moduleId, progressPercentage);
      
      // Check for achievements and milestones
      await this.checkForAchievements(userId, moduleId, progressPercentage);
      
      // Check for stagnation
      await this.checkForStagnation(userId);
      
    } catch (error) {
      console.error("Failed to update progress:", error);
      throw new Error("Failed to update learning progress");
    }
  }

  async getUserProgress(userId: string) {
    const moduleProgress = await storage.getUserModuleProgress(userId);
    const assessmentHistory = await storage.getUserAssessments(userId);
    
    // Calculate overall statistics
    const totalModules = moduleProgress.length;
    const completedModules = moduleProgress.filter(p => (p.progress ?? 0) >= 100).length;
    const inProgressModules = moduleProgress.filter(p => (p.progress ?? 0) > 0 && (p.progress ?? 0) < 100).length;
    
    const totalHours = moduleProgress.reduce((sum, p) => {
      return sum + (p.module.duration * ((p.progress ?? 0) / 100));
    }, 0);

    const avgAssessmentScore = assessmentHistory.length > 0 
      ? assessmentHistory.reduce((sum, a) => sum + a.score, 0) / assessmentHistory.length 
      : 0;

    // Calculate skill progression over time
    const skillProgression = this.calculateSkillProgression(assessmentHistory);
    
    // Get current learning streak
    const learningStreak = await this.calculateLearningStreak(userId);

    return {
      overview: {
        totalModules,
        completedModules,
        inProgressModules,
        completionRate: totalModules > 0 ? (completedModules / totalModules) * 100 : 0,
        totalHours: Math.round(totalHours * 10) / 10,
        avgAssessmentScore: Math.round(avgAssessmentScore),
        learningStreak
      },
      moduleProgress,
      skillProgression,
      recentActivity: await this.getRecentActivity(userId)
    };
  }

  async checkForStagnation(userId: string): Promise<void> {
    const moduleProgress = await storage.getUserModuleProgress(userId);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Check for modules with no recent activity
    const stagnantModules = moduleProgress.filter(p => {
      const lastAccessed = new Date(p.lastAccessedAt);
      return (p.progress ?? 0) > 0 && (p.progress ?? 0) < 100 && lastAccessed < sevenDaysAgo;
    });

    if (stagnantModules.length > 0) {
      const message = `You have ${stagnantModules.length} learning module(s) that haven't been accessed in over a week. Consider returning to maintain your momentum!`;
      await storage.createAlert(userId, "stagnation", message);
    }

    // Check for complete inactivity
    const hasRecentActivity = moduleProgress.some(p => {
      const lastAccessed = new Date(p.lastAccessedAt);
      return lastAccessed > sevenDaysAgo;
    });

    if (!hasRecentActivity && moduleProgress.length > 0) {
      const message = "You haven't engaged with any learning modules this week. Stay consistent with your learning goals!";
      await storage.createAlert(userId, "stagnation", message);
    }

    // Check for assessment inactivity
    const assessmentHistory = await storage.getUserAssessments(userId);
    const recentAssessments = assessmentHistory.filter(a => {
      const completedAt = new Date(a.completedAt);
      return completedAt > thirtyDaysAgo;
    });

    if (recentAssessments.length === 0 && assessmentHistory.length > 0) {
      const message = "It's been a while since your last assessment. Take a quick quiz to track your progress!";
      await storage.createAlert(userId, "reminder", message);
    }
  }

  async checkForAchievements(userId: string, moduleId: string, progressPercentage: number): Promise<void> {
    // Module completion achievement
    if (progressPercentage >= 100) {
      const message = "🎉 Congratulations! You've completed a learning module. Keep up the excellent work!";
      await storage.createAlert(userId, "achievement", message);
    }

    // Check for milestone achievements
    const userProgress = await storage.getUserModuleProgress(userId);
    const completedModules = userProgress.filter(p => (p.progress ?? 0) >= 100).length;

    // Milestone achievements
    const milestones = [1, 5, 10, 25, 50];
    if (milestones.includes(completedModules)) {
      const message = `🏆 Amazing! You've completed ${completedModules} learning module${completedModules > 1 ? 's' : ''}. You're building an impressive skill set!`;
      await storage.createAlert(userId, "achievement", message);
    }

    // Learning streak achievements
    const streak = await this.calculateLearningStreak(userId);
    const streakMilestones = [7, 14, 30, 60];
    if (streakMilestones.includes(streak)) {
      const message = `🔥 You're on fire! ${streak} days learning streak! Consistency is key to mastery.`;
      await storage.createAlert(userId, "achievement", message);
    }
  }

  async detectStagnation(userId: string): Promise<{
    hasStagnation: boolean;
    stagnantModules: any[];
    recommendations: string[];
  }> {
    const moduleProgress = await storage.getUserModuleProgress(userId);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const stagnantModules = moduleProgress.filter(p => {
      const lastAccessed = new Date(p.lastAccessedAt);
      return (p.progress ?? 0) > 0 && (p.progress ?? 0) < 100 && lastAccessed < oneWeekAgo;
    });

    const severelyStagnant = moduleProgress.filter(p => {
      const lastAccessed = new Date(p.lastAccessedAt);
      return (p.progress ?? 0) > 0 && (p.progress ?? 0) < 100 && lastAccessed < twoWeeksAgo;
    });

    const recommendations: string[] = [];
    
    if (stagnantModules.length > 0) {
      recommendations.push("Resume your in-progress learning modules to maintain momentum");
    }
    
    if (severelyStagnant.length > 0) {
      recommendations.push("Consider reviewing completed sections before continuing");
      recommendations.push("Break down remaining content into smaller, manageable chunks");
    }

    if (stagnantModules.length === 0) {
      recommendations.push("Take a new assessment to identify areas for improvement");
      recommendations.push("Explore new learning recommendations based on your skill gaps");
    }

    return {
      hasStagnation: stagnantModules.length > 0,
      stagnantModules,
      recommendations
    };
  }

  private calculateSkillProgression(assessmentHistory: any[]): Array<{
    technology: string;
    scores: Array<{score: number, date: string}>;
    trend: 'improving' | 'stable' | 'declining';
  }> {
    const skillGroups: Record<string, Array<{score: number, date: string}>> = {};
    
    // Group assessments by technology
    assessmentHistory.forEach(assessment => {
      const tech = assessment.assessment.technology;
      if (!skillGroups[tech]) {
        skillGroups[tech] = [];
      }
      skillGroups[tech].push({
        score: assessment.score,
        date: assessment.completedAt
      });
    });

    // Calculate trends
    return Object.entries(skillGroups).map(([technology, scores]) => {
      scores.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      
      if (scores.length >= 2) {
        const recent = scores.slice(-3); // Last 3 assessments
        const older = scores.slice(0, -3);
        
        if (recent.length >= 2 && older.length >= 1) {
          const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
          const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / older.length;
          
          if (recentAvg > olderAvg + 5) {
            trend = 'improving';
          } else if (recentAvg < olderAvg - 5) {
            trend = 'declining';
          }
        }
      }

      return { technology, scores, trend };
    });
  }

  private async calculateLearningStreak(userId: string): Promise<number> {
    const moduleProgress = await storage.getUserModuleProgress(userId);
    
    if (moduleProgress.length === 0) return 0;

    const now = new Date();
    let streak = 0;
    let currentDate = new Date(now);
    
    // Check each day going backwards
    for (let i = 0; i < 365; i++) { // Max 1 year streak check
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Check if there was any learning activity on this day
      const hasActivity = moduleProgress.some(p => {
        const lastAccessed = new Date(p.lastAccessedAt);
        return lastAccessed >= dayStart && lastAccessed <= dayEnd;
      });

      if (hasActivity) {
        streak++;
      } else if (i > 0) { // Don't break on the first day (today might not have activity yet)
        break;
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  private async getRecentActivity(userId: string, days: number = 7): Promise<Array<{
    type: 'assessment' | 'module_progress' | 'completion';
    description: string;
    date: string;
    score?: number;
  }>> {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const activities: Array<{
      type: 'assessment' | 'module_progress' | 'completion';
      description: string;
      date: string;
      score?: number;
    }> = [];

    // Get recent assessments
    const assessments = await storage.getUserAssessments(userId);
    const recentAssessments = assessments.filter(a => new Date(a.completedAt) > cutoffDate);
    
    recentAssessments.forEach(assessment => {
      activities.push({
        type: 'assessment',
        description: `Completed ${assessment.assessment.title}`,
        date: assessment.completedAt.toISOString(),
        score: assessment.score
      });
    });

    // Get recent module progress
    const moduleProgress = await storage.getUserModuleProgress(userId);
    const recentProgress = moduleProgress.filter(p => new Date(p.lastAccessedAt) > cutoffDate);
    
    recentProgress.forEach(progress => {
      if (progress.completedAt && new Date(progress.completedAt) > cutoffDate) {
        activities.push({
          type: 'completion',
          description: `Completed ${progress.module.title}`,
          date: progress.completedAt.toISOString()
        });
      } else {
        activities.push({
          type: 'module_progress',
          description: `Studied ${progress.module.title} (${Math.round(progress.progress ?? 0)}% complete)`,
          date: progress.lastAccessedAt.toISOString()
        });
      }
    });

    // Sort by date (most recent first)
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async generateProgressReport(userId: string, timeframe: 'week' | 'month' | 'quarter' = 'month') {
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const progress = await this.getUserProgress(userId);
    const recentActivity = await this.getRecentActivity(userId, days);
    const stagnationCheck = await this.detectStagnation(userId);

    // Filter recent completions and assessments
    const recentCompletions = recentActivity.filter(a => a.type === 'completion').length;
    const recentAssessments = recentActivity.filter(a => a.type === 'assessment').length;
    const avgRecentScore = recentActivity
      .filter(a => a.type === 'assessment' && a.score !== undefined)
      .reduce((sum, a, _, arr) => sum + (a.score! / arr.length), 0) || 0;

    return {
      timeframe,
      summary: {
        modulesCompleted: recentCompletions,
        assessmentsTaken: recentAssessments,
        averageScore: Math.round(avgRecentScore),
        learningStreak: progress.overview.learningStreak,
        totalHoursLearned: progress.overview.totalHours
      },
      stagnationAlert: stagnationCheck.hasStagnation,
      recommendations: stagnationCheck.recommendations,
      recentActivity: recentActivity.slice(0, 10) // Last 10 activities
    };
  }
}

export const trackerAgent = new TrackerAgent();
