"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ChevronDown, CheckCircle } from "lucide-react"
import type { Message } from "@/types"

interface AmbiguityMessageProps {
  message: Message
  ambiguityQuestions: string[]
  currentQuestionIndex: number
  ambiguityAnswers: string[]
  awaitingUserResponse: boolean
  contextConfirmationActive: boolean
  clickedButton: string | null
  shouldAutoCollapse?: boolean
  onStartAnalysis: () => void
  onContinueResolving: () => void
}

export function AmbiguityMessage({
  message,
  ambiguityQuestions,
  currentQuestionIndex,
  ambiguityAnswers,
  awaitingUserResponse,
  contextConfirmationActive,
  clickedButton,
  shouldAutoCollapse = false,
  onStartAnalysis,
  onContinueResolving,
}: AmbiguityMessageProps) {
  const [ambiguityCollapsed, setAmbiguityCollapsed] = useState(false)

  useEffect(() => {
    if (shouldAutoCollapse) {
      setAmbiguityCollapsed(true)
    }
  }, [shouldAutoCollapse])

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 rounded-lg p-4 max-w-2xl w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="font-medium text-orange-900 dark:text-orange-100">Ambiguity Resolver</span>
            {message.status === "completed" && (
              <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800/30 font-medium">
                Resolved Context
              </span>
            )}
            {message.status === "context_confirmation" && (
              <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800/30 font-medium">
                Resolved Context
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {message.status === "active" && message.answeredQuestions !== undefined && (
              <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full">
                {message.answeredQuestions} answered
              </span>
            )}
            <button
              onClick={() => setAmbiguityCollapsed(!ambiguityCollapsed)}
              className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${ambiguityCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {!ambiguityCollapsed && (
          <div className="mt-4">
            {message.status === "active" && (
              <div className="space-y-3">
                <p className="text-sm text-orange-700 dark:text-orange-300">{message.content}</p>

                {ambiguityAnswers.map((answer, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2"></div>
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-200">{ambiguityQuestions[index]}</p>
                      <p className="text-emerald-700 dark:text-emerald-300 mt-1">→ {answer}</p>
                    </div>
                  </div>
                ))}

                {message.currentQuestion && (
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 animate-pulse"></div>
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-200">{message.currentQuestion}</p>
                      <p className="text-orange-600 dark:text-orange-400 mt-1 italic">Awaiting your response...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {message.status === "context_confirmation" && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {ambiguityAnswers.map((answer, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2"></div>
                      <div>
                        <p className="font-medium text-orange-800 dark:text-orange-200">{ambiguityQuestions[index]}</p>
                        <p className="text-emerald-700 dark:text-emerald-300 mt-1">→ {answer}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-emerald-900 dark:text-emerald-100">Context Confirmed</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-emerald-800 dark:text-emerald-200">Domain Context:</span>
                      <span className="text-emerald-700 dark:text-emerald-300 ml-1">
                        Finance - Sales Performance Analysis
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-emerald-800 dark:text-emerald-200">Scope:</span>
                      <span className="text-emerald-700 dark:text-emerald-300 ml-1">
                        Q4 vs Q3 comparison • Regional focus
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-emerald-800 dark:text-emerald-200">Regions:</span>
                      <span className="text-emerald-700 dark:text-emerald-300 ml-1">
                        North America, Europe, Asia-Pacific
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-emerald-800 dark:text-emerald-200">Metrics:</span>
                      <span className="text-emerald-700 dark:text-emerald-300 ml-1">
                        Revenue growth, CAC, conversion rates, product categories
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {clickedButton !== "clicked" && (
                      <Button
                        onClick={onStartAnalysis}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        size="sm"
                      >
                        Start Analysis
                      </Button>
                    )}
                    {clickedButton !== "clicked" && (
                      <Button
                        onClick={onContinueResolving}
                        variant="outline"
                        className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 bg-transparent transition-colors"
                        size="sm"
                      >
                        Continue Resolving
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
