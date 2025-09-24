// FIXED: ambiguity-message.tsx - Proper API-driven state handling
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ChevronDown, CheckCircle } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"
import type { Message } from "@/types"

interface AmbiguityMessageProps {
  message: Message
  sessionId: string
  ambiguityQuestions: string[]
  currentQuestionIndex: number
  ambiguityAnswers: string[]
  awaitingUserResponse: boolean
  contextConfirmationActive: boolean
  clickedButton: string | null
  shouldAutoCollapse?: boolean
  onStartAnalysis: () => void
  onContinueResolving: () => void
  onStateUpdate?: (updates: any) => void
}

export function AmbiguityMessage({
  message,
  sessionId,
  ambiguityQuestions,
  currentQuestionIndex,
  ambiguityAnswers,
  awaitingUserResponse,
  contextConfirmationActive,
  clickedButton,
  shouldAutoCollapse = false,
  onStartAnalysis,
  onContinueResolving,
  onStateUpdate,
}: AmbiguityMessageProps) {
  const [ambiguityCollapsed, setAmbiguityCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [contextData, setContextData] = useState<any>(null)
  const [fallbackQuestions, setFallbackQuestions] = useState<string[]>([])
  const [backendAmbiguityStatus, setBackendAmbiguityStatus] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (shouldAutoCollapse) {
      setAmbiguityCollapsed(true)
    } else {
      setAmbiguityCollapsed(false)
    }
  }, [shouldAutoCollapse])

  // Load fallback questions when questions array is empty but we have answers
  useEffect(() => {
    if (ambiguityQuestions.length === 0 && ambiguityAnswers.length > 0 && !fallbackQuestions.length) {
      // Create generic fallback questions based on the domain
      const domain = message.domain || 'Finance'
      const genericQuestions = [
        `What specific ${domain.toLowerCase()} metrics should be prioritized?`,
        `Should the analysis include seasonal adjustments?`,
        `What time period should be used for the comparison?`,
        `What level of detail is needed for the reporting?`,
        `Should any specific segments be excluded from analysis?`
      ]
      setFallbackQuestions(genericQuestions)
    }
  }, [ambiguityQuestions, ambiguityAnswers, message.domain, fallbackQuestions])

  // FIXED: Load context data when message status changes to context_confirmation
  useEffect(() => {
    if (message.status === "context_confirmation" && !contextData && sessionId) {
      loadContextData()
    }
  }, [message.status, sessionId])

  // FIXED: Check backend ambiguity status on component mount and when session changes
  useEffect(() => {
    if (sessionId) {
      loadContextData()
    }
  }, [sessionId])

  // FIXED: Check if session has moved beyond ambiguity (processing/completed)
  useEffect(() => {
    const checkSessionState = async () => {
      if (sessionId) {
        try {
          // Check if processing has started/completed for this session
          const processingStatus = await apiService.getProcessingStatus(sessionId)
          if (processingStatus && (processingStatus.status === 'processing' || processingStatus.status === 'completed')) {
            console.log("🔒 Session has processing status, hiding buttons permanently")
            setBackendAmbiguityStatus('completed')
          }
        } catch (error) {
          // No processing status means we're still in ambiguity phase
        }
      }
    }
    checkSessionState()
  }, [sessionId])

