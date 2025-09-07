"use client"
import { useState, useEffect } from "react"
import { LeftPanel } from "./left-panel"
import { RightPanel } from "./right-panel"
import { MainContent } from "./main-content"
import { DashboardHeader } from "./header"
import type { AnalyticsSession, Message, ProcessingStage } from "../types"

export default function AnalyticsDashboard() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [currentSession, setCurrentSession] = useState<AnalyticsSession | null>(null)
  const [sessions, setSessions] = useState<AnalyticsSession[]>([])
  const [showNewAnalysisForm, setShowNewAnalysisForm] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const [controlsDisabled, setControlsDisabled] = useState(false)
  const [processingTime, setProcessingTime] = useState(5)
  const [analyticsDepth, setAnalyticsDepth] = useState("moderate")
  const [reportingStyle, setReportingStyle] = useState("detailed")
  const [crossValidation, setCrossValidation] = useState("medium")
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [realTimeUpdates, setRealTimeUpdates] = useState(false)

  // Form State
  const [analysisTitle, setAnalysisTitle] = useState("")
  const [analysisDomain, setAnalysisDomain] = useState("")
  const [currentMessage, setCurrentMessage] = useState("")

  const [conversationStep, setConversationStep] = useState<
    "query" | "ambiguity" | "context" | "processing" | "completed"
  >("query")

  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([
    { id: "database", name: "Database Analysis", icon: "Database", status: "queued", progress: 0 },
    { id: "pattern", name: "Pattern Recognition", icon: "TrendingUp", status: "queued", progress: 0 },
    { id: "code", name: "Code Generation", icon: "Code", status: "queued", progress: 0 },
    { id: "report", name: "Report Synthesis", icon: "FileText", status: "queued", progress: 0 },
  ])

  const [ambiguityQuestions, setAmbiguityQuestions] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [ambiguityAnswers, setAmbiguityAnswers] = useState<string[]>([])
  const [awaitingUserResponse, setAwaitingUserResponse] = useState(false)
  const [contextConfirmationActive, setContextConfirmationActive] = useState(false)
  const [clickedButton, setClickedButton] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setProcessingStages((prev) => {
          const updated = [...prev]
          const processingIndex = updated.findIndex((stage) => stage.status === "processing")
          const queuedIndex = updated.findIndex((stage) => stage.status === "queued")

          if (processingIndex !== -1) {
            const baseIncrement = 100 / (processingTime * 10)
            const randomVariation = Math.random() * 0.5 + 0.75
            const increment = baseIncrement * randomVariation

            updated[processingIndex].progress += increment
            if (updated[processingIndex].progress >= 100) {
              updated[processingIndex].status = "completed"
              updated[processingIndex].progress = 100
              if (queuedIndex !== -1) {
                updated[queuedIndex].status = "processing"
                updated[queuedIndex].progress = 0
              }
            }
          } else if (queuedIndex !== -1) {
            updated[queuedIndex].status = "processing"
            updated[queuedIndex].progress = 0
          }

          const allCompleted = updated.every((stage) => stage.status === "completed")
          if (allCompleted && isProcessing) {
            setTimeout(() => {
              setIsProcessing(false)
              setConversationStep("completed")
              setControlsDisabled(false)

              if (currentSession) {
                const finalOutputMessage: Message = {
                  id: Date.now().toString(),
                  type: "assistant",
                  content: `Analysis Complete`,
                  timestamp: new Date(),
                  status: "completed",
                }

                const updatedSession = {
                  ...currentSession,
                  messages: [...currentSession.messages, finalOutputMessage],
                  currentStep: "completed" as const,
                }

                setCurrentSession(updatedSession)
                setSessions((prev) => prev.map((s) => (s.id === currentSession.id ? updatedSession : s)))
              }
            }, 1000)
          }

          return updated
        })
      }, 200)

      return () => clearInterval(interval)
    }
  }, [isProcessing, processingTime, currentSession])

  useEffect(() => {
    if (conversationStep === "completed") {
      setControlsDisabled(false)
    }
  }, [conversationStep])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <LeftPanel
        isOpen={leftPanelOpen}
        onToggle={setLeftPanelOpen}
        controlsDisabled={controlsDisabled}
        processingTime={processingTime}
        setProcessingTime={setProcessingTime}
        analyticsDepth={analyticsDepth}
        setAnalyticsDepth={setAnalyticsDepth}
        reportingStyle={reportingStyle}
        setReportingStyle={setReportingStyle}
        crossValidation={crossValidation}
        setCrossValidation={setCrossValidation}
        showAdvancedSettings={showAdvancedSettings}
        setShowAdvancedSettings={setShowAdvancedSettings}
        autoSave={autoSave}
        setAutoSave={setAutoSave}
        realTimeUpdates={realTimeUpdates}
        setRealTimeUpdates={setRealTimeUpdates}
        isProcessing={isProcessing}
      />

      <div className="flex flex-col min-w-0 flex-1 max-w-4xl mx-auto">
        <DashboardHeader
          leftPanelOpen={leftPanelOpen}
          rightPanelOpen={rightPanelOpen}
          onToggleLeftPanel={setLeftPanelOpen}
          onToggleRightPanel={setRightPanelOpen}
          onNewAnalysis={() => {
            setShowNewAnalysisForm(true)
            setCurrentSession(null)
            setConversationStep("query")
            setControlsDisabled(false)
          }}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        <MainContent
          showNewAnalysisForm={showNewAnalysisForm}
          currentSession={currentSession}
          conversationStep={conversationStep}
          isProcessing={isProcessing}
          processingStages={processingStages}
          analysisTitle={analysisTitle}
          setAnalysisTitle={setAnalysisTitle}
          analysisDomain={analysisDomain}
          setAnalysisDomain={setAnalysisDomain}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          ambiguityQuestions={ambiguityQuestions}
          setAmbiguityQuestions={setAmbiguityQuestions}
          currentQuestionIndex={currentQuestionIndex}
          setCurrentQuestionIndex={setCurrentQuestionIndex}
          ambiguityAnswers={ambiguityAnswers}
          setAmbiguityAnswers={setAmbiguityAnswers}
          awaitingUserResponse={awaitingUserResponse}
          setAwaitingUserResponse={setAwaitingUserResponse}
          contextConfirmationActive={contextConfirmationActive}
          setContextConfirmationActive={setContextConfirmationActive}
          clickedButton={clickedButton}
          setClickedButton={setClickedButton}
          onStartNewAnalysis={() => {
            if (!analysisTitle || !analysisDomain) return

            const newSession: AnalyticsSession = {
              id: Date.now().toString(),
              title: analysisTitle,
              domain: analysisDomain,
              messages: [],
              createdAt: new Date(),
              currentStep: "query",
            }

            setSessions((prev) => [newSession, ...prev])
            setCurrentSession(newSession)
            setShowNewAnalysisForm(false)
            setAnalysisTitle("")
            setAnalysisDomain("")
            setConversationStep("query")
          }}
          onSendMessage={() => {
            if (!currentMessage.trim() || !currentSession) return

            const messageContent = currentMessage.trim()

            if (conversationStep === "query") {
              const userMessage: Message = {
                id: Date.now().toString(),
                type: "user",
                content: messageContent,
                timestamp: new Date(),
              }

              const updatedSession = {
                ...currentSession,
                messages: [...currentSession.messages, userMessage],
              }

              setCurrentSession(updatedSession)
              setSessions((prev) => prev.map((s) => (s.id === currentSession.id ? updatedSession : s)))
              setCurrentMessage("")

              setControlsDisabled(true)
              setAwaitingUserResponse(false)

              setTimeout(() => {
                const questions = [
                  'By "regional differences" - do you mean geographical regions, sales territories, or market segments?',
                  'For "customer acquisition metrics" - should I include CAC, LTV, or specific conversion rates?',
                  "What time period should I use for Q3 and Q4 comparison (calendar year or fiscal year)?",
                ]

                setAmbiguityQuestions(questions)
                setCurrentQuestionIndex(0)
                setAmbiguityAnswers([])

                const ambiguityMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  type: "ambiguity",
                  content: "I need to clarify a few domain-specific terms to ensure accurate analysis:",
                  timestamp: new Date(),
                  status: "active",
                  currentQuestion: questions[0],
                  expanded: true,
                }

                setCurrentSession((prevSession) => {
                  const sessionWithAmbiguity = {
                    ...prevSession!,
                    messages: [...prevSession!.messages, ambiguityMessage],
                    currentStep: "ambiguity" as const,
                  }
                  setSessions((prev) => prev.map((s) => (s.id === prevSession!.id ? sessionWithAmbiguity : s)))
                  return sessionWithAmbiguity
                })
                setConversationStep("ambiguity")
                setAwaitingUserResponse(true)
              }, 1000)
            } else if (conversationStep === "ambiguity" && awaitingUserResponse) {
              const newAnswers = [...ambiguityAnswers, messageContent]
              setAmbiguityAnswers(newAnswers)
              setCurrentMessage("")

              if (currentQuestionIndex < ambiguityQuestions.length - 1) {
                const nextIndex = currentQuestionIndex + 1
                setCurrentQuestionIndex(nextIndex)

                setTimeout(() => {
                  const updatedAmbiguityMessage: Message = {
                    id: currentSession.messages.find((m) => m.type === "ambiguity")?.id || "",
                    type: "ambiguity",
                    content: "I need to clarify a few domain-specific terms to ensure accurate analysis:",
                    timestamp: new Date(),
                    status: "active",
                    currentQuestion: ambiguityQuestions[nextIndex],
                    expanded: true,
                    answeredQuestions: nextIndex,
                    totalQuestions: ambiguityQuestions.length,
                  }

                  const sessionWithUpdatedAmbiguity = {
                    ...currentSession,
                    messages: currentSession.messages.map((m) =>
                      m.type === "ambiguity" ? updatedAmbiguityMessage : m,
                    ),
                  }

                  setCurrentSession(sessionWithUpdatedAmbiguity)
                  setSessions((prev) => prev.map((s) => (s.id === currentSession.id ? sessionWithUpdatedAmbiguity : s)))
                }, 1000)
              } else {
                setAwaitingUserResponse(false)
                setContextConfirmationActive(true)

                setTimeout(() => {
                  const completedAmbiguityMessage: Message = {
                    id: currentSession.messages.find((m) => m.type === "ambiguity")?.id || "",
                    type: "ambiguity",
                    content: "I need to clarify a few domain-specific terms to ensure accurate analysis:",
                    timestamp: new Date(),
                    status: "context_confirmation",
                    expanded: true,
                    interactions: ambiguityQuestions.length,
                  }

                  const sessionWithContext = {
                    ...currentSession,
                    messages: currentSession.messages.map((m) =>
                      m.type === "ambiguity" ? completedAmbiguityMessage : m,
                    ),
                    currentStep: "context" as const,
                  }

                  setCurrentSession(sessionWithContext)
                  setSessions((prev) => prev.map((s) => (s.id === currentSession.id ? sessionWithContext : s)))
                  setConversationStep("context")
                }, 1000)
              }
            }
          }}
          onStartAnalysis={() => {
            setClickedButton("clicked")
            setContextConfirmationActive(false)
            setConversationStep("processing")
            setIsProcessing(true)

            setTimeout(() => {
              if (currentSession) {
                const sessionWithProcessing = {
                  ...currentSession,
                  currentStep: "processing" as const,
                }

                setCurrentSession(sessionWithProcessing)
                setSessions((prev) => prev.map((s) => (s.id === currentSession.id ? sessionWithProcessing : s)))
              }
            }, 1000)
          }}
          onContinueResolving={() => {
            setClickedButton(null)
            setContextConfirmationActive(false)
            setAwaitingUserResponse(true)

            const additionalQuestions = [
              "Should I include seasonal adjustments in the analysis?",
              "Do you want to segment by product categories or customer types?",
            ]

            setAmbiguityQuestions([...ambiguityQuestions, ...additionalQuestions])
            setCurrentQuestionIndex(ambiguityQuestions.length)

            setTimeout(() => {
              const updatedAmbiguityMessage: Message = {
                id: currentSession?.messages.find((m) => m.type === "ambiguity")?.id || "",
                type: "ambiguity",
                content: "I need to clarify a few domain-specific terms to ensure accurate analysis:",
                timestamp: new Date(),
                status: "active",
                currentQuestion: additionalQuestions[0],
                expanded: true,
                answeredQuestions: ambiguityQuestions.length,
                totalQuestions: ambiguityQuestions.length + additionalQuestions.length,
              }

              if (currentSession) {
                const sessionWithUpdatedAmbiguity = {
                  ...currentSession,
                  messages: currentSession.messages
                    .map((m) => (m.type === "ambiguity" ? updatedAmbiguityMessage : m))
                    .filter((m) => m.type !== "context"),
                }

                setCurrentSession(sessionWithUpdatedAmbiguity)
                setSessions((prev) => prev.map((s) => (s.id === currentSession.id ? sessionWithUpdatedAmbiguity : s)))
                setConversationStep("ambiguity")
              }
            }, 1000)
          }}
          processingTime={processingTime}
          reportFormat={reportingStyle}
          crossValidation={crossValidation}
          leftPanelOpen={leftPanelOpen}
          rightPanelOpen={rightPanelOpen}
        />
      </div>

      <RightPanel
        isOpen={rightPanelOpen}
        onToggle={setRightPanelOpen}
        sessions={sessions}
        currentSession={currentSession}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectSession={(session) => {
          setCurrentSession(session)
          setShowNewAnalysisForm(false)
          setConversationStep(session.currentStep)
        }}
      />
    </div>
  )
}

export { AnalyticsDashboard }
