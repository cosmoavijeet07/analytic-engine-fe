"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Send, X } from "lucide-react"

interface MessageInputProps {
  currentMessage: string
  setCurrentMessage: (message: string) => void
  onSendMessage: () => void
  conversationStep: "query" | "ambiguity" | "context" | "processing" | "completed"
  isProcessing: boolean
  awaitingUserResponse: boolean
  contextConfirmationActive: boolean
  onEndConversation: () => void
  hasMessages: boolean
}

export function MessageInput({
  currentMessage,
  setCurrentMessage,
  onSendMessage,
  conversationStep,
  isProcessing,
  awaitingUserResponse,
  contextConfirmationActive,
  onEndConversation,
  hasMessages,
}: MessageInputProps) {
  return (
      <div className="p-4 border-border bg-background flex-shrink-0 border-t-0">
        <div className="flex gap-2 items-center">
        {hasMessages && (
          <Button
            onClick={onEndConversation}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors p-2"
            title="End conversation"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

          <Input
            placeholder={
              conversationStep === "completed"
                ? "Ask a follow-up question..."
                : awaitingUserResponse
                  ? "Type your response..."
                  : "Processing in progress..."
            }
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
            className="flex-1 border-border bg-background focus:border-primary/50 focus:ring-primary/20"
            disabled={
              isProcessing || (conversationStep !== "completed" && !awaitingUserResponse) || contextConfirmationActive
            }
          />
              <Button
                onClick={onSendMessage}
                disabled={
                  !currentMessage.trim() ||
                  isProcessing ||
                  (conversationStep !== "completed" && !awaitingUserResponse) ||
                  contextConfirmationActive
                }
                className="bg-primary hover:bg-primary/90 transition-colors"
              >
                <Send className="h-4 w-4" />
              </Button>
        </div>
      </div>
  )
}
