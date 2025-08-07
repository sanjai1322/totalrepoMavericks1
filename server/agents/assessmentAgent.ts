import { storage } from "../storage";
import { aiClient } from "../utils/aiClient";
import { profileAgent } from "./profileAgent";
import { type InsertAssessment, type InsertUserAssessment } from "@shared/schema";

export class AssessmentAgent {
  async createAssessment(technology: string, difficulty: string, questionCount: number = 15): Promise<string> {
    try {
      // Generate questions using AI
      const generatedQuestions = await aiClient.generateAssessment(technology, difficulty, questionCount);
      
      const assessmentData: InsertAssessment = {
        title: `${technology} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Assessment`,
        technology,
        difficulty,
        questions: generatedQuestions.questions,
        timeLimit: this.calculateTimeLimit(questionCount, difficulty)
      };

      const assessment = await storage.createAssessment(assessmentData);
      return assessment.id;
    } catch (error) {
      console.error("Failed to create assessment:", error);
      throw new Error("Failed to create assessment");
    }
  }

  async submitAssessment(
    userId: string, 
    assessmentId: string, 
    answers: Array<{questionId: string, selectedAnswer: number}>,
    timeSpent: number
  ): Promise<{ score: number; correctAnswers: number; totalQuestions: number }> {
    try {
      const assessment = await storage.getAssessments().then(assessments => 
        assessments.find(a => a.id === assessmentId)
      );
      
      if (!assessment) {
        throw new Error("Assessment not found");
      }

      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = assessment.questions.length;

      answers.forEach(answer => {
        const question = assessment.questions.find(q => q.id === answer.questionId);
        if (question && question.correctAnswer === answer.selectedAnswer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / totalQuestions) * 100);

      // Store user assessment
      const userAssessmentData: InsertUserAssessment = {
        userId,
        assessmentId,
        answers,
        score,
        correctAnswers,
        totalQuestions,
        timeSpent
      };

      await storage.createUserAssessment(userAssessmentData);

      // Update user's skill scores based on assessment
      await profileAgent.updateSkillScores(userId, [{
        technology: assessment.technology,
        score
      }]);

      return { score, correctAnswers, totalQuestions };
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      throw new Error("Failed to submit assessment");
    }
  }

  async getAssessmentsByTechnology(technology?: string) {
    if (technology) {
      return await storage.getAssessmentsByTechnology(technology);
    }
    return await storage.getAssessments();
  }

  async getUserAssessmentHistory(userId: string) {
    return await storage.getUserAssessments(userId);
  }

  async getAssessmentResults(userId: string, assessmentId: string) {
    const userAssessments = await storage.getUserAssessments(userId);
    const userAssessment = userAssessments.find(ua => ua.assessmentId === assessmentId);
    
    if (!userAssessment) {
      throw new Error("Assessment result not found");
    }

    // Get detailed results with explanations
    const assessment = userAssessment.assessment;
    const detailedResults = userAssessment.answers.map(answer => {
      const question = assessment.questions.find(q => q.id === answer.questionId);
      const isCorrect = question?.correctAnswer === answer.selectedAnswer;
      
      return {
        questionId: answer.questionId,
        question: question?.question,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question?.correctAnswer,
        isCorrect,
        explanation: question?.explanation,
        options: question?.options
      };
    });

    return {
      ...userAssessment,
      detailedResults
    };
  }

  private calculateTimeLimit(questionCount: number, difficulty: string): number {
    // Base time per question
    let baseTime = 1; // minutes per question
    
    switch (difficulty) {
      case 'beginner':
        baseTime = 1.5;
        break;
      case 'intermediate':
        baseTime = 2;
        break;
      case 'advanced':
        baseTime = 2.5;
        break;
    }
    
    return Math.ceil(questionCount * baseTime);
  }

  async generateTopicBasedScores(userId: string) {
    const userAssessments = await storage.getUserAssessments(userId);
    
    // Group assessments by technology and calculate average scores
    const scoresByTechnology: Record<string, { scores: number[], average: number }> = {};
    
    userAssessments.forEach(ua => {
      const tech = ua.assessment.technology;
      if (!scoresByTechnology[tech]) {
        scoresByTechnology[tech] = { scores: [], average: 0 };
      }
      scoresByTechnology[tech].scores.push(ua.score);
    });

    // Calculate averages
    Object.keys(scoresByTechnology).forEach(tech => {
      const scores = scoresByTechnology[tech].scores;
      scoresByTechnology[tech].average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    return scoresByTechnology;
  }
}

export const assessmentAgent = new AssessmentAgent();
