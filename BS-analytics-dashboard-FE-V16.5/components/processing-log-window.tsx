"use client"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Terminal, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogEntry {
  id: string
  timestamp: Date
  message: string
  type: "info" | "success" | "warning" | "error"
}

interface ProcessingLogWindowProps {
  isProcessing: boolean
  isVisible: boolean
  onAutoCollapse?: () => void
}

const DUMMY_LOGS: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 5000),
    message: "Initializing cognitive processing pipeline...",
    type: "info",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 4500),
    message: "Loading domain-specific knowledge base",
    type: "info",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 4000),
    message: "Parsing user query and extracting key entities",
    type: "success",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 3500),
    message: "Validating data sources and connections",
    type: "info",
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 3000),
    message: "Applying contextual filters and constraints",
    type: "success",
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 2500),
    message: "Executing analytical algorithms...",
    type: "info",
  },
  {
    id: "7",
    timestamp: new Date(Date.now() - 2000),
    message: "Cross-referencing results with historical patterns",
    type: "info",
  },
  {
    id: "8",
    timestamp: new Date(Date.now() - 1500),
    message: "Generating insights and recommendations",
    type: "success",
  },
]

export function ProcessingLogWindow({ isProcessing, isVisible, onAutoCollapse }: ProcessingLogWindowProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logIndex, setLogIndex] = useState(0)

  // Add logs progressively during processing
  useEffect(() => {
    if (!isProcessing || !isVisible) return

    const interval = setInterval(() => {
      if (logIndex < DUMMY_LOGS.length) {
        setLogs((prev) => [...prev, DUMMY_LOGS[logIndex]])
        setLogIndex((prev) => prev + 1)
      }
    }, 800)

    return () => clearInterval(interval)
  }, [isProcessing, isVisible, logIndex])

  // Auto-collapse when processing finishes
  useEffect(() => {
    if (!isProcessing && logs.length > 0 && isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
        onAutoCollapse?.()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isProcessing, logs.length, isExpanded, onAutoCollapse])

  // Reset logs when processing starts
  useEffect(() => {
    if (isProcessing && isVisible) {
      setLogs([])
      setLogIndex(0)
      setIsExpanded(true)
    }
  }, [isProcessing, isVisible])

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
            {logs.length === 0 ? (
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
