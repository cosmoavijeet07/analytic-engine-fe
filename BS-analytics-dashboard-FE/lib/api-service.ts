/**
 * API Service Layer for Blue Sherpa Analytics Engine
 * Handles all backend API communications
 */

import { API_BASE_URL, API_ENDPOINTS, API_CONFIG, POLLING_INTERVALS } from './api'
import type {
  APIResponse,
  LoginRequest,
  AuthResponse,
  CreateSessionRequest,
  SessionData,
  CreateMessageRequest,
  MessageData,
  AmbiguityAnswerRequest,
  AmbiguityResolveRequest,
  ProcessingStartRequest,
  ProcessingStatus,
  ProcessingLog,
  AnalyticsResults,
  DomainsResponse,
  ModelsConfig,
  CreateShareRequest,
  ShareResponse
} from '@/types/api'

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`

    const requestOptions: RequestInit = {
      ...API_CONFIG,
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, requestOptions)
      const data = await response.json()

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          throw new Error('Authentication required')
        }
        throw new Error(data.error?.message || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Check if user is currently authenticated
  async checkAuthentication(): Promise<boolean> {
    try {
      await this.getProfile()
      return true
    } catch (error) {
      return false
    }
  }

  // Try to restore authentication using localStorage data
  async tryRestoreSession(): Promise<boolean> {
    try {
      const storedUser = localStorage.getItem('user')
      if (!storedUser) {
        return false
      }

      const userData = JSON.parse(storedUser)

      // Try to re-login with stored email (using dummy password)
      await this.login({
        email: userData.email,
        password: 'restore-session' // This will work since backend accepts any password
      })

      return true
    } catch (error) {
      console.error('Failed to restore session:', error)
      return false
    }
  }

  // Authentication APIs
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    )
    return response.data!
  }

  async logout(): Promise<void> {
    await this.makeRequest(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    })
  }

  async getProfile(): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>(API_ENDPOINTS.AUTH.PROFILE)
    return response.data!
  }

  // Session Management APIs
  async createSession(sessionData: CreateSessionRequest): Promise<SessionData> {
    const response = await this.makeRequest<{ session: SessionData }>(
      API_ENDPOINTS.SESSIONS.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(sessionData),
      }
    )
    return response.data!.session
  }

  async getSessions(search?: string): Promise<SessionData[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    const response = await this.makeRequest<{ sessions: SessionData[] }>(
      API_ENDPOINTS.SESSIONS.LIST + params
    )
    return response.data!.sessions
  }

  async getSession(sessionId: string): Promise<SessionData> {
    const response = await this.makeRequest<{ session: SessionData }>(
      API_ENDPOINTS.SESSIONS.DETAIL(sessionId)
    )
    return response.data!.session
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<SessionData> {
    const response = await this.makeRequest<{ session: SessionData }>(
      API_ENDPOINTS.SESSIONS.DETAIL(sessionId),
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    )
    return response.data!.session
  }

  // Message APIs
  async getMessages(sessionId: string): Promise<MessageData[]> {
    const response = await this.makeRequest<{ messages: MessageData[] }>(
      API_ENDPOINTS.MESSAGES.LIST(sessionId)
    )
    return response.data!.messages
  }

  async createMessage(sessionId: string, message: CreateMessageRequest): Promise<MessageData[]> {
    const response = await this.makeRequest<{ messages: MessageData[] }>(
      API_ENDPOINTS.MESSAGES.CREATE(sessionId),
      {
        method: 'POST',
        body: JSON.stringify(message),
      }
    )
    return response.data!.messages
  }

  // Ambiguity Resolution APIs
  async answerAmbiguityQuestion(sessionId: string, answer: AmbiguityAnswerRequest): Promise<any> {
    const response = await this.makeRequest(
      API_ENDPOINTS.AMBIGUITY.ANSWER(sessionId),
      {
        method: 'POST',
        body: JSON.stringify(answer),
      }
    )
    return response.data!
  }

  async getAmbiguityQuestions(sessionId: string): Promise<any> {
    const response = await this.makeRequest(
      API_ENDPOINTS.AMBIGUITY.QUESTIONS(sessionId)
    )
    return response
  }

  async resolveAmbiguity(sessionId: string, action: AmbiguityResolveRequest): Promise<any> {
    const response = await this.makeRequest(
      API_ENDPOINTS.AMBIGUITY.RESOLVE(sessionId),
      {
        method: 'POST',
        body: JSON.stringify(action),
      }
    )
    return response.data!
  }

  async getAmbiguityContext(sessionId: string): Promise<any> {
    const response = await this.makeRequest(
      API_ENDPOINTS.AMBIGUITY.CONTEXT(sessionId)
    )
    return response.data!
  }

  // Processing APIs
  async startProcessing(sessionId: string, config: ProcessingStartRequest): Promise<any> {
    const response = await this.makeRequest(
      API_ENDPOINTS.PROCESSING.START(sessionId),
      {
        method: 'POST',
        body: JSON.stringify(config),
      }
    )
    return response.data!
  }

  async getProcessingStatus(sessionId: string): Promise<ProcessingStatus> {
    const response = await this.makeRequest<ProcessingStatus>(
      API_ENDPOINTS.PROCESSING.STATUS(sessionId)
    )
    return response.data!
  }

  async stopProcessing(sessionId: string): Promise<any> {
    const response = await this.makeRequest(
      API_ENDPOINTS.PROCESSING.STOP(sessionId),
      {
        method: 'POST',
      }
    )
    return response.data!
  }

  async completeProcessing(sessionId: string): Promise<any> {
    const response = await this.makeRequest(
      API_ENDPOINTS.PROCESSING.COMPLETE(sessionId),
      {
        method: 'POST',
      }
    )
    return response.data!
  }

  async getProcessingLogs(sessionId: string): Promise<ProcessingLog[]> {
    const response = await this.makeRequest<{ logs: ProcessingLog[] }>(
      API_ENDPOINTS.PROCESSING.LOGS(sessionId)
    )
    return response.data!.logs
  }

  // Results APIs
  async getResults(sessionId: string): Promise<AnalyticsResults> {
    const response = await this.makeRequest<AnalyticsResults>(
      API_ENDPOINTS.RESULTS.GET(sessionId)
    )
    return response.data!
  }

  async verifyResults(sessionId: string): Promise<any> {
    const response = await this.makeRequest(
      API_ENDPOINTS.RESULTS.VERIFY(sessionId),
      {
        method: 'POST',
      }
    )
    return response.data!
  }

  // Configuration APIs
  async getDomains(): Promise<DomainsResponse> {
    const response = await this.makeRequest<DomainsResponse>(
      API_ENDPOINTS.CONFIG.DOMAINS
    )
    return response.data!
  }

  async createDomain(domain: { name: string; description?: string }): Promise<any> {
    const response = await this.makeRequest(
      API_ENDPOINTS.CONFIG.DOMAINS,
      {
        method: 'POST',
        body: JSON.stringify(domain),
      }
    )
    return response.data!
  }

  async getModelsConfig(): Promise<ModelsConfig> {
    const response = await this.makeRequest<ModelsConfig>(
      API_ENDPOINTS.CONFIG.MODELS
    )
    return response.data!
  }

  // Sharing APIs
  async createShareLink(shareData: CreateShareRequest): Promise<ShareResponse> {
    const response = await this.makeRequest<ShareResponse>(
      API_ENDPOINTS.SHARING.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(shareData),
      }
    )
    return response.data!
  }

  // Export APIs
  async exportPDF(sessionId: string): Promise<any> {
    const response = await this.makeRequest(
      API_ENDPOINTS.EXPORT.PDF(sessionId)
    )
    return response.data!
  }

  async exportLogs(sessionId: string, format: string = 'json'): Promise<any> {
    const response = await this.makeRequest(
      `${API_ENDPOINTS.EXPORT.LOGS(sessionId)}?format=${format}`
    )
    return response.data!
  }

  // Polling utilities
  startStatusPolling(
    sessionId: string,
    callback: (status: ProcessingStatus) => void,
    onError?: (error: Error) => void
  ): () => void {
    const interval = setInterval(async () => {
      try {
        const status = await this.getProcessingStatus(sessionId)
        callback(status)
        
        // Stop polling if processing is complete or failed
        if (status.status === 'completed' || status.status === 'stopped' || status.status === 'failed') {
          clearInterval(interval)
        }
      } catch (error) {
        onError?.(error as Error)
        clearInterval(interval)
      }
    }, POLLING_INTERVALS.PROCESSING_STATUS)

    // Return cleanup function
    return () => clearInterval(interval)
  }

  startLogsPolling(
    sessionId: string,
    callback: (logs: ProcessingLog[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const interval = setInterval(async () => {
      try {
        const logs = await this.getProcessingLogs(sessionId)
        callback(logs)
      } catch (error) {
        onError?.(error as Error)
      }
    }, POLLING_INTERVALS.LOGS_UPDATE)

    // Return cleanup function
    return () => clearInterval(interval)
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService