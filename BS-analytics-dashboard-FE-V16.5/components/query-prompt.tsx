"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Brain, Send } from "lucide-react"

interface QueryPromptProps {
  currentMessage: string
  setCurrentMessage: (message: string) => void
  onSendMessage: () => void
  isProcessing: boolean
}

export function QueryPrompt({ currentMessage, setCurrentMessage, onSendMessage, isProcessing }: QueryPromptProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">What would you like to analyze?</h3>
          <p className="text-muted-foreground">Describe your analysis requirements in detail</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Describe what you'd like to analyze..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
            className="flex-1 border-border h-12 text-base bg-background focus:border-primary/50 focus:ring-primary/20"
            disabled={isProcessing}
          />
          <Button
            onClick={onSendMessage}
            disabled={!currentMessage.trim() || isProcessing}
            className="bg-primary hover:bg-primary/90 h-12 px-6 transition-colors"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
