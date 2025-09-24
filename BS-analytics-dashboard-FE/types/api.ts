/**
 * API Response Types for Blue Sherpa Analytics Engine
 */

// Base API Response Structure
export interface APIResponse<T = any> {
  success: boolean
  timestamp: string
  data?: T
  error?: {
    message: string
    code: string
    status_code: number
  }
}

// Authentication Types
export interface LoginRequest {
  email: string
  password: string
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  profile_image?: string
}

export interface AuthResponse {
  message: string
  user: User
}

// Session Types
export interface CreateSessionRequest {
  title: string
  domain: string
}

export interface SessionData {
  id: string
  title: string
  domain: string
  created_at: string
  updated_at?: string
  current_step: 'query' | 'ambiguity' | 'context' | 'processing' | 'completed'
  status: 'active' | 'processing' | 'completed' | 'stopped'
  messages_count?: number
  messages?: MessageData[]
}

// Message Types
export interface MessageData {
  id: string
  type: 'user' | 'assistant' | 'ambiguity' | 'processing'
  content: string
  timestamp: string
  status?: 'completed' | 'processing' | 'confirmed' | 'waiting' | 'context_confirmation' | 'active'
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

export interface CreateMessageRequest {
  type: 'user'
  content: string
}

// Ambiguity Resolution Types
export interface AmbiguityQuestionsResponse {
  questions: string[]
  current_index: number
  answers: string[]
  status: 'active' | 'context_confirmation' | 'completed'
  total_questions: number
}

export interface AmbiguityAnswerRequest {
  answer: string
}

export interface AmbiguityResolveRequest {
  action: 'start_analysis' | 'continue_resolving'
}

export interface ContextSummary {
  domain_context: string
  scope: string
  regions: string
  metrics: string
}

// Processing Types
export interface ProcessingConfig {
  processing_time: number
  analytics_depth: 'basic' | 'moderate' | 'deep'
  reporting_style: 'executive' | 'detailed' | 'visual'
  cross_validation: 'low' | 'medium' | 'high'
}

export interface ProcessingStage {
  id: string
  name: string
  icon: string
  status: 'queued' | 'processing' | 'completed' | 'stopped' | 'cancelled'
  progress: number
  started_at?: string
  completed_at?: string
}

export interface ProcessingStatus {
  session_id: string
  status: 'initializing' | 'processing' | 'completed' | 'stopped' | 'failed'
  current_stage: number
  overall_progress: number
  stages: ProcessingStage[]
  started_at: string
  estimated_completion?: string
  config: ProcessingConfig
}

export interface ProcessingStartRequest {
  config: ProcessingConfig
}

export interface ProcessingLog {
  id: string
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

// Analytics Results Types
export interface AnalyticsResults {
  session_id: string
  results: {
    content: string
    format: 'markdown'
    config: ProcessingConfig
    metadata: {
      word_count: number
      sections: number
      domain: string
      generated_at: string
    }
  }
  generated_at: string
  verification_status: 'verified' | 'partial' | 'failed'
}

export interface VerificationResult {
  overall_status: 'verified' | 'partial' | 'failed'
  overall_confidence: number
  checks: Array<{
    name: string
    status: 'passed' | 'partial' | 'failed'
    confidence: number
  }>
  summary: string
}

// Configuration Types
export interface Domain {
  id: string
  name: string
  description: string
  usage_count: number
  created_at: string
}

export interface DomainsResponse {
  domains: Domain[]
  total_count: number
  default_domains: string[]
}

export interface CreateDomainRequest {
  name: string
  description?: string
}

export interface LLMModel {
  value: string
  label: string
}

export interface ModelsConfig {
  models: LLMModel[]
  default_model: string
  analysis_depths: string[]
  report_formats: string[]
  validation_levels: string[]
  processing_time_range: {
    min: number
    max: number
    default: number
  }
}

// Sharing Types
export interface CreateShareRequest {
  session_id: string
  access_level: 'VIEW' | 'COMMENT' | 'EDIT'
  emails?: string[]
}

export interface ShareResponse {
  message: string
  share_token: string
  share_url: string
  access_level: string
  expires_at: string
  invited_emails: string[]
  session: {
    id: string
    title: string
    domain: string
  }
}

export interface SharedSessionResponse {
  share_info: {
    token: string
    access_level: string
    accessed_count: number
    created_at: string
  }
  session: SessionData
  permissions: {
    can_view: boolean
    can_comment: boolean
    can_edit: boolean
  }
}

// Export Types
export interface ExportResponse {
  export_data: any
  filename: string
  format: string
  size: string
  download_ready?: boolean
  download_url?: string
  generated_at?: string
  expires_at?: string
}

// Error Types
export interface APIError {
  message: string
  code: string
  status_code: number
}

// Generic List Response
export interface ListResponse<T> {
  items: T[]
  total_count: number
  has_more?: boolean
  next_cursor?: string
}