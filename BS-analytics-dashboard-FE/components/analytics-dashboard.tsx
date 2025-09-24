// Fixed analytics-dashboard.tsx - Message handling and conversation flow
"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { LeftPanel } from "./left-panel"
import { RightPanel } from "./right-panel"
import { MainContent } from "./main-content"
import { DashboardHeader } from "./header"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api-service"
import type { AnalyticsSession, Message, ProcessingStage } from "@/types"
import type { SessionData, MessageData, ProcessingStatus, ProcessingLog } from "@/types/api"
import { CONVERSATION_STEPS, MESSAGE_TYPES, PROCESSING_STATUSES } from "@/types"

// Convert API types to frontend types
const convertSessionData = (sessionData: SessionData): AnalyticsSession => ({
  id: sessionData.id,
  title: sessionData.title,
  domain: sessionData.domain,
  messages: (sessionData.messages || []).map(convertMessageData),
  createdAt: new Date(sessionData.created_at),
  currentStep: sessionData.current_step as any,
})

const convertMessageData = (messageData: MessageData): Message => ({
  id: messageData.id,
  type: messageData.type as any,
  content: messageData.content,
  timestamp: new Date(messageData.timestamp),
  status: messageData.status as any,
  interactions: messageData.interactions,
  domain: messageData.domain,
  scope: messageData.scope,
  expanded: messageData.expanded,
  currentQuestion: messageData.currentQuestion,
  answeredQuestions: messageData.answeredQuestions,
  totalQuestions: messageData.totalQuestions,
  regions: messageData.regions,
  metrics: messageData.metrics,
  conversationalContext: messageData.conversationalContext,
})

const convertProcessingStatus = (status: ProcessingStatus): ProcessingStage[] => {
  return status.stages.map(stage => ({
    id: stage.id,
    name: stage.name,
    icon: stage.icon as any,
    status: stage.status as any,
    progress: stage.progress,
  }))
}

// Individual conversation state structure
interface ConversationState {
  step: keyof typeof CONVERSATION_STEPS
  ambiguityQuestions: string[]
  currentQuestionIndex: number
  ambiguityAnswers: string[]
  awaitingUserResponse: boolean
  contextConfirmationActive: boolean
  clickedButton: string | null
  processingStages: ProcessingStage[]
  isProcessing: boolean
  isConversationEnded: boolean
  processingPollCleanup?: () => void
  logsPollCleanup?: () => void
}

// Create fresh conversation state
const createFreshConversationState = (): ConversationState => ({
  step: CONVERSATION_STEPS.QUERY,
  ambiguityQuestions: [],
  currentQuestionIndex: 0,
  ambiguityAnswers: [],
  awaitingUserResponse: false,
  contextConfirmationActive: false,
  clickedButton: null,
  processingStages: [],
  isProcessing: false,
  isConversationEnded: false,
})

