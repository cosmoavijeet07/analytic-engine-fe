// Fixed conversation-area.tsx - Properly handle message display
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
  onForceStop?: () => void
  onEndConversation: () => void
  isConversationEnded: boolean
  hasMessages: boolean
  processingTime: number
  reportFormat: string
  crossValidation: string
  onAmbiguityAnswer: (answer: string) => void
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
  onForceStop,
  onEndConversation,
  isConversationEnded,
  hasMessages,
  processingTime,
  reportFormat,
  crossValidation,
  onAmbiguityAnswer,
}: ConversationAreaProps) {
  // FIXED: Show query prompt only when there are no messages AND step is query
  const showQueryPrompt = conversationStep === "query" && (!currentSession?.messages || currentSession.messages.length === 0)

  return (
    <div className="flex flex-col h-full">
      {showQueryPrompt ? (
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
              sessionId={currentSession?.id || ""}
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
              onForceStop={onForceStop}
              processingTime={processingTime}
              reportFormat={reportFormat}
              crossValidation={crossValidation}
            />
          </div>

           {!isConversationEnded ? (
            <MessageInput
              sessionId={currentSession?.id || ""}
              currentMessage={currentMessage}
              setCurrentMessage={setCurrentMessage}
              onSendMessage={onSendMessage}
              conversationStep={conversationStep}
              isProcessing={isProcessing}
              awaitingUserResponse={awaitingUserResponse}
              contextConfirmationActive={contextConfirmationActive}
              onEndConversation={onEndConversation}
              hasMessages={hasMessages}
              onAmbiguityAnswer={onAmbiguityAnswer}
            />
          ) : (
            <div className="border-t border-border bg-background/50 backdrop-blur-sm p-4">
              <div className="flex items-center justify-center">
                <span className="text-sm text-muted-foreground font-medium">Conversation ended</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}