"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, X } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"

interface MessageInputProps {
  sessionId: string
  currentMessage: string
  setCurrentMessage: (message: string) => void
  onSendMessage: () => void
  conversationStep: "query" | "ambiguity" | "context" | "processing" | "completed"
  isProcessing: boolean
  awaitingUserResponse: boolean
  contextConfirmationActive: boolean
  onEndConversation: () => void
  hasMessages: boolean
  isLoading?: boolean
  onAmbiguityAnswer?: (answer: string) => void
}

export function MessageInput({
  sessionId,
  currentMessage,
  setCurrentMessage,
  onSendMessage,
  conversationStep,
  isProcessing,
  awaitingUserResponse,
  contextConfirmationActive,
  onEndConversation,
  hasMessages,
  isLoading = false,
  onAmbiguityAnswer,
}: MessageInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!currentMessage.trim() || isSubmitting || isLoading || !sessionId) return

    setIsSubmitting(true)

    try {
      if (conversationStep === "ambiguity" && awaitingUserResponse && onAmbiguityAnswer) {
        // FIXED: Only call onAmbiguityAnswer which handles the API call internally
        // Don't make duplicate API calls here
        onAmbiguityAnswer(currentMessage.trim())
        setCurrentMessage("")
      } else if (conversationStep === "completed" || conversationStep === "query") {
        // Handle regular message or follow-up queries
        await onSendMessage()
      } else {
        // Handle any other cases as regular messages
        await onSendMessage()
      }

      toast({
        title: "Message sent",
        description: "Your message has been processed.",
      })
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getPlaceholder = () => {
    if (conversationStep === "completed") {
      return "Ask a follow-up question..."
    } else if (awaitingUserResponse) {
      return "Type your response..."
    } else if (isProcessing) {
      return "Processing in progress..."
    } else if (contextConfirmationActive) {
      return "Awaiting context confirmation..."
    } else {
      return "Type your message..."
    }
  }

  const isInputDisabled = () => {
    // FIXED: Allow input for follow-up queries after completion
    return (
      isLoading ||
      isSubmitting ||
      isProcessing ||
      (conversationStep === "context" && !awaitingUserResponse) ||
      (conversationStep === "processing") ||
      (contextConfirmationActive && conversationStep !== "ambiguity")
    )
  }

  const isSendDisabled = () => {
    return (
      !currentMessage.trim() ||
      isInputDisabled()
    )
  }

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
            disabled={isLoading || isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <Input
          placeholder={getPlaceholder()}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 border-border bg-background focus:border-primary/50 focus:ring-primary/20"
          disabled={isInputDisabled()}
        />
        
        <Button
          onClick={handleSubmit}
          disabled={isSendDisabled()}
          className="bg-primary hover:bg-primary/90 transition-colors"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {conversationStep === "ambiguity" && awaitingUserResponse && (
        <div className="mt-2 text-xs text-muted-foreground">
          Answering ambiguity question - your response will help clarify the analysis requirements.
        </div>
      )}
    </div>
  )
}