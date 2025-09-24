"use client"

import { UserMessage } from "./user-message"
import { AmbiguityMessage } from "./ambiguity-message"
import { AssistantMessage } from "./assistant-message"
import { ProcessingMessage } from "./processing-message"
import type { Message, ProcessingStage } from "../types"
import { ProcessingLogWindow } from "./processing-log-window"

interface MessageListProps {
  sessionId: string
  messages: Message[]
  conversationStep: "query" | "ambiguity" | "context" | "processing" | "completed"
  isProcessing: boolean
  processingStages: ProcessingStage[]
  ambiguityQuestions: string[]
  currentQuestionIndex: number
  ambiguityAnswers: string[]
  awaitingUserResponse: boolean
  contextConfirmationActive: boolean
  clickedButton: string | null
  onStartAnalysis: () => void
  onContinueResolving: () => void
  onForceStop?: () => void
  processingTime: number
  reportFormat: string
  crossValidation: string
}

export function MessageList({
  sessionId,
  messages,
  conversationStep,
  isProcessing,
  processingStages,
  ambiguityQuestions,
  currentQuestionIndex,
  ambiguityAnswers,
  awaitingUserResponse,
  contextConfirmationActive,
  clickedButton,
  onStartAnalysis,
  onContinueResolving,
  onForceStop,
  processingTime,
  reportFormat,
  crossValidation,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* FIXED: Display messages in chronological order based on timestamp */}
      {(() => {
        const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

        // FIXED: Deduplicate messages by ID to prevent duplicate rendering
        const uniqueMessages = sortedMessages.reduce((acc, message) => {
          if (!acc.find(m => m.id === message.id)) {
            acc.push(message)
          }
          return acc
        }, [] as typeof messages)

        const nonAssistantMessages = uniqueMessages.filter(m => m.type !== "assistant")
        let assistantMessages = uniqueMessages.filter(m => m.type === "assistant")

        // FIXED: If conversation is completed, only show the latest assistant message to prevent duplication
        if (conversationStep === "completed" && assistantMessages.length > 1) {
          // Sort assistant messages by timestamp and keep only the latest one
          assistantMessages = assistantMessages
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 1)
          console.log(`🔧 Filtered ${uniqueMessages.filter(m => m.type === "assistant").length} assistant messages to 1 for completed conversation`)
        }

        return (
          <>
            {/* Render all non-assistant messages first */}
            {nonAssistantMessages.map((message) => (
              <div key={message.id}>
                {message.type === "user" && (
                  <UserMessage message={message} />
                )}

                {message.type === "ambiguity" && (
                  <AmbiguityMessage
                    message={message}
                    sessionId={sessionId}
                    ambiguityQuestions={ambiguityQuestions}
                    currentQuestionIndex={currentQuestionIndex}
                    ambiguityAnswers={ambiguityAnswers}
                    awaitingUserResponse={awaitingUserResponse}
                    contextConfirmationActive={contextConfirmationActive}
                    clickedButton={clickedButton}
                    shouldAutoCollapse={false}
                    onStartAnalysis={onStartAnalysis}
                    onContinueResolving={onContinueResolving}
                  />
                )}
              </div>
            ))}

            {/* Render assistant messages */}
            {assistantMessages.map((message, index) => (
              <div key={message.id}>
                {/* Show processing log just before the latest assistant message when completed */}
                {!isProcessing && conversationStep === "completed" && index === assistantMessages.length - 1 && (
                  <ProcessingLogWindow
                    sessionId={sessionId}
                    isProcessing={false}
                    isVisible={true}
                  />
                )}
                <AssistantMessage
                  message={message}
                  sessionId={sessionId}
                  processingTime={processingTime}
                  reportFormat={reportFormat}
                  crossValidation={crossValidation}
                />
              </div>
            ))}
          </>
        )
      })()}

      {/* Processing Display - shown during processing */}
      {isProcessing && conversationStep === "processing" && (
        <>
          <ProcessingMessage
            sessionId={sessionId}
            processingStages={processingStages}
            onForceStop={onForceStop}
          />
          <ProcessingLogWindow
            sessionId={sessionId}
            isProcessing={isProcessing}
            isVisible={conversationStep === "processing"}
          />
        </>
      )}

    </div>
  )
}