const loadContextData = async () => {
  try {
    const context = await apiService.getAmbiguityContext(sessionId)
    console.log("🔄 Loaded context data with status:", context.status, context)

    // Set backend status for button visibility
    setBackendAmbiguityStatus(context.status)

    // Check if ambiguity resolution is completed (hide buttons)
    if (context.status === 'completed') {
      console.log("✅ Ambiguity resolution completed - buttons should be hidden")
      // Notify parent component to update state
      if (onStateUpdate) {
        onStateUpdate({
          contextConfirmationActive: false,
          awaitingUserResponse: false,
          clickedButton: "clicked" // Hide buttons
        })
      }
    }

    // FIXED: Store questions and answers from backend response
    const contextDataWithQA = {
      domain_context: context.domain_context,
      scope: context.scope,
      regions: context.regions,
      metrics: context.metrics,
      questions: context.questions || [],
      answers: context.answers || []
    }

    // Handle nested response structure from API
    if (context.domain_context && typeof context.domain_context === 'object') {
      setContextData({...context.domain_context, ...contextDataWithQA})
    } else {
      setContextData(contextDataWithQA)
    }
  } catch (error) {
    console.error("Failed to load context:", error)
    // Fallback context data for demo
    setContextData({
      domain_context: "Customer Service - Service Quality Analysis",
      scope: "Service metrics analysis • Response optimization",
      regions: "All service channels and territories",
      metrics: "Response time, resolution rate, customer satisfaction"
    })
  }
}

  const handleStartAnalysis = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      await apiService.resolveAmbiguity(sessionId, { action: 'start_analysis' })
      await onStartAnalysis()
    } catch (error) {
      console.error("Failed to start analysis:", error)
      toast({
        title: "Failed to start analysis",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueResolving = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      await apiService.resolveAmbiguity(sessionId, { action: 'continue_resolving' })
      await onContinueResolving()
    } catch (error) {
      console.error("Failed to continue resolving:", error)
      toast({
        title: "Failed to continue resolving",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // FIXED: Determine display state - show content but control button visibility separately
  const getDisplayState = () => {
    if (message.status === "context_confirmation" || contextConfirmationActive) {
      return "context_confirmation"
    }
    if (message.status === "completed") {
      return "completed"
    }
    if (message.status === "active" || awaitingUserResponse) {
      return "active"
    }
    return "active" // Default to active state
  }

  // FIXED: Separate function to determine if buttons should be shown
  const shouldShowButtons = () => {
    // Don't show buttons if backend ambiguity is completed (processing started/completed)
    if (backendAmbiguityStatus === "completed") {
      return false
    }
    // Don't show buttons if message status is completed (cycle finished)
    if (message.status === "completed") {
      return false
    }
    // Don't show buttons if clicked before (prevents reappearance)
    if (clickedButton === "clicked") {
      return false
    }
    // Only show buttons during context confirmation state
    return getDisplayState() === "context_confirmation"
  }

  const displayState = getDisplayState()

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 rounded-lg p-4 max-w-2xl w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="font-medium text-orange-900 dark:text-orange-100">Ambiguity Resolver</span>
            {(displayState === "completed" || backendAmbiguityStatus === "completed") && (
              <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800/30 font-medium">
                Resolved Context
              </span>
            )}
            {displayState === "context_confirmation" && backendAmbiguityStatus !== "completed" && (
              <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800/30 font-medium">
                Ready for Analysis
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {displayState === "active" && ambiguityAnswers.length > 0 && (
              <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full">
                {ambiguityAnswers.length} answered
              </span>
            )}
            {displayState === "active" && !ambiguityAnswers.length && message.answeredQuestions > 0 && (
              <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full">
                {message.answeredQuestions} answered
              </span>
            )}
            <button
              onClick={() => setAmbiguityCollapsed(!ambiguityCollapsed)}
              className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${ambiguityCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {!ambiguityCollapsed && (
          <div className="mt-4">
            <div className="space-y-3">
                <p className="text-sm text-orange-700 dark:text-orange-300">{message.content}</p>

{/* Show answered questions - only those that are actually answered */}
{ambiguityAnswers.length > 0 && (
  <div className="space-y-3">
    {ambiguityAnswers.map((answer, index) => {
      // Get the question for this answer from the main array or fallback
      const questionForAnswer = ambiguityQuestions[index] || fallbackQuestions[index]

      // FIXED: If we have an answer for this question, it should always be displayed
      // Don't hide answered questions even if they match the current question
      // Only skip if we don't have a valid question text
      if (!questionForAnswer) {
        return null
      }

      return (
        <div key={`answered-${index}`} className="flex items-start gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2"></div>
          <div>
            <p className="font-medium text-orange-800 dark:text-orange-200">
              {questionForAnswer || `Previous Question ${index + 1}`}
            </p>
            <p className="text-emerald-700 dark:text-emerald-300 mt-1">
              → {answer}
            </p>
          </div>
        </div>
      )
    })}
  </div>
)}

                {/* Show current question - only if there's an active question and it's not yet answered */}
                {message.currentQuestion && message.status === 'active' && (
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 animate-pulse"></div>
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-200">{message.currentQuestion}</p>
                      <p className="text-orange-600 dark:text-orange-400 mt-1 italic">Awaiting your response...</p>
                    </div>
                  </div>
                )}
              </div>

{/* Show context confirmation section when there are answered questions */}
            {(ambiguityAnswers.length > 0 || (contextData && contextData.answers && contextData.answers.length > 0)) && (
              <div className="space-y-4">
    {/* Show all answered questions - get from API or reconstruct */}
    <div className="space-y-3">
      {/* Try to get from backend first, fallback to message data */}
      {(() => {
        // Get the number of answered questions from the message
        const answeredCount = message.answeredQuestions || 0;
        const questions = ambiguityQuestions.length > 0 ? ambiguityQuestions : fallbackQuestions;
        const answers = ambiguityAnswers.length > 0 ? ambiguityAnswers : [];

        // FIXED: If we're missing Q&A data from props, try to use contextData from backend
        if ((questions.length === 0 || answers.length === 0) && contextData && contextData.questions && contextData.answers) {
          console.log("🔄 Using Q&A from backend contextData:", contextData.questions, contextData.answers);
          return contextData.answers.map((answer, index) => (
            <div key={`context-backup-${index}`} className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2"></div>
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  {contextData.questions[index] || `Question ${index + 1}`}
                </p>
                <p className="text-emerald-700 dark:text-emerald-300 mt-1">
                  → {answer}
                </p>
              </div>
            </div>
          ));
        }


        // Debug: Log the data we have
        console.log("🔍 Q&A Debug:", {
          questions: questions,
          answers: answers,
          questionsLength: questions.length,
          answersLength: answers.length,
          answeredCount: answeredCount,
          ambiguityQuestions: ambiguityQuestions,
          ambiguityAnswers: ambiguityAnswers,
          fallbackQuestions: fallbackQuestions
        });

        // If we don't have full data, show generic format but with actual count
        if (questions.length === 0 || answers.length === 0) {
          console.warn("⚠️ Missing Q&A data, showing placeholders");
          return Array.from({ length: answeredCount }).map((_, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2"></div>
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Previous Question {index + 1} - Answered
                </p>
                <p className="text-emerald-700 dark:text-emerald-300 mt-1">
                  → Response recorded
                </p>
              </div>
            </div>
          ));
        }

        // FIXED: Show ALL question-answer pairs dynamically - iterate through actual answers
        return answers.map((answer, index) => {
          // Try to get question from multiple sources
          let questionText = questions[index] || fallbackQuestions[index]

          // If still no question text, try to reconstruct from message data
          if (!questionText && message.all_questions && message.all_questions[index]) {
            questionText = message.all_questions[index]
          }

          // Final fallback
          if (!questionText) {
            questionText = `Question ${index + 1}`
          }

          return (
            <div key={`context-qa-${index}`} className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2"></div>
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  {questionText}
                </p>
                <p className="text-emerald-700 dark:text-emerald-300 mt-1">
                  → {answer}
                </p>
              </div>
            </div>
          )
        });
      })()}
    </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-emerald-900 dark:text-emerald-100">Context Confirmed</span>
                  </div>

                  {contextData && (
  <div className="space-y-2 text-sm">
    <div>
      <span className="font-medium text-emerald-800 dark:text-emerald-200">Domain Context:</span>
      <span className="text-emerald-700 dark:text-emerald-300 ml-1">
        {typeof contextData.domain_context === 'string'
          ? contextData.domain_context
          : contextData.domain_context?.domain_context || 'Not specified'}
      </span>
    </div>
    <div>
      <span className="font-medium text-emerald-800 dark:text-emerald-200">Scope:</span>
      <span className="text-emerald-700 dark:text-emerald-300 ml-1">
        {typeof contextData.scope === 'string'
          ? contextData.scope
          : contextData.domain_context?.scope || 'Not specified'}
      </span>
    </div>
    <div>
      <span className="font-medium text-emerald-800 dark:text-emerald-200">Regions:</span>
      <span className="text-emerald-700 dark:text-emerald-300 ml-1">
        {typeof contextData.regions === 'string'
          ? contextData.regions
          : contextData.domain_context?.regions || 'Not specified'}
      </span>
    </div>
    <div>
      <span className="font-medium text-emerald-800 dark:text-emerald-200">Metrics:</span>
      <span className="text-emerald-700 dark:text-emerald-300 ml-1">
        {typeof contextData.metrics === 'string'
          ? contextData.metrics
          : contextData.domain_context?.metrics || 'Not specified'}
      </span>
    </div>
  </div>
)}

                  <div className="flex gap-2 mt-4">
                    {shouldShowButtons() && (
                      <Button
                        onClick={handleStartAnalysis}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        size="sm"
                      >
                        {isLoading ? "Starting..." : "Start Analysis"}
                      </Button>
                    )}
                    {shouldShowButtons() && (
                      <Button
                        onClick={handleContinueResolving}
                        disabled={isLoading}
                        variant="outline"
                        className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 bg-transparent transition-colors"
                        size="sm"
                      >
                        {isLoading ? "Loading..." : "Continue Resolving"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}