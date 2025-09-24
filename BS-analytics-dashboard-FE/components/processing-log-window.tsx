"use client"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Terminal, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api-service"
import type { ProcessingLog } from "@/types/api"

interface LogEntry {
  id: string
  timestamp: Date
  message: string
  type: "info" | "success" | "warning" | "error"
}

interface ProcessingLogWindowProps {
  sessionId: string
  isProcessing: boolean
  isVisible: boolean
  onAutoCollapse?: () => void
}

const convertApiLogToLogEntry = (apiLog: ProcessingLog): LogEntry => ({
  id: apiLog.id,
  timestamp: new Date(apiLog.timestamp),
  message: apiLog.message,
  type: apiLog.type,
})

export function ProcessingLogWindow({ sessionId, isProcessing, isVisible, onAutoCollapse }: ProcessingLogWindowProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)

  // Load logs from API
  const loadLogs = async () => {
    if (!sessionId || !isVisible) return

    try {
      setIsLoading(true)
      const apiLogs = await apiService.getProcessingLogs(sessionId)
      const convertedLogs = apiLogs.map(convertApiLogToLogEntry)
      setLogs(convertedLogs)
    } catch (error) {
      console.error("Failed to load processing logs:", error)
      // Fallback to empty logs array
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  // Start polling for logs when processing
  useEffect(() => {
    if (isProcessing && isVisible && sessionId) {
      // Load logs immediately
      loadLogs()
      
      // Set up polling with more frequent updates during processing
      const interval = setInterval(() => {
        loadLogs()
      }, 1500) // Poll every 1.5 seconds during processing for better real-time feedback
      
      setPollInterval(interval)
      
      return () => {
        clearInterval(interval)
        setPollInterval(null)
      }
    } else if (!isProcessing && sessionId && isVisible) {
      // Load logs once when processing completes
      loadLogs()
      
      // Clear any existing polling
      if (pollInterval) {
        clearInterval(pollInterval)
        setPollInterval(null)
      }
    }
  }, [isProcessing, isVisible, sessionId])

  // Auto-collapse when processing finishes - increased delay for better UX
  useEffect(() => {
    if (!isProcessing && logs.length > 0 && isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
        onAutoCollapse?.()
      }, 8000) // Auto-collapse after 8 seconds for better readability
      return () => clearTimeout(timer)
    }
  }, [isProcessing, logs.length, isExpanded, onAutoCollapse])

  // Reset logs when processing starts
  useEffect(() => {
    if (isProcessing && isVisible) {
      setIsExpanded(true)
    }
  }, [isProcessing, isVisible])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [pollInterval])

  if (!isVisible) return null

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getLogTypeColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "error":
        return "text-red-400"
      default:
        return "text-blue-400"
    }
  }

  return (
    <div className="flex justify-start mt-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full shadow-sm">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Processing Logs</span>
            {logs.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {logs.length} entries
              </span>
            )}
            {isLoading && (
              <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {isProcessing && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </div>
            )}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Log Content */}
        <div
          className={cn("overflow-hidden transition-all duration-300 ease-in-out", isExpanded ? "max-h-96" : "max-h-0")}
        >
          <div className="border-t border-border">
            {isLoading && logs.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  Loading logs...
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {isProcessing ? "Waiting for log entries..." : "No logs available"}
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors text-sm font-mono"
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(log.timestamp)}</span>
                      </div>
                      <div className={cn("flex-1 min-w-0", getLogTypeColor(log.type))}>{log.message}</div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex items-start gap-3 p-2 rounded-md text-sm font-mono animate-pulse">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>Live</span>
                      </div>
                      <div className="flex-1 min-w-0 text-blue-400">Processing in progress...</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}