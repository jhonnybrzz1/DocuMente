# DocuMente - Product Documentation Platform

## Overview

DocuMente is a product documentation platform that uses AI to generate structured business documents from user inputs. The application leverages the Mistral AI API to transform user requirements into various document types including PRDs, Epics, User Stories, and technical specifications. It features a modern React frontend with a Node.js/Express backend and supports document generation and download functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 18, 2025
- ✅ Complete DocuMente platform implementation
- ✅ Mistral AI integration with automatic API key configuration  
- ✅ 9 document types with structured templates
- ✅ Professional Word document generation with enhanced formatting
- ✅ Document history with search and filtering capabilities
- ✅ Resolved download functionality using window.location.href
- ✅ Enhanced document styling with company branding, colors, and proper spacing

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Document Generation**: docx library for Word document creation
- **Session Management**: Express sessions with PostgreSQL store

### Key Components

#### Frontend Components
- **App Header**: Main navigation and branding
- **API Key Configuration**: Mistral API key management
- **Document Input**: Text area for requirements input
- **Document Type Selector**: Grid of available document types
- **Generation Controls**: Preview and generate buttons
- **History Sidebar**: Document search and download history
- **Preview Modal**: Document preview before generation

#### Backend Components
- **Storage Layer**: Abstracted storage interface with in-memory implementation
- **Route Handlers**: API endpoints for document and API key management
- **Document Templates**: Predefined prompts for different document types
- **Mistral Integration**: AI-powered document generation

#### Document Types Supported
- PRD (Product Requirements Document)
- Epic Documentation
- User Stories
- Product Roadmap
- Release Notes
- Product Pitch
- Technical Specifications
- Test Plans
- API Documentation

## Data Flow

1. **User Input**: Users enter requirements and select document type
2. **API Key Validation**: System validates Mistral API connection
3. **Document Generation**: 
   - Preview: Generates content using Mistral API
   - Final: Creates and stores document with Word format
4. **Storage**: Documents stored with metadata (title, type, content, original demand)
5. **Download**: Documents converted to .docx format for download

## External Dependencies

### AI Integration
- **Mistral AI API**: Primary AI service for document generation
- **Document Templates**: Structured prompts for consistent output

### Database
- **PostgreSQL**: Primary data storage via Neon Database
- **Drizzle ORM**: Type-safe database operations
- **Connection**: Serverless connection pooling

### UI Framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **TailwindCSS**: Utility-first styling

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **TypeScript**: Strict type checking across the stack
- **Path Aliases**: Simplified imports with @ prefixes

### Production Build
- **Frontend**: Vite build with optimized bundles
- **Backend**: esbuild compilation to ESM format
- **Static Serving**: Express serves built frontend assets

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL
- **API Keys**: Mistral API key stored in database
- **Sessions**: PostgreSQL-backed session storage

### Architecture Decisions

#### Database Choice
- **Problem**: Need reliable data persistence for documents and API keys
- **Solution**: PostgreSQL with Drizzle ORM via Neon Database
- **Rationale**: Type-safe queries, excellent PostgreSQL compatibility, serverless scaling

#### AI Provider
- **Problem**: Generate structured business documents from user input
- **Solution**: Mistral AI API with custom templates
- **Rationale**: Cost-effective, good multilingual support, structured output capability

#### Frontend Framework
- **Problem**: Need modern, responsive UI with good developer experience
- **Solution**: React + Vite + shadcn/ui + TailwindCSS
- **Rationale**: Component reusability, excellent TypeScript support, rapid development

#### Document Format
- **Problem**: Professional document output required
- **Solution**: Microsoft Word (.docx) format via docx library
- **Rationale**: Universal compatibility, professional appearance, structured formatting

#### State Management
- **Problem**: Manage server state and caching
- **Solution**: React Query for server state, React useState for local state
- **Rationale**: Automatic caching, background updates, optimistic updates