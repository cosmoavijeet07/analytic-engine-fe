"use client"

import { useState } from "react"
import { ChevronDown, TrendingUp, Copy, Check, FileText, Brain } from "lucide-react"
// import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import type { Message } from "../types"

interface AssistantMessageProps {
  message: Message
  processingTime: number
  reportFormat: string
  crossValidation: string
}

export function AssistantMessage({ message, processingTime, reportFormat, crossValidation }: AssistantMessageProps) {
  const [assistantCollapsed, setAssistantCollapsed] = useState(true)
  const [copied, setCopied] = useState(false)

  const getTextContent = () => {
    return `BLUE SHERPA Analytics Engine

Executive Summary
Analysis completed successfully. The results show comprehensive insights based on your specified parameters and domain focus.

Key Findings
• Data Processing: All specified metrics have been analyzed

Performance Drivers
The analysis has identified key drivers influencing the results, including market trends, internal strategies, and external factors.

Recommendation: Review the detailed report for specific recommendations tailored to your analysis.

Analysis Strategy Summary:
- Processing Time: ${processingTime}s configured
- Report Format: ${reportFormat}
- Validation Level: ${crossValidation}`
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getTextContent())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  const handleExportPDF = () => {
    console.log("PDF export requested - feature coming soon")
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-4xl w-full">
        <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-foreground">BLUE SHERPA</div>
              <div className="text-sm text-muted-foreground">Analytics Engine</div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-foreground mb-3">Executive Summary</h3>
            <p className="text-foreground/80 mb-4">
              Analysis completed successfully. The results show comprehensive insights based on your specified
              parameters and domain focus.
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">Key Findings</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground/80">
              <li>
                <strong>Data Processing:</strong> All specified metrics have been analyzed
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground mb-3">Performance Drivers</h3>
            <p className="text-foreground/80 mb-4">
              The analysis has identified key drivers influencing the results, including market trends, internal
              strategies, and external factors.
            </p>

            <div className="bg-primary/10 border-l-4 border-primary p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-primary/80">
                    <strong>Recommendation:</strong> Review the detailed report for specific recommendations tailored to
                    your analysis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!assistantCollapsed && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground mb-2">Analysis Strategy Summary</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Processing Time:</span>
                  <span className="ml-1">{processingTime}s configured</span>
                </div>
                <div>
                  <span className="font-medium">Report Format:</span>
                  <span className="ml-1 capitalize">{reportFormat}</span>
                </div>
                <div>
                  <span className="font-medium">Validation Level:</span>
                  <span className="ml-1 capitalize">{crossValidation}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setAssistantCollapsed(!assistantCollapsed)}
            className="mt-2 text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${assistantCollapsed ? "rotate-180" : ""}`} />
            {assistantCollapsed ? "Show Details" : "Hide Details"}
          </button>
        </div>

        <div className="flex justify-start mt-2 gap-1">
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
              <button
                onClick={handleExportPDF}
                className="p-1.5 rounded-md hover:bg-accent transition-colors opacity-60 hover:opacity-100"
              >
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
        </div>
      </div>
    </div>
  )
}
