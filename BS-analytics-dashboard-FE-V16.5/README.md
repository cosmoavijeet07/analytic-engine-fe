# Prerequisites

- Node.js 18.17 or later
- pnpm (recommended) or npm

# Installation

1. **Open the repository**
   ```bash
   cd BS-analytics-dashboard-FE-V16.5
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Open your browser**  
   Navigate to [http://localhost:3000](http://localhost:3000)

# Build for Production

```bash
pnpm build
pnpm start
```

# 📁 Project Structure

```
analytics-dashboard/
├── app/                          # Next.js App Router
│   ├── dashboard/                # Dashboard pages
│   │   ├── page.tsx              # Main dashboard page
│   │   └── loading.tsx           # Dashboard loading UI
│   ├── login/                    # Authentication
│   │   └── page.tsx              # Login page
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page (redirects to login)
│   ├── loading.tsx               # Global loading component
│   └── globals.css               # Global styles and CSS variables
├── components/                   # React components
│   ├── ui/                       # shadcn/ui component library (40+ components)
│   │   ├── button.tsx            # Button component with variants
│   │   ├── card.tsx              # Card layout component
│   │   ├── input.tsx             # Form input component
│   │   ├── dialog.tsx            # Modal dialog component
│   │   └── ...                   # Complete UI component library
│   ├── analytics-dashboard.tsx   # Main dashboard component
│   ├── header.tsx                # Application header
│   ├── left-panel.tsx            # Left sidebar navigation
│   ├── right-panel.tsx           # Right sidebar content
│   ├── main-content.tsx          # Central content area
│   ├── conversation-area.tsx     # Chat interface
│   ├── message-list.tsx          # Message display list
│   ├── message-input.tsx         # Message input field
│   ├── user-message.tsx          # User message component
│   ├── assistant-message.tsx     # AI assistant message component
│   ├── new-analysis-form.tsx     # Analysis creation form
│   └── theme-provider.tsx        # Theme context provider
├── hooks/                        # Custom React hooks
│   ├── use-mobile.ts             # Mobile breakpoint detection
│   └── use-toast.ts              # Toast notification management
├── lib/                          # Utility functions
│   └── utils.ts                  # Common utilities (cn function)
├── types/                        # TypeScript type definitions
│   ├── index.ts                  # Main application types
│   └── analytics.ts              # Analytics-specific types
├── public/                       # Static assets
│   ├── placeholder-logo.png      # Logo placeholder
│   ├── placeholder-user.jpg      # User avatar placeholder
│   └── placeholder.svg           # General placeholder images
├── styles/                       # Additional stylesheets
│   └── globals.css               # Alternative global styles
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── next.config.mjs               # Next.js configuration
├── components.json               # shadcn/ui configuration
├── postcss.config.mjs            # PostCSS configuration
└── README.md                     # This file
```

# 🛠️ Technology Stack

## Core Framework
- **Next.js 14.2.25** - React framework with App Router
- **React 18** - UI library with latest features
- **TypeScript 5** - Type-safe JavaScript

## Styling & UI
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library built on Radix UI
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Beautiful & consistent icon library
- **Class Variance Authority** - Component variant management
- **Next Themes** - Theme switching (dark/light mode)

## Forms & Validation
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation

## Data Visualization
- **Recharts** - Composable charting library for React

## Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Vercel Analytics** - Performance monitoring

# 🎨 Design System

## Typography
- **Primary Font**: Inter (sans-serif)
- **Monospace Font**: Space Mono
- Responsive typography with fluid scaling

## Color Scheme
- **Theme Support**: Light and dark modes
- **CSS Variables**: Semantic color tokens
- **Accessibility**: WCAG compliant contrast ratios

## Components
- **40+ UI Components**: Complete design system
- **Consistent Variants**: Size, color, and state variations
- **Accessibility**: Screen reader and keyboard navigation support

# 🏗️ Architecture

## Component Structure

```
Analytics Dashboard (Main App)
├── Header (Navigation & User Controls)
├── Left Panel (Navigation Sidebar)
├── Main Content Area
│   ├── Conversation Area
│   │   ├── Message List
│   │   ├── User Messages
│   │   ├── Assistant Messages
│   │   └── Message Input
│   └── Analysis Forms
└── Right Panel (Additional Tools)
```

## State Management
- **React Context** - Theme and global state
- **React Hooks** - Local component state
- **Custom Hooks** - Reusable stateful logic

## Routing
- **App Router** - Next.js 13+ file-based routing
- **Server Components** - Default server-side rendering
- **Client Components** - Interactive UI components

# 🔧 Configuration Files

## `next.config.mjs`
Next.js configuration with build optimizations and experimental features.

## `tsconfig.json`
TypeScript configuration with path aliases and strict type checking.

## `components.json`
shadcn/ui configuration for component generation and theming.

## `postcss.config.mjs`
PostCSS configuration for Tailwind CSS processing.

## `package.json`
Project dependencies, scripts, and metadata.

# 🚀 Development

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
# pnpm type-check   # Run TypeScript compiler
```

## Adding New Components

```bash
# Add shadcn/ui components
npx shadcn@latest add [component-name]

# Example: Add a new dialog component
npx shadcn@latest add dialog
```

## Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Add other environment variables as needed
```

# 📊 File Purposes

## Core Application Files
- **`app/layout.tsx`** - Root layout with theme provider and font configuration
- **`app/page.tsx`** - Home page that redirects to login
- **`components/analytics-dashboard.tsx`** - Main dashboard component with panels
- **`components/header.tsx`** - Application header with dynamic width adjustment

## Message System
- **`components/conversation-area.tsx`** - Chat interface container
- **`components/message-list.tsx`** - Scrollable message display
- **`components/user-message.tsx`** - User message styling and layout
- **`components/assistant-message.tsx`** - AI response formatting

## UI Infrastructure
- **`components/theme-provider.tsx`** - Theme context and switching logic
- **`hooks/use-mobile.ts`** - Responsive breakpoint detection
- **`hooks/use-toast.ts`** - Toast notification system
- **`lib/utils.ts`** - Utility functions including className merging

## Type Safety
- **`types/index.ts`** - Core application type definitions
- **`types/analytics.ts`** - Analytics-specific interfaces
