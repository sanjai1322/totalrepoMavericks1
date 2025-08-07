import { 
  users, profiles, assessments, userAssessments, learningModules, 
  userModuleProgress, recommendations, hackathons, hackathonParticipants, progressAlerts,
  type User, type InsertUser, type Profile, type InsertProfile,
  type Assessment, type InsertAssessment, type UserAssessment, type InsertUserAssessment,
  type LearningModule, type InsertLearningModule, type UserModuleProgress,
  type Recommendation, type Hackathon, type InsertHackathon, type HackathonParticipant,
  type ProgressAlert
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  // Assessment operations
  getAssessments(): Promise<Assessment[]>;
  getAssessmentsByTechnology(technology: string): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getUserAssessments(userId: string): Promise<(UserAssessment & { assessment: Assessment })[]>;
  createUserAssessment(userAssessment: InsertUserAssessment): Promise<UserAssessment>;
  
  // Learning module operations
  getLearningModules(): Promise<LearningModule[]>;
  getLearningModulesByTechnology(technology: string): Promise<LearningModule[]>;
  createLearningModule(module: InsertLearningModule): Promise<LearningModule>;
  getUserModuleProgress(userId: string): Promise<(UserModuleProgress & { module: LearningModule })[]>;
  updateModuleProgress(userId: string, moduleId: string, progress: number): Promise<UserModuleProgress | undefined>;
  
  // Recommendation operations
  getUserRecommendations(userId: string): Promise<(Recommendation & { module: LearningModule })[]>;
  createRecommendation(userId: string, moduleId: string, score: number, reason: string): Promise<Recommendation>;
  
  // Hackathon operations
  getHackathons(): Promise<Hackathon[]>;
  getActiveHackathons(): Promise<Hackathon[]>;
  createHackathon(hackathon: InsertHackathon): Promise<Hackathon>;
  joinHackathon(hackathonId: string, userId: string, teamName?: string): Promise<HackathonParticipant>;
  getHackathonParticipants(hackathonId: string): Promise<(HackathonParticipant & { user: User })[]>;
  
  // Progress alerts
  getUserAlerts(userId: string): Promise<ProgressAlert[]>;
  createAlert(userId: string, type: string, message: string): Promise<ProgressAlert>;
  markAlertAsRead(alertId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile || undefined;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [updatedProfile] = await db
      .update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return updatedProfile || undefined;
  }

  async getAssessments(): Promise<Assessment[]> {
    return await db.select().from(assessments).orderBy(desc(assessments.createdAt));
  }

  async getAssessmentsByTechnology(technology: string): Promise<Assessment[]> {
    return await db.select().from(assessments)
      .where(eq(assessments.technology, technology))
      .orderBy(desc(assessments.createdAt));
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db.insert(assessments).values(assessment).returning();
    return newAssessment;
  }

  async getUserAssessments(userId: string): Promise<(UserAssessment & { assessment: Assessment })[]> {
    const results = await db
      .select()
      .from(userAssessments)
      .innerJoin(assessments, eq(userAssessments.assessmentId, assessments.id))
      .where(eq(userAssessments.userId, userId))
      .orderBy(desc(userAssessments.completedAt));
    
    return results.map(result => ({
      ...result.user_assessments,
      assessment: result.assessments
    }));
  }

  async createUserAssessment(userAssessment: InsertUserAssessment): Promise<UserAssessment> {
    const [newUserAssessment] = await db.insert(userAssessments).values(userAssessment).returning();
    return newUserAssessment;
  }

  async getLearningModules(): Promise<LearningModule[]> {
    return await db.select().from(learningModules).orderBy(desc(learningModules.rating));
  }

  async getLearningModulesByTechnology(technology: string): Promise<LearningModule[]> {
    return await db.select().from(learningModules)
      .where(eq(learningModules.technology, technology))
      .orderBy(desc(learningModules.rating));
  }

  async createLearningModule(module: InsertLearningModule): Promise<LearningModule> {
    const [newModule] = await db.insert(learningModules).values(module).returning();
    return newModule;
  }

  async getUserModuleProgress(userId: string): Promise<(UserModuleProgress & { module: LearningModule })[]> {
    const results = await db
      .select()
      .from(userModuleProgress)
      .innerJoin(learningModules, eq(userModuleProgress.moduleId, learningModules.id))
      .where(eq(userModuleProgress.userId, userId))
      .orderBy(desc(userModuleProgress.lastAccessedAt));
    
    return results.map(result => ({
      ...result.user_module_progress,
      module: result.learning_modules
    }));
  }

  async updateModuleProgress(userId: string, moduleId: string, progress: number): Promise<UserModuleProgress | undefined> {
    const [existingProgress] = await db
      .select()
      .from(userModuleProgress)
      .where(and(eq(userModuleProgress.userId, userId), eq(userModuleProgress.moduleId, moduleId)));

    if (existingProgress) {
      const [updated] = await db
        .update(userModuleProgress)
        .set({ 
          progress, 
          lastAccessedAt: new Date(),
          completedAt: progress >= 100 ? new Date() : null 
        })
        .where(and(eq(userModuleProgress.userId, userId), eq(userModuleProgress.moduleId, moduleId)))
        .returning();
      return updated;
    } else {
      const [newProgress] = await db
        .insert(userModuleProgress)
        .values({ 
          userId, 
          moduleId, 
          progress,
          completedAt: progress >= 100 ? new Date() : null 
        })
        .returning();
      return newProgress;
    }
  }

  async getUserRecommendations(userId: string): Promise<(Recommendation & { module: LearningModule })[]> {
    const results = await db
      .select()
      .from(recommendations)
      .innerJoin(learningModules, eq(recommendations.moduleId, learningModules.id))
      .where(eq(recommendations.userId, userId))
      .orderBy(desc(recommendations.score));
    
    return results.map(result => ({
      ...result.recommendations,
      module: result.learning_modules
    }));
  }

  async createRecommendation(userId: string, moduleId: string, score: number, reason: string): Promise<Recommendation> {
    const [recommendation] = await db
      .insert(recommendations)
      .values({ userId, moduleId, score, reason })
      .returning();
    return recommendation;
  }

  async getHackathons(): Promise<Hackathon[]> {
    return await db.select().from(hackathons).orderBy(desc(hackathons.createdAt));
  }

  async getActiveHackathons(): Promise<Hackathon[]> {
    const now = new Date();
    return await db.select().from(hackathons)
      .where(and(
        lte(hackathons.startDate, now),
        gte(hackathons.endDate, now)
      ))
      .orderBy(desc(hackathons.createdAt));
  }

  async createHackathon(hackathon: InsertHackathon): Promise<Hackathon> {
    const [newHackathon] = await db.insert(hackathons).values(hackathon).returning();
    return newHackathon;
  }

  async joinHackathon(hackathonId: string, userId: string, teamName?: string): Promise<HackathonParticipant> {
    // Check if user already joined
    const [existing] = await db
      .select()
      .from(hackathonParticipants)
      .where(and(eq(hackathonParticipants.hackathonId, hackathonId), eq(hackathonParticipants.userId, userId)));
    
    if (existing) {
      throw new Error("User already joined this hackathon");
    }

    // Increment participant count
    await db
      .update(hackathons)
      .set({ currentParticipants: sql`${hackathons.currentParticipants} + 1` })
      .where(eq(hackathons.id, hackathonId));

    const [participant] = await db
      .insert(hackathonParticipants)
      .values({ hackathonId, userId, teamName })
      .returning();
    
    return participant;
  }

  async getHackathonParticipants(hackathonId: string): Promise<(HackathonParticipant & { user: User })[]> {
    const results = await db
      .select()
      .from(hackathonParticipants)
      .innerJoin(users, eq(hackathonParticipants.userId, users.id))
      .where(eq(hackathonParticipants.hackathonId, hackathonId))
      .orderBy(desc(hackathonParticipants.joinedAt));
    
    return results.map(result => ({
      ...result.hackathon_participants,
      user: result.users
    }));
  }

  async getUserAlerts(userId: string): Promise<ProgressAlert[]> {
    return await db
      .select()
      .from(progressAlerts)
      .where(eq(progressAlerts.userId, userId))
      .orderBy(desc(progressAlerts.createdAt));
  }

  async createAlert(userId: string, type: string, message: string): Promise<ProgressAlert> {
    const [alert] = await db
      .insert(progressAlerts)
      .values({ userId, type, message })
      .returning();
    return alert;
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    await db
      .update(progressAlerts)
      .set({ read: true })
      .where(eq(progressAlerts.id, alertId));
  }
}

export const storage = new DatabaseStorage();
