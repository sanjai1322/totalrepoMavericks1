import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { profileAgent } from "./agents/profileAgent";
import { assessmentAgent } from "./agents/assessmentAgent";
import { recommenderAgent } from "./agents/recommenderAgent";
import { trackerAgent } from "./agents/trackerAgent";
import { hackathonAgent } from "./agents/hackathonAgent";
import { z } from "zod";
import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user session for development (replace with proper auth)
  app.use((req, res, next) => {
    req.user = { id: "user-1", username: "demo-user" };
    next();
  });

  // Profile routes
  app.post("/api/profile/resume", upload.single('resume'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const resumeText = req.file.buffer.toString('utf-8');
      await profileAgent.parseAndStoreResume(req.user.id, resumeText);
      
      res.json({ message: "Resume parsed and profile updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/profile", async (req, res) => {
    try {
      const profileData = await profileAgent.getProfileWithStats(req.user.id);
      if (!profileData) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profileData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/profile", async (req, res) => {
    try {
      const updates = req.body;
      const updatedProfile = await storage.updateProfile(req.user.id, updates);
      res.json(updatedProfile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Assessment routes
  app.get("/api/assessments", async (req, res) => {
    try {
      const technology = req.query.technology as string;
      const assessments = await assessmentAgent.getAssessmentsByTechnology(technology);
      res.json(assessments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/assessments", async (req, res) => {
    try {
      const { technology, difficulty, questionCount } = req.body;
      const assessmentId = await assessmentAgent.createAssessment(technology, difficulty, questionCount || 15);
      res.json({ assessmentId });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/assessments/:id/submit", async (req, res) => {
    try {
      const { answers, timeSpent } = req.body;
      const result = await assessmentAgent.submitAssessment(
        req.user.id,
        req.params.id,
        answers,
        timeSpent
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assessments/user/history", async (req, res) => {
    try {
      const history = await assessmentAgent.getUserAssessmentHistory(req.user.id);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assessments/:id/results", async (req, res) => {
    try {
      const results = await assessmentAgent.getAssessmentResults(req.user.id, req.params.id);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Learning module routes
  app.get("/api/modules", async (req, res) => {
    try {
      const technology = req.query.technology as string;
      const modules = technology 
        ? await storage.getLearningModulesByTechnology(technology)
        : await storage.getLearningModules();
      res.json(modules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/modules/:id/progress", async (req, res) => {
    try {
      const { progress } = req.body;
      await trackerAgent.updateProgress(req.user.id, req.params.id, progress);
      res.json({ message: "Progress updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/progress", async (req, res) => {
    try {
      const progress = await trackerAgent.getUserProgress(req.user.id);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/progress/report", async (req, res) => {
    try {
      const timeframe = req.query.timeframe as 'week' | 'month' | 'quarter' || 'month';
      const report = await trackerAgent.generateProgressReport(req.user.id, timeframe);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Recommendation routes
  app.get("/api/recommendations", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recommendations = await recommenderAgent.getUserRecommendations(req.user.id, limit);
      res.json(recommendations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/recommendations/refresh", async (req, res) => {
    try {
      await recommenderAgent.refreshRecommendations(req.user.id);
      res.json({ message: "Recommendations refreshed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/recommendations/stats", async (req, res) => {
    try {
      const stats = await recommenderAgent.getRecommendationStats(req.user.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Hackathon routes
  app.get("/api/hackathons", async (req, res) => {
    try {
      const filter = req.query.filter as 'all' | 'active' | 'upcoming' | 'completed';
      const hackathons = await hackathonAgent.getHackathons(filter);
      res.json(hackathons);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/hackathons", async (req, res) => {
    try {
      const {
        title,
        description,
        theme,
        difficulty,
        startDate,
        endDate,
        registrationDeadline,
        maxParticipants
      } = req.body;

      const hackathonId = await hackathonAgent.createHackathon(
        req.user.id,
        title,
        description,
        theme,
        difficulty,
        new Date(startDate),
        new Date(endDate),
        new Date(registrationDeadline),
        maxParticipants
      );

      res.json({ hackathonId });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/hackathons/:id", async (req, res) => {
    try {
      const hackathon = await hackathonAgent.getHackathonDetails(req.params.id);
      res.json(hackathon);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/hackathons/:id/join", async (req, res) => {
    try {
      const { teamName } = req.body;
      await hackathonAgent.joinHackathon(req.params.id, req.user.id, teamName);
      res.json({ message: "Successfully joined hackathon" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/hackathons/:id/leaderboard", async (req, res) => {
    try {
      const leaderboard = await hackathonAgent.getLeaderboard(req.params.id);
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/hackathons/user/participated", async (req, res) => {
    try {
      const userHackathons = await hackathonAgent.getUserHackathons(req.user.id);
      res.json(userHackathons);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Alert routes
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getUserAlerts(req.user.id);
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/alerts/:id/read", async (req, res) => {
    try {
      await storage.markAlertAsRead(req.params.id);
      res.json({ message: "Alert marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard data endpoint
  app.get("/api/dashboard", async (req, res) => {
    try {
      const profileData = await profileAgent.getProfileWithStats(req.user.id);
      const recentAssessments = await assessmentAgent.getUserAssessmentHistory(req.user.id);
      const recommendations = await recommenderAgent.getUserRecommendations(req.user.id, 5);
      const progress = await trackerAgent.getUserProgress(req.user.id);
      const activeHackathons = await hackathonAgent.getHackathons('active');
      const upcomingHackathons = await hackathonAgent.getHackathons('upcoming');
      const alerts = await storage.getUserAlerts(req.user.id);

      res.json({
        profile: profileData?.profile,
        stats: profileData?.stats || {
          skillsAssessed: 0,
          avgScore: 0,
          learningHours: 0,
          totalAssessments: 0
        },
        recentAssessments: recentAssessments.slice(0, 3),
        recommendations: recommendations.slice(0, 2),
        skillProgress: progress.overview,
        activeHackathons: activeHackathons.slice(0, 2),
        upcomingHackathons: upcomingHackathons.slice(0, 2),
        alerts: alerts.filter(a => !a.read).slice(0, 5)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        username: string;
      };
    }
  }
}
