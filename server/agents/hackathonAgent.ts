import { storage } from "../storage";
import { aiClient } from "../utils/aiClient";
import { type InsertHackathon } from "@shared/schema";

export class HackathonAgent {
  async createHackathon(
    creatorId: string,
    title: string,
    description: string,
    theme: string,
    difficulty: string,
    startDate: Date,
    endDate: Date,
    registrationDeadline: Date,
    maxParticipants?: number
  ): Promise<string> {
    try {
      // Generate AI-powered challenges based on theme and difficulty
      const generatedChallenges = await aiClient.generateHackathonChallenges(theme, difficulty);
      
      const hackathonData: InsertHackathon = {
        title,
        description,
        theme,
        difficulty,
        startDate,
        endDate,
        registrationDeadline,
        maxParticipants,
        challenges: generatedChallenges.challenges,
        createdBy: creatorId,
        prizes: this.generateDefaultPrizes(difficulty)
      };

      const hackathon = await storage.createHackathon(hackathonData);
      return hackathon.id;
    } catch (error) {
      console.error("Failed to create hackathon:", error);
      throw new Error("Failed to create hackathon");
    }
  }

  async joinHackathon(hackathonId: string, userId: string, teamName?: string): Promise<void> {
    try {
      // Check hackathon exists and is open for registration
      const hackathons = await storage.getHackathons();
      const hackathon = hackathons.find(h => h.id === hackathonId);
      
      if (!hackathon) {
        throw new Error("Hackathon not found");
      }

      const now = new Date();
      if (now > hackathon.registrationDeadline) {
        throw new Error("Registration deadline has passed");
      }

      if (hackathon.maxParticipants && (hackathon.currentParticipants ?? 0) >= hackathon.maxParticipants) {
        throw new Error("Hackathon is full");
      }

      await storage.joinHackathon(hackathonId, userId, teamName);
    } catch (error) {
      console.error("Failed to join hackathon:", error);
      throw error;
    }
  }

  async getHackathons(filter?: 'all' | 'active' | 'upcoming' | 'completed') {
    const allHackathons = await storage.getHackathons();
    const now = new Date();

    if (!filter || filter === 'all') {
      return allHackathons;
    }

    return allHackathons.filter(hackathon => {
      switch (filter) {
        case 'active':
          return hackathon.startDate <= now && hackathon.endDate >= now;
        case 'upcoming':
          return hackathon.startDate > now;
        case 'completed':
          return hackathon.endDate < now;
        default:
          return true;
      }
    });
  }

  async getHackathonDetails(hackathonId: string) {
    const hackathons = await storage.getHackathons();
    const hackathon = hackathons.find(h => h.id === hackathonId);
    
    if (!hackathon) {
      throw new Error("Hackathon not found");
    }

    const participants = await storage.getHackathonParticipants(hackathonId);
    
    return {
      ...hackathon,
      participants: participants.length,
      participantList: participants,
      status: this.getHackathonStatus(hackathon),
      daysRemaining: this.calculateDaysRemaining(hackathon)
    };
  }

  async getUserHackathons(userId: string) {
    const allHackathons = await storage.getHackathons();
    const userParticipations: Array<{hackathon: any, participation: any}> = [];

    for (const hackathon of allHackathons) {
      const participants = await storage.getHackathonParticipants(hackathon.id);
      const userParticipation = participants.find(p => p.userId === userId);
      
      if (userParticipation) {
        userParticipations.push({
          hackathon: {
            ...hackathon,
            status: this.getHackathonStatus(hackathon),
            daysRemaining: this.calculateDaysRemaining(hackathon)
          },
          participation: userParticipation
        });
      }
    }

    return userParticipations;
  }

  async generateChallenges(theme: string, difficulty: string, challengeCount: number = 3) {
    try {
      const challenges = await aiClient.generateHackathonChallenges(theme, difficulty);
      
      // Ensure we have the requested number of challenges
      while (challenges.challenges.length < challengeCount) {
        const additionalChallenges = await aiClient.generateHackathonChallenges(theme, difficulty);
        challenges.challenges.push(...additionalChallenges.challenges);
      }

      return challenges.challenges.slice(0, challengeCount);
    } catch (error) {
      console.error("Failed to generate challenges:", error);
      throw new Error("Failed to generate hackathon challenges");
    }
  }

