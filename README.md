
# DocuMente - Product Documentation Platform

## Table of Contents

- [Overview](#overview)
- [User Preferences](#user-preferences)
- [Recent Changes](#recent-changes)
- [System Architecture](#system-architecture)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
  - [Key Components](#key-components)
- [Data Flow](#data-flow)
- [External Dependencies](#external-dependencies)
- [Deployment Strategy](#deployment-strategy)

## Overview

DocuMente is a product documentation platform that uses AI to generate structured business documents from user inputs. The application leverages the Mistral AI API to transform user requirements into various document types including PRDs, Epics, User Stories, and technical specifications. It features a modern React frontend with a Node.js/Express backend and supports document generation and download functionality.

**Key Features:**
- AI-powered document generation
- 9+ document types supported
- Professional Word document output
- Document history and search
- Modern React frontend with TypeScript
- Node.js/Express backend with PostgreSQL

## User Preferences

We prefer to communicate using simple, everyday language to make our documentation accessible to everyone.

## Recent Changes

### July 18, 2025
- ✅ Complete DocuMente platform implementation
- ✅ Mistral AI integration with automatic API key configuration
- ✅ 9 document types with structured templates
- ✅ Professional Word document generation with enhanced formatting
- ✅ Document history with search and filtering capabilities
- ✅ Resolved download functionality using `window.location.href`
- ✅ Enhanced document styling with company branding, colors, and proper spacing

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state
- **Build Tool**: Vite with React plugin

**Example React Component:**
```typescript
// Example of a React component with TypeScript
const DocumentInput: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <textarea
      value={inputValue}
      onChange={handleChange}
      placeholder="Enter your requirements here..."
      className="w-full h-48 p-4 border rounded-md"
    />
  );
};
```

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Document Generation**: docx library for Word document creation
- **Session Management**: Express sessions with PostgreSQL store

**Example Express Route:**
```typescript
// Example Express route with TypeScript
import express from 'express';

const router = express.Router();

router.post('/generate-document', async (req, res) => {
  try {
    const { inputText, documentType } = req.body;
    // Process document generation
    const document = await generateDocument(inputText, documentType);
    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ error: 'Document generation failed' });
  }
});

export default router;
```

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

Here's how DocuMente works step-by-step:

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
