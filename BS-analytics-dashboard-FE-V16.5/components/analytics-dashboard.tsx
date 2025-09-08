"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { LeftPanel } from "./left-panel"
import { RightPanel } from "./right-panel"
import { MainContent } from "./main-content"
import { DashboardHeader } from "./header"
import type { AnalyticsSession, Message, ProcessingStage } from "../types/index"
import { CONVERSATION_STEPS, MESSAGE_TYPES, PROCESSING_STATUSES } from "../types/index"

const INITIAL_PROCESSING_STAGES: ProcessingStage[] = [
  { id: "database", name: "Database Analysis", icon: "Database", status: "queued", progress: 0 },
  { id: "pattern", name: "Pattern Recognition", icon: "TrendingUp", status: "queued", progress: 0 },
  { id: "code", name: "Code Generation", icon: "Code", status: "queued", progress: 0 },
  { id: "report", name: "Report Synthesis", icon: "FileText", status: "queued", progress: 0 },
]

const AMBIGUITY_QUESTIONS = [
  'By "regional differences" - do you mean geographical regions, sales territories, or market segments?',
  'For "customer acquisition metrics" - should I include CAC, LTV, or specific conversion rates?',
  "What time period should I use for Q3 and Q4 comparison (calendar year or fiscal year)?",
] as const

const ADDITIONAL_QUESTIONS = [
  "Should I include seasonal adjustments in the analysis?",
  "Do you want to segment by product categories or customer types?",
] as const

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
  processingStages: INITIAL_PROCESSING_STAGES.map(stage => ({ ...stage })),
  isProcessing: false,
})