  async submitSolution(hackathonId: string, userId: string, challengeId: string, submission: any): Promise<void> {
    try {
      // This would typically involve storing the submission and potentially scoring it
      // For now, we'll store it in the participant's submission field
      
      const participants = await storage.getHackathonParticipants(hackathonId);
      const participant = participants.find(p => p.userId === userId);
      
      if (!participant) {
        throw new Error("User not registered for this hackathon");
      }

      // Update participant's submission
      // Note: This is a simplified implementation. In a real system, you'd have a separate submissions table
      const currentSubmissions: Record<string, any> = participant.submission || {};
      currentSubmissions[challengeId] = {
        ...submission,
        submittedAt: new Date()
      };

      // In a real implementation, you'd update the participant record here
      // await storage.updateHackathonParticipant(participant.id, { submission: currentSubmissions });
      
    } catch (error) {
      console.error("Failed to submit solution:", error);
      throw new Error("Failed to submit hackathon solution");
    }
  }

  async getLeaderboard(hackathonId: string) {
    const participants = await storage.getHackathonParticipants(hackathonId);
    
    // Sort by score (descending) and then by submission time
    const leaderboard = participants
      .filter(p => p.score !== null && p.score !== undefined)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score! - a.score!;
        }
        // If scores are equal, earlier submission wins
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      })
      .map((participant, index) => ({
        rank: index + 1,
        username: participant.user.username,
        teamName: participant.teamName,
        score: participant.score,
        submissionCount: participant.submission ? Object.keys(participant.submission).length : 0
      }));

    return leaderboard;
  }

  private getHackathonStatus(hackathon: any): 'upcoming' | 'registration_open' | 'active' | 'completed' {
    const now = new Date();
    
    if (now < hackathon.registrationDeadline) {
      return 'registration_open';
    } else if (now < hackathon.startDate) {
      return 'upcoming';
    } else if (now <= hackathon.endDate) {
      return 'active';
    } else {
      return 'completed';
    }
  }

  private calculateDaysRemaining(hackathon: any): number {
    const now = new Date();
    const targetDate = hackathon.endDate > now ? hackathon.endDate : hackathon.startDate;
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  private generateDefaultPrizes(difficulty: string): any {
    const basePrizes = {
      beginner: {
        first: { title: "1st Place", description: "Certificate + $100 voucher", value: 100 },
        second: { title: "2nd Place", description: "Certificate + $50 voucher", value: 50 },
        third: { title: "3rd Place", description: "Certificate + $25 voucher", value: 25 }
      },
      intermediate: {
        first: { title: "1st Place", description: "Certificate + $250 voucher", value: 250 },
        second: { title: "2nd Place", description: "Certificate + $150 voucher", value: 150 },
        third: { title: "3rd Place", description: "Certificate + $75 voucher", value: 75 }
      },
      advanced: {
        first: { title: "1st Place", description: "Certificate + $500 voucher", value: 500 },
        second: { title: "2nd Place", description: "Certificate + $300 voucher", value: 300 },
        third: { title: "3rd Place", description: "Certificate + $150 voucher", value: 150 }
      }
    };

    return basePrizes[difficulty as keyof typeof basePrizes] || basePrizes.intermediate;
  }

  async getHackathonStats() {
    const allHackathons = await storage.getHackathons();
    const now = new Date();
    
    const active = allHackathons.filter(h => h.startDate <= now && h.endDate >= now).length;
    const upcoming = allHackathons.filter(h => h.startDate > now).length;
    const completed = allHackathons.filter(h => h.endDate < now).length;
    
    const totalParticipants = allHackathons.reduce((sum, h) => sum + (h.currentParticipants || 0), 0);
    
    return {
      total: allHackathons.length,
      active,
      upcoming,
      completed,
      totalParticipants,
      avgParticipantsPerHackathon: allHackathons.length > 0 ? Math.round(totalParticipants / allHackathons.length) : 0
    };
  }
}

export const hackathonAgent = new HackathonAgent();
