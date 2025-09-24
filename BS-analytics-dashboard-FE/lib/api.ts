/**
 * API Configuration for Blue Sherpa Analytics Engine
 */

// API Base URL - Change based on environment
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-backend.com/api'
  : 'http://localhost:5000/api'

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  
  // Sessions
  SESSIONS: {
    CREATE: '/sessions/create',
    LIST: '/sessions/list',
    DETAIL: (id: string) => `/sessions/${id}`,
  },
  
  // Messages
  MESSAGES: {
    LIST: (sessionId: string) => `/sessions/${sessionId}/messages`,
    CREATE: (sessionId: string) => `/sessions/${sessionId}/messages/create`,
  },
  
  // Ambiguity Resolution
  AMBIGUITY: {
    RESOLVE: (sessionId: string) => `/ambiguity/resolve/${sessionId}`,
    QUESTIONS: (sessionId: string) => `/ambiguity/questions/${sessionId}`,
    ANSWER: (sessionId: string) => `/ambiguity/answer/${sessionId}`,
    CONTEXT: (sessionId: string) => `/ambiguity/context/${sessionId}`,
  },
  
  // Processing
  PROCESSING: {
    START: (sessionId: string) => `/processing/start/${sessionId}`,
    STATUS: (sessionId: string) => `/processing/status/${sessionId}`,
    STOP: (sessionId: string) => `/processing/stop/${sessionId}`,
    COMPLETE: (sessionId: string) => `/processing/complete/${sessionId}`,
    LOGS: (sessionId: string) => `/processing/logs/${sessionId}`,
  },
  
  // Results
  RESULTS: {
    GET: (sessionId: string) => `/results/${sessionId}`,
    EXPORT: (sessionId: string) => `/results/${sessionId}/export`,
    VERIFY: (sessionId: string) => `/results/${sessionId}/verify`,
  },
  
  // Configuration
  CONFIG: {
    DOMAINS: '/config/domains',
    MODELS: '/config/models',
  },
  
  // Sharing
  SHARING: {
    CREATE: '/share/create',
    ACCESS: (token: string) => `/share/${token}`,
  },
  
  // Export
  EXPORT: {
    PDF: (sessionId: string) => `/export/${sessionId}/pdf`,
    LOGS: (sessionId: string) => `/export/${sessionId}/logs`,
  },
}

// Request configuration - FIXED for credentials

export const API_CONFIG = {

  headers: {

    'Content-Type': 'application/json',

    'Accept': 'application/json',

  },

  credentials: 'include' as RequestCredentials, // This requires specific CORS setup

  mode: 'cors' as RequestMode, // Explicitly set CORS mode

}
// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  PROCESSING_STATUS: 2000, // 2 seconds
  LOGS_UPDATE: 1000,       // 1 second
}

// Request timeout (in milliseconds)
export const REQUEST_TIMEOUT = 300000// 300 Seconds