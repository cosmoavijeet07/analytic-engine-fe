"use client"

import { UserMessage } from "./user-message"
import { AmbiguityMessage } from "./ambiguity-message"
import { AssistantMessage } from "./assistant-message"
import { ProcessingMessage } from "./processing-message"
import type { Message, ProcessingStage } from "../types"
import { ProcessingLogWindow } from "./processing-log-window"

interface MessageListProps {
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
      {/* User Messages */}
      {messages
        .filter((message) => message.type === "user")
        .map((message) => (
          <UserMessage key={`user-${message.id}`} message={message} />
        ))}
      
      {/* System Messages */}
      {messages
        .filter((message) => message.type !== "user")
        .map((message) => (
          <div key={message.id}>
            {message.type === "ambiguity" && (
              <AmbiguityMessage
                message={message}
                ambiguityQuestions={ambiguityQuestions}
                currentQuestionIndex={currentQuestionIndex}
                ambiguityAnswers={ambiguityAnswers}
                awaitingUserResponse={awaitingUserResponse}
                contextConfirmationActive={contextConfirmationActive}
                clickedButton={clickedButton}
                shouldAutoCollapse={conversationStep === "processing" || isProcessing}
                onStartAnalysis={onStartAnalysis}
                onContinueResolving={onContinueResolving}
              />
            )}
          </div>
        ))}

      {/* Processing Display */}
      {isProcessing && conversationStep === "processing" && (
        <>
          <ProcessingMessage processingStages={processingStages} onForceStop={onForceStop} />
          <ProcessingLogWindow isProcessing={isProcessing} isVisible={conversationStep === "processing"} />
        </>
      )}

      {/* Processing Log Window for completed conversation - MOVED BEFORE assistant message */}
      {!isProcessing && conversationStep === "completed" && (
        <ProcessingLogWindow isProcessing={false} isVisible={true} />
      )}

      {/* Assistant Messages - MOVED AFTER processing log window */}
      {messages
        .filter((message) => message.type === "assistant")
        .map((message) => (
          <div key={message.id}>
            {conversationStep === "completed" && (
              <AssistantMessage
                message={message}
                processingTime={processingTime}
                reportFormat={reportFormat}
                crossValidation={crossValidation}
              />
            )}
          </div>
        ))}
    </div>
  )
}