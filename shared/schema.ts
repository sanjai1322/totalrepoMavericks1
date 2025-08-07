import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  resumeData: jsonb("resume_data"), // Parsed resume content
  skills: jsonb("skills").$type<{skill: string, level: number, vectorScore: number}[]>().default([]),
  experience: text("experience"),
  education: text("education"),
  github: text("github"),
  linkedin: text("linkedin"),
  portfolio: text("portfolio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  technology: text("technology").notNull(),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  questions: jsonb("questions").$type<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }[]>().notNull(),
  timeLimit: integer("time_limit").notNull(), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAssessments = pgTable("user_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assessmentId: varchar("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  answers: jsonb("answers").$type<{questionId: string, selectedAnswer: number}[]>().notNull(),
  score: real("score").notNull(), // percentage
  correctAnswers: integer("correct_answers").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  timeSpent: integer("time_spent"), // in minutes
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const learningModules = pgTable("learning_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  technology: text("technology").notNull(),
  difficulty: text("difficulty").notNull(),
  duration: integer("duration").notNull(), // in hours
  rating: real("rating").default(0),
  content: jsonb("content"), // Learning materials, links, etc.
  prerequisites: text("prerequisites").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userModuleProgress = pgTable("user_module_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleId: varchar("module_id").notNull().references(() => learningModules.id, { onDelete: "cascade" }),
  progress: real("progress").default(0), // percentage
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
});

export const recommendations = pgTable("recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleId: varchar("module_id").notNull().references(() => learningModules.id, { onDelete: "cascade" }),
  score: real("score").notNull(), // recommendation confidence score
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hackathons = pgTable("hackathons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  theme: text("theme"),
  difficulty: text("difficulty").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  registrationDeadline: timestamp("registration_deadline").notNull(),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  challenges: jsonb("challenges").$type<{
    id: string;
    title: string;
    description: string;
    requirements: string[];
    points: number;
  }[]>().default([]),
  prizes: jsonb("prizes"),
  status: text("status").default("upcoming"), // upcoming, active, completed
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hackathonParticipants = pgTable("hackathon_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hackathonId: varchar("hackathon_id").notNull().references(() => hackathons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamName: text("team_name"),
  submission: jsonb("submission"),
  score: real("score"),
  rank: integer("rank"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const progressAlerts = pgTable("progress_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // stagnation, achievement, reminder
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  userAssessments: many(userAssessments),
  moduleProgress: many(userModuleProgress),
  recommendations: many(recommendations),
  hackathonParticipants: many(hackathonParticipants),
  createdHackathons: many(hackathons, { relationName: "creator" }),
  alerts: many(progressAlerts),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const assessmentsRelations = relations(assessments, ({ many }) => ({
  userAssessments: many(userAssessments),
}));

export const userAssessmentsRelations = relations(userAssessments, ({ one }) => ({
  user: one(users, { fields: [userAssessments.userId], references: [users.id] }),
  assessment: one(assessments, { fields: [userAssessments.assessmentId], references: [assessments.id] }),
}));

export const learningModulesRelations = relations(learningModules, ({ many }) => ({
  userProgress: many(userModuleProgress),
  recommendations: many(recommendations),
}));

export const userModuleProgressRelations = relations(userModuleProgress, ({ one }) => ({
  user: one(users, { fields: [userModuleProgress.userId], references: [users.id] }),
  module: one(learningModules, { fields: [userModuleProgress.moduleId], references: [learningModules.id] }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  user: one(users, { fields: [recommendations.userId], references: [users.id] }),
  module: one(learningModules, { fields: [recommendations.moduleId], references: [learningModules.id] }),
}));

export const hackathonsRelations = relations(hackathons, ({ one, many }) => ({
  creator: one(users, { fields: [hackathons.createdBy], references: [users.id], relationName: "creator" }),
  participants: many(hackathonParticipants),
}));

export const hackathonParticipantsRelations = relations(hackathonParticipants, ({ one }) => ({
  hackathon: one(hackathons, { fields: [hackathonParticipants.hackathonId], references: [hackathons.id] }),
  user: one(users, { fields: [hackathonParticipants.userId], references: [users.id] }),
}));

export const progressAlertsRelations = relations(progressAlerts, ({ one }) => ({
  user: one(users, { fields: [progressAlerts.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  avatar: true,
});

export const insertProfileSchema = createInsertSchema(profiles).pick({
  userId: true,
  resumeData: true,
  skills: true,
  experience: true,
  education: true,
  github: true,
  linkedin: true,
  portfolio: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  title: true,
  technology: true,
  difficulty: true,
  questions: true,
  timeLimit: true,
});

export const insertUserAssessmentSchema = createInsertSchema(userAssessments).pick({
  userId: true,
  assessmentId: true,
  answers: true,
  score: true,
  correctAnswers: true,
  totalQuestions: true,
  timeSpent: true,
});

export const insertLearningModuleSchema = createInsertSchema(learningModules).pick({
  title: true,
  description: true,
  technology: true,
  difficulty: true,
  duration: true,
  rating: true,
  content: true,
  prerequisites: true,
});

export const insertHackathonSchema = createInsertSchema(hackathons).pick({
  title: true,
  description: true,
  theme: true,
  difficulty: true,
  startDate: true,
  endDate: true,
  registrationDeadline: true,
  maxParticipants: true,
  challenges: true,
  prizes: true,
  createdBy: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertUserAssessment = z.infer<typeof insertUserAssessmentSchema>;
export type UserAssessment = typeof userAssessments.$inferSelect;
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;
export type LearningModule = typeof learningModules.$inferSelect;
export type UserModuleProgress = typeof userModuleProgress.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertHackathon = z.infer<typeof insertHackathonSchema>;
export type Hackathon = typeof hackathons.$inferSelect;
export type HackathonParticipant = typeof hackathonParticipants.$inferSelect;
export type ProgressAlert = typeof progressAlerts.$inferSelect;
