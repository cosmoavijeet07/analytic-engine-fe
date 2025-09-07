"use client"

import { NewAnalysisForm } from "./new-analysis-form"
import { ConversationArea } from "./conversation-area"
import type { AnalyticsSession, ProcessingStage } from "../types"

interface MainContentProps {
  showNewAnalysisForm: boolean
  currentSession: AnalyticsSession | null
  conversationStep: "query" | "ambiguity" | "context" | "processing" | "completed"
  isProcessing: boolean
  processingStages: ProcessingStage[]
  analysisTitle: string
  setAnalysisTitle: (title: string) => void
  analysisDomain: string
  setAnalysisDomain: (domain: string) => void
  currentMessage: string
  setCurrentMessage: (message: string) => void
  ambiguityQuestions: string[]
  setAmbiguityQuestions: (questions: string[]) => void
  currentQuestionIndex: number
  setCurrentQuestionIndex: (index: number) => void
  ambiguityAnswers: string[]
  setAmbiguityAnswers: (answers: string[]) => void
  awaitingUserResponse: boolean
  setAwaitingUserResponse: (awaiting: boolean) => void
  contextConfirmationActive: boolean
  setContextConfirmationActive: (active: boolean) => void
  clickedButton: string | null
  setClickedButton: (button: string | null) => void
  onStartNewAnalysis: () => void
  onSendMessage: () => void
  onStartAnalysis: () => void
  onContinueResolving: () => void
  processingTime: number
  reportFormat: string
  crossValidation: string
  leftPanelOpen: boolean
  rightPanelOpen: boolean
}

export function MainContent({
  showNewAnalysisForm,
  currentSession,
  conversationStep,
  isProcessing,
  processingStages,
  analysisTitle,
  setAnalysisTitle,
  analysisDomain,
  setAnalysisDomain,
  currentMessage,
  setCurrentMessage,
  ambiguityQuestions,
  currentQuestionIndex,
  ambiguityAnswers,
  awaitingUserResponse,
  contextConfirmationActive,
  clickedButton,
  onStartNewAnalysis,
  onSendMessage,
  onStartAnalysis,
  onContinueResolving,
  processingTime,
  reportFormat,
  crossValidation,
  leftPanelOpen,
  rightPanelOpen,
}: MainContentProps) {
  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      {showNewAnalysisForm ? (
        <NewAnalysisForm
          analysisTitle={analysisTitle}
          setAnalysisTitle={setAnalysisTitle}
          analysisDomain={analysisDomain}
          setAnalysisDomain={setAnalysisDomain}
          onStartNewAnalysis={onStartNewAnalysis}
        />
      ) : (
        <ConversationArea
          currentSession={currentSession}
          conversationStep={conversationStep}
          isProcessing={isProcessing}
          processingStages={processingStages}
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          ambiguityQuestions={ambiguityQuestions}
          currentQuestionIndex={currentQuestionIndex}
          ambiguityAnswers={ambiguityAnswers}
          awaitingUserResponse={awaitingUserResponse}
          contextConfirmationActive={contextConfirmationActive}
          clickedButton={clickedButton}
          onSendMessage={onSendMessage}
          onStartAnalysis={onStartAnalysis}
          onContinueResolving={onContinueResolving}
          processingTime={processingTime}
          reportFormat={reportFormat}
          crossValidation={crossValidation}
        />
      )}
    </div>
  )
}
