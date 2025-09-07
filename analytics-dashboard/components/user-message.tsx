"use client"

import { useState } from "react"
import { User, Copy, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import type { Message } from "../types"

interface UserMessageProps {
  message: Message
}

export function UserMessage({ message }: UserMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%]">
        <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">You</span>
            <span className="text-xs opacity-80">
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        <div className="flex justify-end mt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors opacity-60 hover:opacity-100"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
