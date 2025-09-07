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

export interface AnalyticsSession {
  id: string
  title: string
  domain: string
  messages: Message[]
  createdAt: Date
  currentStep: "query" | "ambiguity" | "context" | "processing" | "completed"
}

export interface ProcessingStage {
  id: string
  name: string
  icon: string
  status: "completed" | "processing" | "queued" | "pending"
  progress: number
}
