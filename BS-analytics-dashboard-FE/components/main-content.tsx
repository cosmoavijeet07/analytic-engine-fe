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
  currentQuestionIndex: number
  ambiguityAnswers: string[]
  awaitingUserResponse: boolean
  contextConfirmationActive: boolean
  clickedButton: string | null
  onStartNewAnalysis: () => void
  onSendMessage: () => void
  onStartAnalysis: () => void
  onContinueResolving: () => void
  onForceStop?: () => void
  onEndConversation: () => void
  isConversationEnded: boolean
  hasMessages: boolean
  processingTime: number
  reportFormat: string
  crossValidation: string
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  isLoading?: boolean
  onAmbiguityAnswer: (answer: string) => void
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
  onForceStop,
  onEndConversation,
  isConversationEnded,
  hasMessages,
  processingTime,
  reportFormat,
  crossValidation,
  leftPanelOpen,
  rightPanelOpen,
  isLoading = false,
  onAmbiguityAnswer,
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
          isLoading={isLoading}
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
          onForceStop={onForceStop}
          onEndConversation={onEndConversation}
          isConversationEnded={isConversationEnded}
          hasMessages={hasMessages}
          processingTime={processingTime}
          reportFormat={reportFormat}
          crossValidation={crossValidation}
          onAmbiguityAnswer={onAmbiguityAnswer}
        />
      )}
    </div>
  )
}