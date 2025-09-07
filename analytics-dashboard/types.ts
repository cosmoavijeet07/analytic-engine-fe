export interface Message {
  id: string
  type: "user" | "assistant" | "ambiguity"
  content: string
  timestamp: Date
  status?: "active" | "completed" | "context_confirmation"
  currentQuestion?: string
  expanded?: boolean
  answeredQuestions?: number
  totalQuestions?: number
  interactions?: number
}

export interface ProcessingStage {
  id: string
  name: string
  icon: "Database" | "TrendingUp" | "Code" | "FileText"
  status: "queued" | "processing" | "completed"
  progress: number
}

export interface AnalyticsSession {
  id: string
  title: string
  domain: string
  messages: Message[]
  createdAt: Date
  currentStep: "query" | "ambiguity" | "context" | "processing" | "completed"
}