export default function AnalyticsDashboard() {
  const { toast } = useToast()
  
  const [panelState, setPanelState] = useState({
    leftOpen: true,
    rightOpen: true,
  })

  // Sessions list - loaded from backend
  const [sessions, setSessions] = useState<AnalyticsSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Dictionary of conversation states by session ID
  const [conversationStates, setConversationStates] = useState<Record<string, ConversationState>>({})

  // Track all questions and answers per session
  const [sessionQuestionsAnswers, setSessionQuestionsAnswers] = useState<Record<string, {
    allQuestions: string[],
    allAnswers: string[]
  }>>({})

  const [uiState, setUiState] = useState({
    isDarkMode: false,
    controlsDisabled: false,
  })

  const [controlSettings, setControlSettings] = useState({
    processingTime: 5,
    analyticsDepth: "moderate" as "basic" | "moderate" | "deep",
    reportingStyle: "detailed" as "executive" | "detailed" | "visual",
    crossValidation: "medium" as "low" | "medium" | "high",
    showAdvancedSettings: false,
    autoSave: true,
    realTimeUpdates: false,
  })

  const [formState, setFormState] = useState({
    analysisTitle: "",
    analysisDomain: "",
    currentMessage: "",
  })

  const [searchQuery, setSearchQuery] = useState("")

  // Get current session and its state
  const currentSession = useMemo(() => 
    sessions.find(s => s.id === currentSessionId) || null, 
    [sessions, currentSessionId]
  )

  const currentConversationState = useMemo(() => {
    if (!currentSessionId) return createFreshConversationState()

    const baseState = conversationStates[currentSessionId] || createFreshConversationState()
    const sessionQA = sessionQuestionsAnswers[currentSessionId] || { allQuestions: [], allAnswers: [] }

    // Merge with tracked Q&A data
    return {
      ...baseState,
      ambiguityQuestions: sessionQA.allQuestions.length > 0 ? sessionQA.allQuestions : baseState.ambiguityQuestions,
      ambiguityAnswers: sessionQA.allAnswers.length > 0 ? sessionQA.allAnswers : baseState.ambiguityAnswers,
    }
  }, [conversationStates, currentSessionId, sessionQuestionsAnswers])

  // Load sessions on component mount - with proper authentication check
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First check if we have localStorage user data
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
          throw new Error('No stored user data')
        }

        // Check if we have a valid server session
        await apiService.getProfile()

        // If profile check succeeds, we're authenticated - load data
        loadSessions()
      } catch (error) {
        console.warn("Initial authentication check failed:", error)

        // Try to restore session using localStorage data
        try {
          const restored = await apiService.tryRestoreSession()
          if (restored) {
            console.log("Session restored successfully")
            loadSessions()
            return
          }
        } catch (restoreError) {
          console.warn("Session restoration failed:", restoreError)
        }

        // If restoration fails, clear data and redirect to login
        localStorage.removeItem('user')

        if (!window.location.pathname.includes('/login')) {
          console.log("Redirecting to login due to authentication failure")
          window.location.href = '/login'
        }
      }
    }

    initializeApp()
  }, [])

  const loadSessions = async () => {
    try {
      const sessionsData = await apiService.getSessions()
      const convertedSessions = sessionsData.map(convertSessionData)
      setSessions(convertedSessions)
    } catch (error) {
      console.error("Failed to load sessions:", error)
      toast({
        title: "Failed to load sessions",
        description: "Please refresh the page to try again.",
        variant: "destructive",
      })
    }
  }

  const toggleTheme = useCallback(() => {
    setUiState((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }))
    document.documentElement.classList.toggle("dark")
  }, [])

  // Update conversation state for specific session
  const updateConversationState = useCallback((sessionId: string, updates: Partial<ConversationState>) => {
    setConversationStates(prev => ({
      ...prev,
      [sessionId]: {
        ...(prev[sessionId] || createFreshConversationState()),
        ...updates
      }
    }))
  }, [])

  // Update session data
  const updateSession = useCallback((sessionId: string, updates: Partial<AnalyticsSession>) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId ? { ...session, ...updates } : session
    ))
  }, [])

  const handleStartNewAnalysis = async () => {
    if (!formState.analysisTitle || !formState.analysisDomain) return

    setIsLoading(true)
    try {
      const sessionData = await apiService.createSession({
        title: formState.analysisTitle,
        domain: formState.analysisDomain,
      })

      const newSession = convertSessionData(sessionData)
      
      // Add new session to sessions list
      setSessions(prev => [newSession, ...prev])
      
      // Create fresh conversation state for this session
      setConversationStates(prev => ({
        ...prev,
        [sessionData.id]: createFreshConversationState()
      }))
      
      // Set as current session
      setCurrentSessionId(sessionData.id)
      setShowNewForm(false)
      setFormState((prev) => ({ ...prev, analysisTitle: "", analysisDomain: "" }))

      toast({
        title: "Session Created",
        description: `New analytics session "${formState.analysisTitle}" has been created.`,
      })
    } catch (error) {
      console.error("Failed to create session:", error)
      toast({
        title: "Failed to create session",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // FIXED: Enhanced message handling with proper state updates
  const handleSendMessage = async () => {
    if (!formState.currentMessage.trim() || !currentSession || !currentSessionId) return

    setIsLoading(true)
    console.log("Sending message:", formState.currentMessage)
    
    try {
      // Clear the message input immediately for better UX
      const messageContent = formState.currentMessage.trim()
      setFormState((prev) => ({ ...prev, currentMessage: "" }))
      
      const messages = await apiService.createMessage(currentSessionId, {
        type: 'user',
        content: messageContent
      })

      console.log("Received messages from API:", messages)

      // Update session messages - FIXED: Properly handle all returned messages
      const convertedMessages = messages.map(convertMessageData)
      updateSession(currentSessionId, { messages: convertedMessages })
      
      // FIXED: Update conversation state based on the last message type
      const lastMessage = messages[messages.length - 1]
      console.log("Last message type:", lastMessage.type, "Status:", lastMessage.status)
      
      if (lastMessage.type === 'ambiguity') {
        console.log("Processing ambiguity message:", lastMessage)

        // Initialize or update session Q&A tracking
        const currentSessionQA = sessionQuestionsAnswers[currentSessionId] || {
          allQuestions: [],
          allAnswers: []
        }

        // Add current question if not already present
        if (lastMessage.currentQuestion && !currentSessionQA.allQuestions.includes(lastMessage.currentQuestion)) {
          currentSessionQA.allQuestions.push(lastMessage.currentQuestion)
          console.log("Added new question to tracking:", lastMessage.currentQuestion)
        }

        setSessionQuestionsAnswers(prev => ({
          ...prev,
          [currentSessionId]: currentSessionQA
        }))

        updateConversationState(currentSessionId, {
          step: CONVERSATION_STEPS.AMBIGUITY,
          awaitingUserResponse: true,
          ambiguityQuestions: currentSessionQA.allQuestions,
          currentQuestionIndex: Math.max(0, (lastMessage.answeredQuestions || 0)),
          ambiguityAnswers: currentSessionQA.allAnswers,
        })

        console.log("Updated to ambiguity step with Q&A:", currentSessionQA)
      }

      toast({
        title: "Message sent",
        description: "Your message has been processed.",
      })
    } catch (error) {
      console.error("Failed to send message:", error)
      // Restore the message if sending failed
      setFormState((prev) => ({ ...prev, currentMessage: formState.currentMessage }))
      
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAmbiguityAnswer = async (answer: string) => {
    if (!currentSessionId) return

    console.log("Submitting ambiguity answer:", answer)

    try {
      // Update session Q&A tracking immediately
      const currentSessionQA = sessionQuestionsAnswers[currentSessionId] || {
        allQuestions: [],
        allAnswers: []
      }

      // Add answer to tracking
      const updatedQA = {
        allQuestions: [...currentSessionQA.allQuestions],
        allAnswers: [...currentSessionQA.allAnswers, answer]
      }

      setSessionQuestionsAnswers(prev => ({
        ...prev,
        [currentSessionId]: updatedQA
      }))

      const response = await apiService.answerAmbiguityQuestion(currentSessionId, { answer })
      console.log("Ambiguity response:", response)
      console.log("📝 Current Q&A state before processing response:", {
        questions: updatedQA.allQuestions.length,
        answers: updatedQA.allAnswers.length,
        lastAnswer: answer
      })

      // Add next question to tracking if it exists
      if (response.next_question && !updatedQA.allQuestions.includes(response.next_question)) {
        updatedQA.allQuestions.push(response.next_question)
        setSessionQuestionsAnswers(prev => ({
          ...prev,
          [currentSessionId]: updatedQA
        }))
        console.log("➕ Added next question to tracking:", response.next_question)
      }

      // FIXED: Properly handle context confirmation transition
      if (response.status === 'context_confirmation' || response.ready_for_confirmation) {
        console.log("🎯 Transitioning to context confirmation with Q&A history:", updatedQA)

        // CRITICAL FIX: Fetch complete Q&A data from backend to ensure accuracy
        console.log("🔍 Fetching complete Q&A from backend before context confirmation")

        try {
          const backendQA = await apiService.getAmbiguityQuestions(currentSessionId)

          if (backendQA && backendQA.success) {
            const { questions: backendQuestions = [], answers: backendAnswers = [] } = backendQA.data

            console.log("✅ Retrieved complete Q&A from backend:", {
              questions: backendQuestions.length,
              answers: backendAnswers.length,
              questionsData: backendQuestions,
              answersData: backendAnswers
            })

            // Use the authoritative backend data
            updatedQA.allQuestions = backendQuestions
            updatedQA.allAnswers = backendAnswers

            setSessionQuestionsAnswers(prev => ({
              ...prev,
              [currentSessionId]: updatedQA
            }))
          }
        } catch (error) {
          console.error("❌ Failed to fetch backend Q&A for context confirmation:", error)
        }

        console.log("✅ Final Q&A state for context confirmation:", {
          questions: updatedQA.allQuestions.length,
          answers: updatedQA.allAnswers.length
        })

        updateConversationState(currentSessionId, {
          contextConfirmationActive: true,
          awaitingUserResponse: false,
          step: CONVERSATION_STEPS.CONTEXT,
          ambiguityAnswers: updatedQA.allAnswers,
          ambiguityQuestions: updatedQA.allQuestions,
        })

        // Force reload session to get updated messages from backend
        loadSessionData(currentSessionId)

      } else if (response.next_question) {
        console.log("❓ Next question available, continuing in ambiguity mode")

        // FIXED: Update conversation state with preserved Q&A history
        updateConversationState(currentSessionId, {
          awaitingUserResponse: true,
          step: CONVERSATION_STEPS.AMBIGUITY, // Ensure we stay in ambiguity mode
          currentQuestionIndex: updatedQA.allAnswers.length,
          ambiguityQuestions: updatedQA.allQuestions,
          ambiguityAnswers: updatedQA.allAnswers,
        })

        console.log("✅ Updated conversation state with preserved Q&A:", {
          questions: updatedQA.allQuestions.length,
          answers: updatedQA.allAnswers.length,
          questionsArray: updatedQA.allQuestions,
          answersArray: updatedQA.allAnswers
        })

        // Update the message in session data to reflect the new question without full reload
        if (sessions[currentSessionId]) {
          const updatedMessages = sessions[currentSessionId].messages.map(msg => {
            if (msg.type === 'ambiguity') {
              return {
                ...msg,
                currentQuestion: response.next_question,
                answeredQuestions: updatedQA.allAnswers.length,
                totalQuestions: updatedQA.allQuestions.length,
                status: 'active'
              }
            }
            return msg
          })

          updateSession(currentSessionId, {
            ...sessions[currentSessionId],
            messages: updatedMessages
          })
        }
      } else {
        console.log("⚠️ No next question and no context confirmation - might be ready for context")

        // If no next question but we have answers, might be ready for context confirmation
        if (updatedQA.allAnswers.length > 0) {
          updateConversationState(currentSessionId, {
            contextConfirmationActive: true,
            awaitingUserResponse: false,
            step: CONVERSATION_STEPS.CONTEXT,
            ambiguityAnswers: updatedQA.allAnswers,
            ambiguityQuestions: updatedQA.allQuestions,
          })

          loadSessionData(currentSessionId)
        }
      }

    } catch (error) {
      console.error("Failed to answer ambiguity question:", error)
      toast({
        title: "Failed to submit answer",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStartAnalysis = async () => {
    if (!currentSessionId) return

    try {
      console.log("🚀 Starting analysis for session:", currentSessionId)

      // Resolve ambiguity and start analysis
      await apiService.resolveAmbiguity(currentSessionId, { action: 'start_analysis' })

      updateConversationState(currentSessionId, {
        clickedButton: "clicked",
        contextConfirmationActive: false,
        step: CONVERSATION_STEPS.PROCESSING,
        isProcessing: true,
      })


      // Start processing with current control settings
      console.log("⚙️ Starting processing with config:", {
        processing_time: controlSettings.processingTime,
        analytics_depth: controlSettings.analyticsDepth,
        reporting_style: controlSettings.reportingStyle,
        cross_validation: controlSettings.crossValidation,
      })

      const processingResponse = await apiService.startProcessing(currentSessionId, {
        config: {
          processing_time: controlSettings.processingTime,
          analytics_depth: controlSettings.analyticsDepth,
          reporting_style: controlSettings.reportingStyle,
          cross_validation: controlSettings.crossValidation,
        }
      })

      console.log("✅ Processing started:", processingResponse)

      // FIXED: Start frontend dummy progress simulation instead of backend polling
      startDummyProgressSimulation(currentSessionId)
      return // Skip the backend polling for now
      const statusCleanup = apiService.startStatusPolling(
        currentSessionId,
        (status: ProcessingStatus) => {
          console.log("📊 Processing status update:", status)
          const stages = convertProcessingStatus(status)

          // FIXED: Keep processing state true until explicitly completed/stopped
          const stillProcessing = status.status === 'processing' || status.status === 'starting' || status.status === 'running' || status.status === 'initializing'

          updateConversationState(currentSessionId, {
            processingStages: stages,
            isProcessing: stillProcessing,
          })

          // Handle completion - only when backend confirms completion
          if (status.status === 'completed' || status.status === 'stopped' || status.status === 'failed') {
            console.log("🎉 Processing completed/stopped/failed, updating state:", status.status)

            updateConversationState(currentSessionId, {
              step: CONVERSATION_STEPS.COMPLETED,
              isProcessing: false,
              processingPollCleanup: undefined, // Clear cleanup function
            })

            setUiState((prev) => ({ ...prev, controlsDisabled: false }))

            // Load updated session data to get the result message
            loadSessionData(currentSessionId).then(() => {
              console.log("✅ Session data reloaded after completion")
            }).catch((error) => {
              console.warn("⚠️ Failed to load session data, adding fallback result message", error)

              // Add fallback assistant message
              const fallbackMessage: Message = {
                id: `result_${Date.now()}`,
                type: 'assistant',
                content: '# 📊 Analysis Complete\n\nYour analytics processing has finished successfully! The results show comprehensive insights based on your requirements.\n\n## Key Findings:\n- Data analysis completed across all specified metrics\n- Regional performance variations identified\n- Trend analysis reveals important patterns\n- Recommendations generated for optimization\n\n**Status:** Ready for follow-up analysis',
                timestamp: new Date(),
                status: 'completed',
                interactions: undefined,
                domain: currentSession?.domain || '',
                scope: undefined,
                expanded: false,
                currentQuestion: undefined,
                answeredQuestions: undefined,
                totalQuestions: undefined,
                regions: undefined,
                metrics: undefined,
                conversationalContext: undefined
              }

              // Add fallback message to current session
              if (currentSession) {
                updateSession(currentSessionId, {
                  messages: [...currentSession.messages, fallbackMessage],
                  currentStep: CONVERSATION_STEPS.COMPLETED
                })
              }
            })
          }
        },
        (error) => {
          console.error('❌ Processing status polling error:', error)

          // FIXED: Don't assume completion on polling error - try to recover first
          // This prevents premature processing GIF disappearance
          console.log("⚠️ Polling error - attempting to recover processing state...")

          // Try to get status one more time before giving up
          apiService.getProcessingStatus(currentSessionId)
            .then((status) => {
              console.log("✅ Recovered processing status:", status)
              const stages = convertProcessingStatus(status)
              const stillProcessing = status.status === 'processing' || status.status === 'starting' || status.status === 'running' || status.status === 'initializing'

              updateConversationState(currentSessionId, {
                processingStages: stages,
                isProcessing: stillProcessing,
              })

              if (status.status === 'completed' || status.status === 'stopped' || status.status === 'failed') {
                updateConversationState(currentSessionId, {
                  step: CONVERSATION_STEPS.COMPLETED,
                  isProcessing: false,
                })
                setUiState((prev) => ({ ...prev, controlsDisabled: false }))
                loadSessionData(currentSessionId)
              }
            })
            .catch((recoveryError) => {
              console.error("❌ Failed to recover processing state:", recoveryError)

              // Only if recovery fails completely, assume completion
              updateConversationState(currentSessionId, {
                isProcessing: false,
                step: CONVERSATION_STEPS.COMPLETED,
              })
              setUiState((prev) => ({ ...prev, controlsDisabled: false }))

              // Add fallback completion message
              const fallbackMessage: Message = {
                id: `fallback_polling_error_${Date.now()}`,
                type: 'assistant',
                content: '# 📊 Analysis Status Unknown\n\nThere was a connection issue while monitoring the analysis progress. The processing may have completed successfully, but we cannot confirm the current status.\n\n**Please check the processing logs or try refreshing the session.**',
                timestamp: new Date(),
                status: 'completed',
                interactions: undefined,
                domain: currentSession?.domain || '',
                scope: undefined,
                expanded: false,
                currentQuestion: undefined,
                answeredQuestions: undefined,
                totalQuestions: undefined,
                regions: undefined,
                metrics: undefined,
                conversationalContext: undefined
              }

              if (currentSession) {
                updateSession(currentSessionId, {
                  messages: [...currentSession.messages, fallbackMessage],
                  currentStep: CONVERSATION_STEPS.COMPLETED
                })
              }
            })
        }
      )

      // Store cleanup function for this session
      updateConversationState(currentSessionId, {
        processingPollCleanup: statusCleanup,
      })

      // Start polling for logs
      const logsCleanup = apiService.startLogsPolling(
        currentSessionId,
        (logs: ProcessingLog[]) => {
          // Logs are handled by the ProcessingLogWindow component
          console.log("📝 Received logs update:", logs.length, "logs")
        },
        (error) => {
          console.error("❌ Logs polling error:", error)
        }
      )

      // Store logs cleanup function
      updateConversationState(currentSessionId, {
        logsPollCleanup: logsCleanup,
      })

      setUiState((prev) => ({ ...prev, controlsDisabled: true }))

      toast({
        title: "Analysis Started",
        description: "Your analytics processing has begun. Please wait for completion.",
      })

    } catch (error) {
      console.error("❌ Failed to start analysis:", error)

      updateConversationState(currentSessionId, {
        isProcessing: false,
        step: CONVERSATION_STEPS.CONTEXT,
        clickedButton: null,
      })

      setUiState((prev) => ({ ...prev, controlsDisabled: false }))

      toast({
        title: "Failed to start analysis",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleContinueResolving = async () => {
    if (!currentSessionId) return

    try {
      console.log("🔄 Starting continue resolving for session:", currentSessionId)

      const response = await apiService.resolveAmbiguity(currentSessionId, { action: 'continue_resolving' })
      console.log("✅ Continue resolving response:", response)

      // FIXED: Preserve existing Q&A history when continuing
      const currentSessionQA = sessionQuestionsAnswers[currentSessionId] || {
        allQuestions: [],
        allAnswers: []
      }

      // FIXED: Preserve existing Q&A history and add new question if provided
      let updatedQA = { ...currentSessionQA }
      if (response.next_question && !updatedQA.allQuestions.includes(response.next_question)) {
        updatedQA.allQuestions = [...updatedQA.allQuestions, response.next_question]
        console.log("➕ Added new question from continue resolving:", response.next_question)
      }

      // Update session Q&A tracking - KEEP EXISTING ANSWERS
      setSessionQuestionsAnswers(prev => ({
        ...prev,
        [currentSessionId]: updatedQA
      }))

      // FIXED: Update conversation state to continue in ambiguity mode with preserved history
      updateConversationState(currentSessionId, {
        clickedButton: null,
        contextConfirmationActive: false,
        awaitingUserResponse: true,
        step: CONVERSATION_STEPS.AMBIGUITY,
        // CRITICAL: Keep all previous Q&A visible
        ambiguityQuestions: updatedQA.allQuestions,
        ambiguityAnswers: updatedQA.allAnswers, // This preserves the conversation history
        currentQuestionIndex: updatedQA.allAnswers.length, // Current position in Q&A
      })

      // Refresh session to get updated messages from backend
      loadSessionData(currentSessionId).then(() => {
        console.log("✅ Session reloaded after continue resolving")

        // CRITICAL: Debug the state after reload to ensure Q&A history is maintained
        const currentState = conversationStates[currentSessionId]
        console.log("🔍 Post-continue state check:", {
          questions: currentState?.ambiguityQuestions?.length || 0,
          answers: currentState?.ambiguityAnswers?.length || 0,
          step: currentState?.step
        })
      })

      toast({
        title: "Continue Resolving",
        description: "Ready for additional questions to refine the analysis context.",
      })

    } catch (error) {
      console.error("Failed to continue resolving:", error)
      toast({
        title: "Failed to continue resolving",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleForceStop = async () => {
    if (!currentSessionId) return

    try {
      console.log("🛑 Force stopping processing for session:", currentSessionId)

      // Clean up session storage immediately
      const progressKey = `progress_${currentSessionId}`
      sessionStorage.removeItem(progressKey)
      console.log("🗑️ Removed session storage:", progressKey)

      // Clean up polling intervals
      const currentState = conversationStates[currentSessionId]
      if (currentState?.processingPollCleanup) {
        currentState.processingPollCleanup()
        console.log("🧹 Cleaned up processing poll")
      }
      if (currentState?.logsPollCleanup) {
        currentState.logsPollCleanup()
        console.log("🧹 Cleaned up logs poll")
      }

      // Update conversation state to completed
      updateConversationState(currentSessionId, {
        isProcessing: false,
        step: CONVERSATION_STEPS.COMPLETED,
        processingStages: [], // Clear processing stages
      })

      // Call backend to complete processing and get output (not just stop)
      try {
        await apiService.completeProcessing(currentSessionId)
        console.log("✅ Backend completion successful")

        // Load session data to get the final output
        await loadSessionData(currentSessionId)
        console.log("✅ Session data reloaded with final output")
      } catch (error) {
        console.error("❌ Failed to complete processing:", error)
        // Fallback - just call stop
        await apiService.stopProcessing(currentSessionId)
      }

      setUiState((prev) => ({ ...prev, controlsDisabled: false }))

      // Load updated session
      loadSessionData(currentSessionId)

      toast({
        title: "Processing stopped",
        description: "Analysis has been manually interrupted.",
      })

    } catch (error) {
      console.error("Failed to stop processing:", error)
      toast({
        title: "Failed to stop processing",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    }
  }

  // FIXED: Enhanced end conversation handler
  const handleEndConversation = useCallback(() => {
    if (!currentSessionId) return

    console.log("Ending conversation for session:", currentSessionId)

    // Clean up any active polling
    const currentState = conversationStates[currentSessionId]
    if (currentState?.processingPollCleanup) {
      currentState.processingPollCleanup()
    }
    if (currentState?.logsPollCleanup) {
      currentState.logsPollCleanup()
    }

    // Update conversation state
    updateConversationState(currentSessionId, {
      isConversationEnded: true,
    })

    // Show notification
    toast({
      title: "Conversation ended",
      description: "You can start a new conversation or review this one in the history.",
    })

    // Optional: Navigate back to the session list or new form after a delay
    setTimeout(() => {
      setShowNewForm(true)
      setCurrentSessionId(null)
    }, 2000)

  }, [currentSessionId, conversationStates, updateConversationState, toast])

  // FIXED: Frontend dummy progress simulation
  const startDummyProgressSimulation = (sessionId: string) => {
    console.log("🎭 Starting frontend dummy progress simulation for session:", sessionId)

    // Define the stages with their relative durations (matching backend config)
    const stages = [
      { id: 'planning', name: 'Planning', duration: 15 },
      { id: 'coding', name: 'Coding', duration: 25 },
      { id: 'verification', name: 'In-conversation Verification', duration: 20 },
      { id: 'execution', name: 'Execution', duration: 20 },
      { id: 'fixing', name: 'Code-fixing', duration: 10 },
      { id: 'optimization', name: 'Plan Optimization', duration: 5 },
      { id: 'summarization', name: 'Summarization', duration: 5 }
    ]

    // Initialize stages state
    const initialStages = stages.map((stage, index) => ({
      id: stage.id,
      name: stage.name,
      icon: 'Database' as const,
      status: index === 0 ? 'processing' as const : 'queued' as const,
      progress: 0,
      started_at: index === 0 ? new Date().toISOString() : null,
      completed_at: null
    }))

    // Initialize session storage for this session
    const progressKey = `progress_${sessionId}`
    const progressData = {
      startTime: Date.now(),
      totalDuration: 30000, // 30 seconds in milliseconds
      stages: stages,
      currentStages: initialStages
    }
    sessionStorage.setItem(progressKey, JSON.stringify(progressData))

    updateConversationState(sessionId, {
      processingStages: initialStages,
      isProcessing: true,
    })

    // Progress update function that reads from session storage
    const updateProgress = async () => {
      const stored = sessionStorage.getItem(progressKey)
      if (!stored) {
        console.log("⏹️ Session storage removed, stopping progress updates")
        return true // Signal to stop
      }

      const data = JSON.parse(stored)
      const elapsed = Date.now() - data.startTime
      const progressPercent = Math.min((elapsed / data.totalDuration) * 100, 100)

      // If completed
      if (progressPercent >= 100) {
        // Mark all stages as completed
        const completedStages = stages.map(stage => ({
          id: stage.id,
          name: stage.name,
          icon: 'Database',
          status: 'completed',
          progress: 100,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }))

        updateConversationState(sessionId, {
          processingStages: completedStages,
          isProcessing: false,
          step: CONVERSATION_STEPS.COMPLETED,
        })

        // Remove from session storage
        sessionStorage.removeItem(progressKey)

        console.log("🎉 PROCESSING COMPLETED - Calling backend completion")

        // Call backend to mark completion and get final result
        try {
          await apiService.completeProcessing(sessionId)
          await loadSessionData(sessionId)
          console.log("✅ Backend completion successful")
        } catch (error) {
          console.error("❌ Failed to complete processing:", error)
        }

        return true // Signal completion
      }

      // Update stages based on overall progress
      const updatedStages = data.currentStages.map((stage, index) => {
        const stageStartPercent = (index / stages.length) * 100
        const stageEndPercent = ((index + 1) / stages.length) * 100

        if (progressPercent <= stageStartPercent) {
          return { ...stage, status: 'queued', progress: 0 }
        } else if (progressPercent >= stageEndPercent) {
          return {
            ...stage,
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString()
          }
        } else {
          const stageProgress = ((progressPercent - stageStartPercent) / (stageEndPercent - stageStartPercent)) * 100
          return {
            ...stage,
            status: 'processing',
            progress: Math.round(stageProgress),
            started_at: stage.started_at || new Date().toISOString()
          }
        }
      })

      // Update session storage
      data.currentStages = updatedStages
      sessionStorage.setItem(progressKey, JSON.stringify(data))

      updateConversationState(sessionId, {
        processingStages: [...updatedStages],
        isProcessing: true,
      })

      console.log(`📊 Progress: ${Math.round(progressPercent)}% (${Math.round(elapsed/1000)}s)`)

      return false // Not completed yet
    }

    // Start the progress interval
    const progressInterval = setInterval(async () => {
      const shouldStop = await updateProgress()
      if (shouldStop) {
        clearInterval(progressInterval)
        console.log("⏹️ Progress interval stopped")
      }
    }, 1000) // Update every second

    // Store cleanup function
    updateConversationState(sessionId, {
      processingPollCleanup: () => {
        clearInterval(progressInterval)
        sessionStorage.removeItem(progressKey)
      },
    })
  }

  const loadSessionData = async (sessionId: string) => {
    try {
      const sessionData = await apiService.getSession(sessionId)
      const updatedSession = convertSessionData(sessionData)
      updateSession(sessionId, updatedSession)

      console.log("📋 Session loaded with current_step:", updatedSession.currentStep)

      // FIXED: Set conversation state based on session's current_step
      if (updatedSession.currentStep === 'processing') {
        console.log("🔄 Session is in processing state, checking processing status...")
        // Set basic processing state immediately to hide ambiguity buttons
        updateConversationState(sessionId, {
          step: CONVERSATION_STEPS.PROCESSING,
          contextConfirmationActive: false,
          awaitingUserResponse: false,
        })
      } else if (updatedSession.currentStep === 'completed') {
        console.log("✅ Session is completed")
        updateConversationState(sessionId, {
          step: CONVERSATION_STEPS.COMPLETED,
          isProcessing: false,
        })
        return // Exit early for completed sessions
      }

      // FIXED: Check for ongoing processing state when loading session
      // If session is marked as processing, we should check processing status
      if (updatedSession.currentStep === 'processing') {
        try {
          const processingStatus = await apiService.getProcessingStatus(sessionId)
        const stillProcessing = processingStatus.status === 'processing' ||
                              processingStatus.status === 'starting' ||
                              processingStatus.status === 'running' ||
                              processingStatus.status === 'initializing'

        if (stillProcessing) {
          console.log("🔄 Found ongoing processing for session:", sessionId, "Status:", processingStatus.status)

          // Restore processing state
          const stages = convertProcessingStatus(processingStatus)
          updateConversationState(sessionId, {
            step: CONVERSATION_STEPS.PROCESSING,
            isProcessing: true,
            processingStages: stages,
            contextConfirmationActive: false,
            awaitingUserResponse: false,
          })

          // Resume status polling
          const statusCleanup = apiService.startStatusPolling(
            sessionId,
            (status: ProcessingStatus) => {
              console.log("📊 Resumed processing status update:", status)
              const stages = convertProcessingStatus(status)
              const stillProcessing = status.status === 'processing' || status.status === 'starting' || status.status === 'running' || status.status === 'initializing'

              updateConversationState(sessionId, {
                processingStages: stages,
                isProcessing: stillProcessing,
              })

              if (status.status === 'completed' || status.status === 'stopped' || status.status === 'failed') {
                console.log("🎉 Resumed processing completed:", status.status)
                updateConversationState(sessionId, {
                  step: CONVERSATION_STEPS.COMPLETED,
                  isProcessing: false,
                })
                loadSessionData(sessionId) // Reload to get final results
              }
            },
            (error) => {
              console.error('❌ Resumed processing polling error:', error)
              updateConversationState(sessionId, {
                isProcessing: false,
                step: CONVERSATION_STEPS.COMPLETED,
              })
            }
          )

          updateConversationState(sessionId, {
            processingPollCleanup: statusCleanup,
          })

          return // Exit early since we're in processing state
        } else if (processingStatus.status === 'completed') {
          console.log("✅ Processing already completed for session:", sessionId)
          updateConversationState(sessionId, {
            step: CONVERSATION_STEPS.COMPLETED,
            isProcessing: false,
          })
          return // Exit early since processing is done
        }
        } catch (processingError) {
          console.log("ℹ️ No processing status found for session:", sessionId, "but session marked as processing")
          // Session says processing but no processing status found, set to completed
          updateConversationState(sessionId, {
            step: CONVERSATION_STEPS.COMPLETED,
            isProcessing: false,
          })
          return
        }
        // If we reach here and session is processing, exit without loading ambiguity data
        return
      }

      // FIXED: Fetch complete Q&A data from backend database on page refresh
      const currentQA = sessionQuestionsAnswers[sessionId]
      const ambiguityMessage = updatedSession.messages.find(m => m.type === 'ambiguity')

      if (ambiguityMessage && (!currentQA || (currentQA.allQuestions.length === 0 && currentQA.allAnswers.length === 0))) {
        try {
          console.log("🔄 Fetching complete Q&A data from backend for session:", sessionId)

          // Fetch the complete ambiguity data from backend database
          const ambiguityData = await apiService.getAmbiguityQuestions(sessionId)

          if (ambiguityData && ambiguityData.success) {
            const { questions = [], answers = [], status, current_index } = ambiguityData.data

            console.log("✅ Retrieved Q&A data from backend:", {
              questions: questions.length,
              answers: answers.length,
              status: status,
              current_index: current_index,
              questionsData: questions,
              answersData: answers
            })

            // Update Q&A tracking with real data from database
            setSessionQuestionsAnswers(prev => ({
              ...prev,
              [sessionId]: {
                allQuestions: questions,
                allAnswers: answers
              }
            }))

            // Update conversation state with real Q&A data and proper status
            updateConversationState(sessionId, {
              ambiguityQuestions: questions,
              ambiguityAnswers: answers,
              currentQuestionIndex: current_index || answers.length,
              step: status === 'context_confirmation' ? CONVERSATION_STEPS.CONTEXT : CONVERSATION_STEPS.AMBIGUITY,
              contextConfirmationActive: status === 'context_confirmation',
              awaitingUserResponse: status === 'active' && questions.length > answers.length,
            })

            console.log("💾 Restored Q&A tracking from database:", sessionId, {
              questions: questions.length,
              answers: answers.length,
              status: status,
              step: status === 'context_confirmation' ? 'CONTEXT' : 'AMBIGUITY'
            })
          } else {
            console.warn("⚠️ No ambiguity data found in backend for session:", sessionId)
          }
        } catch (error) {
          console.error("❌ Failed to fetch ambiguity Q&A data:", error)

          // Fallback to message-based approach if API fails
          const allQuestions: string[] = []
          const allAnswers: string[] = []

          if (ambiguityMessage.all_questions && Array.isArray(ambiguityMessage.all_questions)) {
            allQuestions.push(...ambiguityMessage.all_questions)
          } else if (ambiguityMessage.currentQuestion) {
            allQuestions.push(ambiguityMessage.currentQuestion)
          }

          setSessionQuestionsAnswers(prev => ({
            ...prev,
            [sessionId]: { allQuestions, allAnswers }
          }))

          console.log("🔄 Used fallback Q&A extraction for session:", sessionId)
        }
      } else if (currentQA) {
        console.log("✅ Preserving existing Q&A tracking for session:", sessionId, {
          questions: currentQA.allQuestions.length,
          answers: currentQA.allAnswers.length
        })
      }
    } catch (error) {
      console.error("Failed to load session data:", error)
    }
  }

  const hasMessages = useMemo(() => {
    return currentSession && currentSession.messages.length > 0
  }, [currentSession])

  // Handle search - FIXED: Remove automatic debounced search that causes continuous calls
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    // Only search when user actually submits, not on every keystroke
    // Remove the automatic search to prevent continuous API calls
  }

  // Manual search function for when user submits
  const performSearch = async (query: string) => {
    if (!localStorage.getItem('user')) {
      console.warn("User not authenticated, skipping search")
      return
    }

    try {
      const sessionsData = await apiService.getSessions(query)
      const convertedSessions = sessionsData.map(convertSessionData)
      setSessions(convertedSessions)
    } catch (error) {
      console.error("Search failed:", error)
    }
  }

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      Object.values(conversationStates).forEach(state => {
        if (state.processingPollCleanup) state.processingPollCleanup()
        if (state.logsPollCleanup) state.logsPollCleanup()
      })
    }
  }, [conversationStates])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <LeftPanel
        isOpen={panelState.leftOpen}
        onToggle={(open) => setPanelState((prev) => ({ ...prev, leftOpen: open }))}
        controlsDisabled={
          uiState.controlsDisabled ||
          isLoading ||
          currentConversationState.isProcessing ||
          currentConversationState.awaitingUserResponse ||
          currentConversationState.contextConfirmationActive
        }
        processingTime={controlSettings.processingTime}
        setProcessingTime={(time) => setControlSettings((prev) => ({ ...prev, processingTime: time }))}
        analyticsDepth={controlSettings.analyticsDepth}
        setAnalyticsDepth={(depth) => setControlSettings((prev) => ({ ...prev, analyticsDepth: depth as "basic" | "moderate" | "deep" }))}
        reportingStyle={controlSettings.reportingStyle}
        setReportingStyle={(style: string) => setControlSettings((prev) => ({ ...prev, reportingStyle: style as "detailed" | "executive" | "visual" }))}
        crossValidation={controlSettings.crossValidation}
        setCrossValidation={(validation: "low" | "medium" | "high") => setControlSettings((prev) => ({ ...prev, crossValidation: validation }))}
        showAdvancedSettings={controlSettings.showAdvancedSettings}
        setShowAdvancedSettings={(show) => setControlSettings((prev) => ({ ...prev, showAdvancedSettings: show }))}
        autoSave={controlSettings.autoSave}
        setAutoSave={(save) => setControlSettings((prev) => ({ ...prev, autoSave: save }))}
        realTimeUpdates={controlSettings.realTimeUpdates}
        setRealTimeUpdates={(updates) => setControlSettings((prev) => ({ ...prev, realTimeUpdates: updates }))}
        isProcessing={currentConversationState.isProcessing}
      />

      <div className="flex flex-col min-w-0 flex-1 max-w-4xl mx-auto pt-16">
        <DashboardHeader
          leftPanelOpen={panelState.leftOpen}
          rightPanelOpen={panelState.rightOpen}
          onToggleLeftPanel={(open) => setPanelState((prev) => ({ ...prev, leftOpen: open }))}
          onToggleRightPanel={(open) => setPanelState((prev) => ({ ...prev, rightOpen: open }))}
          onNewAnalysis={() => {
            setShowNewForm(true)
            setCurrentSessionId(null)
            setFormState((prev) => ({ ...prev, analysisTitle: "", analysisDomain: "", currentMessage: "" }))
            setUiState((prev) => ({ ...prev, controlsDisabled: false }))
          }}
          isDarkMode={uiState.isDarkMode}
          onToggleTheme={toggleTheme}
          currentSession={currentSession}
        />

        <MainContent
          showNewAnalysisForm={showNewForm}
          currentSession={currentSession}
          conversationStep={currentConversationState.step.toLowerCase() as "query" | "ambiguity" | "context" | "processing" | "completed"}
          isProcessing={currentConversationState.isProcessing}
          processingStages={currentConversationState.processingStages}
          analysisTitle={formState.analysisTitle}
          setAnalysisTitle={(title) => setFormState((prev) => ({ ...prev, analysisTitle: title }))}
          analysisDomain={formState.analysisDomain}
          setAnalysisDomain={(domain) => setFormState((prev) => ({ ...prev, analysisDomain: domain }))}
          currentMessage={formState.currentMessage}
          setCurrentMessage={(message) => setFormState((prev) => ({ ...prev, currentMessage: message }))}
          ambiguityQuestions={currentConversationState.ambiguityQuestions}
          currentQuestionIndex={currentConversationState.currentQuestionIndex}
          ambiguityAnswers={currentConversationState.ambiguityAnswers}
          awaitingUserResponse={currentConversationState.awaitingUserResponse}
          contextConfirmationActive={currentConversationState.contextConfirmationActive}
          clickedButton={currentConversationState.clickedButton}
          onStartNewAnalysis={handleStartNewAnalysis}
          onSendMessage={handleSendMessage}
          onStartAnalysis={handleStartAnalysis}
          onContinueResolving={handleContinueResolving}
          onForceStop={handleForceStop}
          onEndConversation={handleEndConversation}
          isConversationEnded={currentConversationState.isConversationEnded}
          hasMessages={hasMessages}
          processingTime={controlSettings.processingTime}
          reportFormat={controlSettings.reportingStyle}
          crossValidation={controlSettings.crossValidation}
          leftPanelOpen={panelState.leftOpen}
          rightPanelOpen={panelState.rightOpen}
          isLoading={isLoading}
          onAmbiguityAnswer={handleAmbiguityAnswer}
        />
      </div>

      <RightPanel
        isOpen={panelState.rightOpen}
        onToggle={(open) => setPanelState((prev) => ({ ...prev, rightOpen: open }))}
        sessions={sessions}
        currentSession={currentSession}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        onSelectSession={(session) => {
          setCurrentSessionId(session.id)
          setShowNewForm(false)
          
          // Ensure conversation state exists for this session
          if (!conversationStates[session.id]) {
            setConversationStates(prev => ({
              ...prev,
              [session.id]: createFreshConversationState()
            }))
          }
          
          // Set UI state based on session status
          if (session.currentStep === CONVERSATION_STEPS.COMPLETED) {
            setUiState((prev) => ({ ...prev, controlsDisabled: false }))
          }

          // Load full session data
          loadSessionData(session.id)
        }}
        isLoading={isLoading}
      />
    </div>
  )
}

export { AnalyticsDashboard }