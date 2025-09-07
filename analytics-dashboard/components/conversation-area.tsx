"use client"

import { SessionHeader } from "./session-header"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { QueryPrompt } from "./query-prompt"
import type { AnalyticsSession, ProcessingStage } from "../types"

interface ConversationAreaProps {
  currentSession: AnalyticsSession | null
  conversationStep: "query" | "ambiguity" | "context" | "processing" | "completed"
  isProcessing: boolean
  processingStages: ProcessingStage[]
  currentMessage: string
  setCurrentMessage: (message: string) => void
  ambiguityQuestions: string[]
  currentQuestionIndex: number
  ambiguityAnswers: string[]
  awaitingUserResponse: boolean
  contextConfirmationActive: boolean
  clickedButton: string | null
  onSendMessage: () => void
  onStartAnalysis: () => void
  onContinueResolving: () => void
  processingTime: number
  reportFormat: string
  crossValidation: string
}

export function ConversationArea({
  currentSession,
  conversationStep,
  isProcessing,
  processingStages,
  currentMessage,
  setCurrentMessage,
  ambiguityQuestions,
  currentQuestionIndex,
  ambiguityAnswers,
  awaitingUserResponse,
  contextConfirmationActive,
  clickedButton,
  onSendMessage,
  onStartAnalysis,
  onContinueResolving,
  processingTime,
  reportFormat,
  crossValidation,
}: ConversationAreaProps) {
  return (
    <div className="flex flex-col h-full">
      {conversationStep === "query" && currentSession?.messages.length === 0 ? (
        <QueryPrompt
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          onSendMessage={onSendMessage}
          isProcessing={isProcessing}
        />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            {currentSession && (
              <SessionHeader
                title={currentSession.title}
                domain={currentSession.domain}
                createdAt={currentSession.createdAt}
              />
            )}

            <MessageList
              messages={currentSession?.messages || []}
              conversationStep={conversationStep}
              isProcessing={isProcessing}
              processingStages={processingStages}
              ambiguityQuestions={ambiguityQuestions}
              currentQuestionIndex={currentQuestionIndex}
              ambiguityAnswers={ambiguityAnswers}
              awaitingUserResponse={awaitingUserResponse}
              contextConfirmationActive={contextConfirmationActive}
              clickedButton={clickedButton}
              onStartAnalysis={onStartAnalysis}
              onContinueResolving={onContinueResolving}
              processingTime={processingTime}
              reportFormat={reportFormat}
              crossValidation={crossValidation}
            />
          </div>

          <MessageInput
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            onSendMessage={onSendMessage}
            conversationStep={conversationStep}
            isProcessing={isProcessing}
            awaitingUserResponse={awaitingUserResponse}
            contextConfirmationActive={contextConfirmationActive}
          />
        </>
      )}
    </div>
  )
}
