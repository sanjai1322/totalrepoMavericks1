# DevSkill - Developer Learning Platform

## Overview

DevSkill is a comprehensive full-stack application designed to help developers assess, track, and improve their technical skills. The platform provides AI-powered skill assessments, personalized learning recommendations, progress tracking, and gamification through hackathons. Built with modern web technologies, it offers a seamless experience for developers to enhance their coding abilities and career prospects.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with **React 18** and **TypeScript**, utilizing modern patterns and tools:
- **Component Library**: Shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
The server follows a **Node.js/Express** RESTful API pattern with TypeScript:
- **Framework**: Express.js with middleware for logging, error handling, and file uploads
- **Agent Pattern**: Business logic is organized into specialized agents (ProfileAgent, AssessmentAgent, RecommenderAgent, TrackerAgent, HackathonAgent)
- **File Processing**: Multer for handling resume uploads with validation
- **API Design**: RESTful endpoints with proper error handling and response formatting

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL via Neon serverless with connection pooling
- **Schema**: Comprehensive relational schema covering users, profiles, assessments, learning modules, recommendations, hackathons, and progress tracking
- **Migrations**: Drizzle migrations for schema versioning

### Data Models
Key entities include:
- **Users**: Authentication and basic user information
- **Profiles**: Skill data, resume information, and social links
- **Assessments**: AI-generated questions with difficulty levels and time limits
- **Learning Modules**: Structured learning content with progress tracking
- **Recommendations**: AI-powered personalized learning suggestions
- **Hackathons**: Competitive events with challenges and participants

### AI Integration
- **AI Client**: OpenRouter integration with GPT-3.5-turbo for reliable AI processing
- **Capabilities**: Resume parsing, assessment generation, recommendation algorithms, and hackathon challenge creation
- **Use Cases**: Skill extraction from resumes with confidence scores, dynamic assessment creation, personalized learning paths
- **Recent Update**: Migrated from Moonshot/Kimi to OpenRouter GPT-3.5-turbo for improved reliability and structured JSON responses

### Authentication & Session Management
- **Mock Authentication**: Development-ready user session system
- **Session Storage**: PostgreSQL-based session management
- **User Context**: Request-level user identification for API operations

### File Upload System
- **Storage**: Memory-based file processing for resumes
- **Validation**: File type restrictions (PDF/text) and size limits
- **Processing**: Text extraction and AI-powered parsing

## External Dependencies

### Core Runtime Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **express**: Web application framework with middleware support
- **axios**: HTTP client for external API communications

### Frontend Dependencies
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form state management with validation
- **@hookform/resolvers**: Form validation resolvers for Zod integration
- **wouter**: Minimalist routing library for React

### UI and Styling
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for component styling
- **clsx**: Conditional className utility
- **lucide-react**: Icon library with React components

### Development and Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking and enhanced developer experience
- **drizzle-kit**: Database migration and introspection tools
- **tsx**: TypeScript execution environment for Node.js

### AI and External Services
- **OpenRouter API**: External AI service providing access to OpenAI GPT-3.5-turbo for natural language processing, assessment generation, and recommendation algorithms
- **Environment Variable**: OPENROUTER_API_KEY for secure API access

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **multer**: File upload middleware for Express
- **zod**: Runtime type validation and schema definition
- **nanoid**: URL-safe unique string ID generation