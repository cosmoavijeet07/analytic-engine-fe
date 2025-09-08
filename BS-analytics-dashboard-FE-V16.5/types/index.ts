/**
 * Represents a message in the analytics conversation flow
 */
export interface Message {
  id: string
  type: "user" | "assistant" | "context" | "processing" | "ambiguity" | "cognitive" | "query"
  content: string
  timestamp: Date
  status?: "completed" | "processing" | "confirmed" | "waiting" | "context_confirmation" | "active"
  interactions?: number
  domain?: string
  scope?: string
  expanded?: boolean
  currentQuestion?: string
  answeredQuestions?: number
  totalQuestions?: number
  regions?: string
  metrics?: string
  conversationalContext?: string
}

/**
 * Represents an analytics session with conversation history
 */
export interface AnalyticsSession {
  id: string
  title: string
  domain: string
  messages: Message[]
  createdAt: Date
  currentStep: "query" | "ambiguity" | "context" | "processing" | "completed"
}

/**
 * Represents a processing stage in the analytics pipeline
 */
export interface ProcessingStage {
  id: string
  name: string
  icon: "Database" | "TrendingUp" | "Code" | "FileText"
  status: "completed" | "processing" | "queued" | "pending"
  progress: number
}

export type ConversationStep = AnalyticsSession["currentStep"]
export type MessageType = Message["type"]
export type ProcessingStatus = ProcessingStage["status"]

export const MESSAGE_TYPES = {
  USER: "user",
  ASSISTANT: "assistant",
  CONTEXT: "context",
  PROCESSING: "processing",
  AMBIGUITY: "ambiguity",
  COGNITIVE: "cognitive",
  QUERY: "query",
} as const

export const CONVERSATION_STEPS = {
  QUERY: "query",
  AMBIGUITY: "ambiguity",
  CONTEXT: "context",
  PROCESSING: "processing",
  COMPLETED: "completed",
} as const

export const PROCESSING_STATUSES = {
  COMPLETED: "completed",
  PROCESSING: "processing",
  QUEUED: "queued",
  PENDING: "pending",
} as const