export default function AnalyticsDashboard() {
  const [panelState, setPanelState] = useState({
    leftOpen: true,
    rightOpen: true,
  })

  // Sessions list - never gets reset
  const [sessions, setSessions] = useState<AnalyticsSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(true)

  // Dictionary of conversation states by session ID
  const [conversationStates, setConversationStates] = useState<Record<string, ConversationState>>({})

  const [uiState, setUiState] = useState({
    isDarkMode: false,
    controlsDisabled: false,
  })

  const [controlSettings, setControlSettings] = useState({
    processingTime: 5,
    analyticsDepth: "moderate",
    reportingStyle: "detailed",
    crossValidation: "medium",
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

  const currentConversationState = useMemo(() => 
    currentSessionId ? conversationStates[currentSessionId] || createFreshConversationState() : createFreshConversationState(),
    [conversationStates, currentSessionId]
  )

  const toggleTheme = useCallback(() => {
    setUiState((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }))
    document.documentElement.classList.toggle("dark")
  }, [])

  // Update conversation state for specific session
  const updateConversationState = useCallback((sessionId: string, updates: Partial<ConversationState>) => {
    setConversationStates(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
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

  const allStagesCompleted = useMemo(
    () => currentConversationState.processingStages.every((stage) => stage.status === PROCESSING_STATUSES.COMPLETED),
    [currentConversationState.processingStages],
  )

  useEffect(() => {
    if (!currentConversationState.isProcessing || !currentSessionId) return

    const interval = setInterval(() => {
      setConversationStates(prev => {
        const currentState = prev[currentSessionId]
        if (!currentState) return prev

        const updated = [...currentState.processingStages]
        const processingIndex = updated.findIndex((stage) => stage.status === PROCESSING_STATUSES.PROCESSING)
        const queuedIndex = updated.findIndex((stage) => stage.status === PROCESSING_STATUSES.QUEUED)

        if (processingIndex !== -1) {
          const baseIncrement = 100 / (controlSettings.processingTime * 10)
          const randomVariation = Math.random() * 0.5 + 0.75
          const increment = baseIncrement * randomVariation

          updated[processingIndex].progress += increment
          if (updated[processingIndex].progress >= 100) {
            updated[processingIndex].status = PROCESSING_STATUSES.COMPLETED
            updated[processingIndex].progress = 100
            if (queuedIndex !== -1) {
              updated[queuedIndex].status = PROCESSING_STATUSES.PROCESSING
              updated[queuedIndex].progress = 0
            }
          }
        } else if (queuedIndex !== -1) {
          updated[queuedIndex].status = PROCESSING_STATUSES.PROCESSING
          updated[queuedIndex].progress = 0
        }

        return {
          ...prev,
          [currentSessionId]: {
            ...currentState,
            processingStages: updated
          }
        }
      })
    }, 200)

    return () => clearInterval(interval)
  }, [currentConversationState.isProcessing, controlSettings.processingTime, currentSessionId])

  useEffect(() => {
    if (allStagesCompleted && currentConversationState.isProcessing && currentSessionId) {
      setTimeout(() => {
        updateConversationState(currentSessionId, {
          isProcessing: false,
          step: CONVERSATION_STEPS.COMPLETED
        })
        setUiState((prev) => ({ ...prev, controlsDisabled: false }))

        if (currentSession) {
          const finalOutputMessage: Message = {
            id: Date.now().toString(),
            type: MESSAGE_TYPES.ASSISTANT,
            content: `Analysis Complete`,
            timestamp: new Date(),
            status: "completed",
          }

          updateSession(currentSessionId, {
            messages: [...currentSession.messages, finalOutputMessage],
            currentStep: CONVERSATION_STEPS.COMPLETED,
          })
        }
      }, 1000)
    }
  }, [allStagesCompleted, currentConversationState.isProcessing, currentSessionId, currentSession, updateConversationState, updateSession])

  useEffect(() => {
    if (currentConversationState.step === CONVERSATION_STEPS.COMPLETED) {
      setUiState((prev) => ({ ...prev, controlsDisabled: false }))
    }
  }, [currentConversationState.step])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <LeftPanel
        isOpen={panelState.leftOpen}
        onToggle={(open) => setPanelState((prev) => ({ ...prev, leftOpen: open }))}
        controlsDisabled={uiState.controlsDisabled}
        processingTime={controlSettings.processingTime}
        setProcessingTime={(time) => setControlSettings((prev) => ({ ...prev, processingTime: time }))}
        analyticsDepth={controlSettings.analyticsDepth}
        setAnalyticsDepth={(depth) => setControlSettings((prev) => ({ ...prev, analyticsDepth: depth }))}
        reportingStyle={controlSettings.reportingStyle}
        setReportingStyle={(style) => setControlSettings((prev) => ({ ...prev, reportingStyle: style }))}
        crossValidation={controlSettings.crossValidation}
        setCrossValidation={(validation) => setControlSettings((prev) => ({ ...prev, crossValidation: validation }))}
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
            // Start new conversation - create fresh state for new session
            setShowNewForm(true)
            setCurrentSessionId(null)
            setFormState((prev) => ({ ...prev, analysisTitle: "", analysisDomain: "", currentMessage: "" }))
            setUiState((prev) => ({ ...prev, controlsDisabled: false }))
          }}
          isDarkMode={uiState.isDarkMode}
          onToggleTheme={toggleTheme}
        />

        <MainContent
          showNewAnalysisForm={showNewForm}
          currentSession={currentSession}
          conversationStep={currentConversationState.step}
          isProcessing={currentConversationState.isProcessing}
          processingStages={currentConversationState.processingStages}
          analysisTitle={formState.analysisTitle}
          setAnalysisTitle={(title) => setFormState((prev) => ({ ...prev, analysisTitle: title }))}
          analysisDomain={formState.analysisDomain}
          setAnalysisDomain={(domain) => setFormState((prev) => ({ ...prev, analysisDomain: domain }))}
          currentMessage={formState.currentMessage}
          setCurrentMessage={(message) => setFormState((prev) => ({ ...prev, currentMessage: message }))}
          ambiguityQuestions={currentConversationState.ambiguityQuestions}
          setAmbiguityQuestions={(questions) => currentSessionId && updateConversationState(currentSessionId, { ambiguityQuestions: questions })}
          currentQuestionIndex={currentConversationState.currentQuestionIndex}
          setCurrentQuestionIndex={(index) => currentSessionId && updateConversationState(currentSessionId, { currentQuestionIndex: index })}
          ambiguityAnswers={currentConversationState.ambiguityAnswers}
          setAmbiguityAnswers={(answers) => currentSessionId && updateConversationState(currentSessionId, { ambiguityAnswers: answers })}
          awaitingUserResponse={currentConversationState.awaitingUserResponse}
          setAwaitingUserResponse={(awaiting) => currentSessionId && updateConversationState(currentSessionId, { awaitingUserResponse: awaiting })}
          contextConfirmationActive={currentConversationState.contextConfirmationActive}
          setContextConfirmationActive={(active) => currentSessionId && updateConversationState(currentSessionId, { contextConfirmationActive: active })}
          clickedButton={currentConversationState.clickedButton}
          setClickedButton={(button) => currentSessionId && updateConversationState(currentSessionId, { clickedButton: button })}
          onStartNewAnalysis={() => {
            if (!formState.analysisTitle || !formState.analysisDomain) return

            const sessionId = Date.now().toString()
            const newSession: AnalyticsSession = {
              id: sessionId,
              title: formState.analysisTitle,
              domain: formState.analysisDomain,
              messages: [],
              createdAt: new Date(),
              currentStep: CONVERSATION_STEPS.QUERY,
            }

            // Add new session to sessions list
            setSessions(prev => [newSession, ...prev])
            
            // Create fresh conversation state for this session
            setConversationStates(prev => ({
              ...prev,
              [sessionId]: createFreshConversationState()
            }))
            
            // Set as current session
            setCurrentSessionId(sessionId)
            setShowNewForm(false)
            setFormState((prev) => ({ ...prev, analysisTitle: "", analysisDomain: "" }))
          }}
          onSendMessage={() => {
            if (!formState.currentMessage.trim() || !currentSession || !currentSessionId) return

            const messageContent = formState.currentMessage.trim()

            if (currentConversationState.step === CONVERSATION_STEPS.QUERY) {
              const userMessage: Message = {
                id: Date.now().toString(),
                type: MESSAGE_TYPES.USER,
                content: messageContent,
                timestamp: new Date(),
              }

              updateSession(currentSessionId, {
                messages: [...currentSession.messages, userMessage],
              })
              setFormState((prev) => ({ ...prev, currentMessage: "" }))
              setUiState((prev) => ({ ...prev, controlsDisabled: true }))
              updateConversationState(currentSessionId, { awaitingUserResponse: false })

              setTimeout(() => {
                updateConversationState(currentSessionId, {
                  ambiguityQuestions: [...AMBIGUITY_QUESTIONS],
                  currentQuestionIndex: 0,
                  ambiguityAnswers: [],
                })

                const ambiguityMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  type: MESSAGE_TYPES.AMBIGUITY,
                  content: "I need to clarify a few domain-specific terms to ensure accurate analysis:",
                  timestamp: new Date(),
                  status: "active",
                  currentQuestion: AMBIGUITY_QUESTIONS[0],
                  expanded: true,
                }

                updateSession(currentSessionId, {
                  messages: [...currentSession.messages, userMessage, ambiguityMessage],
                  currentStep: CONVERSATION_STEPS.AMBIGUITY,
                })
                updateConversationState(currentSessionId, {
                  step: CONVERSATION_STEPS.AMBIGUITY,
                  awaitingUserResponse: true,
                })
              }, 1000)
            } else if (
              currentConversationState.step === CONVERSATION_STEPS.AMBIGUITY &&
              currentConversationState.awaitingUserResponse
            ) {
              const newAnswers = [...currentConversationState.ambiguityAnswers, messageContent]
              updateConversationState(currentSessionId, { ambiguityAnswers: newAnswers })
              setFormState((prev) => ({ ...prev, currentMessage: "" }))

              if (currentConversationState.currentQuestionIndex < currentConversationState.ambiguityQuestions.length - 1) {
                const nextIndex = currentConversationState.currentQuestionIndex + 1
                updateConversationState(currentSessionId, { currentQuestionIndex: nextIndex })

                setTimeout(() => {
                  const updatedAmbiguityMessage: Message = {
                    id: currentSession.messages.find((m) => m.type === MESSAGE_TYPES.AMBIGUITY)?.id || "",
                    type: MESSAGE_TYPES.AMBIGUITY,
                    content: "I need to clarify a few domain-specific terms to ensure accurate analysis:",
                    timestamp: new Date(),
                    status: "active",
                    currentQuestion: currentConversationState.ambiguityQuestions[nextIndex],
                    expanded: true,
                    answeredQuestions: nextIndex,
                    totalQuestions: currentConversationState.ambiguityQuestions.length,
                  }

                  updateSession(currentSessionId, {
                    messages: currentSession.messages.map((m) =>
                      m.type === MESSAGE_TYPES.AMBIGUITY ? updatedAmbiguityMessage : m,
                    ),
                  })
                }, 1000)
              } else {
                updateConversationState(currentSessionId, {
                  awaitingUserResponse: false,
                  contextConfirmationActive: true,
                })

                setTimeout(() => {
                  const completedAmbiguityMessage: Message = {
                    id: currentSession.messages.find((m) => m.type === MESSAGE_TYPES.AMBIGUITY)?.id || "",
                    type: MESSAGE_TYPES.AMBIGUITY,
                    content: "I need to clarify a few domain-specific terms to ensure accurate analysis:",
                    timestamp: new Date(),
                    status: "context_confirmation",
                    expanded: true,
                    interactions: currentConversationState.ambiguityQuestions.length,
                  }

                  updateSession(currentSessionId, {
                    messages: currentSession.messages.map((m) =>
                      m.type === MESSAGE_TYPES.AMBIGUITY ? completedAmbiguityMessage : m,
                    ),
                    currentStep: CONVERSATION_STEPS.CONTEXT,
                  })
                  updateConversationState(currentSessionId, { step: CONVERSATION_STEPS.CONTEXT })
                }, 1000)
              }
            }
          }}
          onStartAnalysis={() => {
            if (!currentSessionId) return
            
            updateConversationState(currentSessionId, {
              clickedButton: "clicked",
              contextConfirmationActive: false,
              step: CONVERSATION_STEPS.PROCESSING,
              isProcessing: true,
            })

            setTimeout(() => {
              updateSession(currentSessionId, {
                currentStep: CONVERSATION_STEPS.PROCESSING,
              })
            }, 1000)
          }}
          onContinueResolving={() => {
            if (!currentSessionId) return
            
            updateConversationState(currentSessionId, {
              clickedButton: null,
              contextConfirmationActive: false,
              awaitingUserResponse: true,
              ambiguityQuestions: [...currentConversationState.ambiguityQuestions, ...ADDITIONAL_QUESTIONS],
              currentQuestionIndex: currentConversationState.ambiguityQuestions.length,
            })

            setTimeout(() => {
              const updatedAmbiguityMessage: Message = {
                id: currentSession?.messages.find((m) => m.type === MESSAGE_TYPES.AMBIGUITY)?.id || "",
                type: MESSAGE_TYPES.AMBIGUITY,
                content: "I need to clarify a few domain-specific terms to ensure accurate analysis:",
                timestamp: new Date(),
                status: "active",
                currentQuestion: ADDITIONAL_QUESTIONS[0],
                expanded: true,
                answeredQuestions: currentConversationState.ambiguityQuestions.length,
                totalQuestions: currentConversationState.ambiguityQuestions.length + ADDITIONAL_QUESTIONS.length,
              }

              if (currentSession) {
                updateSession(currentSessionId, {
                  messages: currentSession.messages
                    .map((m) => (m.type === MESSAGE_TYPES.AMBIGUITY ? updatedAmbiguityMessage : m))
                    .filter((m) => m.type !== MESSAGE_TYPES.CONTEXT),
                })
                updateConversationState(currentSessionId, { step: CONVERSATION_STEPS.AMBIGUITY })
              }
            }, 1000)
          }}
          processingTime={controlSettings.processingTime}
          reportFormat={controlSettings.reportingStyle}
          crossValidation={controlSettings.crossValidation}
          leftPanelOpen={panelState.leftOpen}
          rightPanelOpen={panelState.rightOpen}
        />
      </div>

      <RightPanel
        isOpen={panelState.rightOpen}
        onToggle={(open) => setPanelState((prev) => ({ ...prev, rightOpen: open }))}
        sessions={sessions}
        currentSession={currentSession}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
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
        }}
      />
    </div>
  )
}

export { AnalyticsDashboard }