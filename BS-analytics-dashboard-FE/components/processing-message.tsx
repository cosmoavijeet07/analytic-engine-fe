"use client"
import { useState, useEffect } from "react"
import { Clock, Database, TrendingUp, Code, FileText, Square } from "lucide-react"
import { apiService } from "@/lib/api-service"
import type { ProcessingStage } from "../types"

interface ProcessingMessageProps {
  sessionId?: string
  processingStages: ProcessingStage[]
  onForceStop?: () => void
}

const iconMap = {
  Database,
  TrendingUp,
  Code,
  FileText,
}

export function ProcessingMessage({ sessionId, processingStages, onForceStop }: ProcessingMessageProps) {
  const [estimatedCompletion, setEstimatedCompletion] = useState<string>("2-3 minutes")
  const [currentTime, setCurrentTime] = useState(new Date())

  // DEBUG: Log the processing stages data with details
  console.log("🔍 ProcessingMessage received stages:", processingStages.map(s => ({
    name: s.name,
    progress: s.progress,
    status: s.status
  })))

  // Fallback processing stages when backend data is lost
  const fallbackStages = [
    { id: 'planning', name: 'Planning', icon: 'FileText', status: 'processing', progress: 45 },
    { id: 'coding', name: 'Coding', icon: 'Code', status: 'queued', progress: 0 },
    { id: 'verification', name: 'In-conversation Verification', icon: 'Database', status: 'queued', progress: 0 },
    { id: 'execution', name: 'Execution', icon: 'TrendingUp', status: 'queued', progress: 0 },
    { id: 'fixing', name: 'Code-fixing', icon: 'Code', status: 'queued', progress: 0 },
    { id: 'optimization', name: 'Plan Optimization', icon: 'TrendingUp', status: 'queued', progress: 0 },
    { id: 'summarization', name: 'Summarization', icon: 'FileText', status: 'queued', progress: 0 }
  ]

  // Use provided stages or fallback if empty
  const displayStages = processingStages.length > 0 ? processingStages : fallbackStages

  console.log("🎯 DisplayStages actual values:", displayStages.map(s => ({
    name: s.name,
    progress: s.progress,
    status: s.status
  })))

  // Update current time every second for realistic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Calculate estimated completion based on processing stages
  useEffect(() => {
    if (displayStages.length > 0) {
      const completedStages = displayStages.filter(stage => stage.status === "completed").length
      const totalStages = displayStages.length
      const progressRatio = completedStages / totalStages
      
      if (progressRatio < 0.3) {
        setEstimatedCompletion("3-4 minutes")
      } else if (progressRatio < 0.6) {
        setEstimatedCompletion("2-3 minutes")
      } else if (progressRatio < 0.9) {
        setEstimatedCompletion("1-2 minutes")
      } else {
        setEstimatedCompletion("< 1 minute")
      }
    }
  }, [displayStages])

  const calculateMainProgress = () => {
    const totalStages = displayStages.length
    if (totalStages === 0) return 0

    // Calculate progress based on completed stages + current stage progress
    const completedStages = displayStages.filter(stage => stage.status === 'completed').length
    const currentStage = displayStages.find(stage => stage.status === 'processing')
    const currentStageProgress = currentStage ? currentStage.progress : 0

    // Each completed stage = 100%, current processing stage = its progress percentage
    const totalProgress = (completedStages * 100) + currentStageProgress
    const maxProgress = totalStages * 100

    return (totalProgress / maxProgress) * 100
  }

  const mainProgress = calculateMainProgress()
  const isProcessing = displayStages.some((stage) => stage.status === "processing") || displayStages.some((stage) => stage.status === "queued")

  const handleForceStop = async () => {
    if (!sessionId || !onForceStop) return

    try {
      await apiService.stopProcessing(sessionId)
      onForceStop()
    } catch (error) {
      console.error("Failed to stop processing:", error)
      // Call the parent handler anyway for UI consistency
      onForceStop()
    }
  }

  return (
    <div className="flex justify-start">
      <div
        className="
  bg-gradient-to-br 
  from-[#040d36] 
  to-primary 
  text-primary-foreground 
  rounded-lg 
  p-6 
  max-w-2xl 
  w-full
"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <img src="./Spinner.gif" alt="Processing" className="w-13 h-13" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Cognitive Core Processing</div>
            <div className="text-sm text-primary-foreground/80">Advanced AI analysis in progress...</div>
          </div>
          {isProcessing && onForceStop && (
            <button
              onClick={handleForceStop}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-red-100 rounded-md transition-colors duration-200 text-sm font-medium"
              title="Force Stop Processing"
            >
              <Square className="h-3 w-3" />
              Force Stop
            </button>
          )}
        </div>

        <div className="mb-6">
          <div className="w-full bg-primary-foreground/20 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{
                width: `${mainProgress}%`,
                backgroundColor: '#3b82f6'
              }}
            >
              {isProcessing && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              )}
            </div>
          </div>
          <div className="flex justify-between text-xs text-primary-foreground/60">
            <span>{Math.round(mainProgress)}% Complete</span>
            <span>Est. {estimatedCompletion} remaining</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {displayStages.map((stage) => {
            const IconComponent = iconMap[stage.icon as keyof typeof iconMap] || Database
            return (
              <div key={stage.id} className="bg-primary-foreground/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">{stage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-primary-foreground/20 rounded-full h-1">
                    <div
                      className="bg-green-500 h-1 rounded-full transition-all duration-300 relative overflow-hidden"
                      style={{
                        width: `${stage.progress}%`,
                        backgroundColor: '#22c55e'
                      }}
                    >
                      {stage.status === "processing" && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-primary-foreground/80 capitalize min-w-[60px]">
                    {stage.status === "processing"
                      ? "Active"
                      : stage.status === "completed"
                        ? "Complete"
                        : stage.status === "queued"
                          ? "Queued"
                          : "Pending"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm mt-4">
          <Clock className="h-4 w-4" />
          <span>Estimated completion: {estimatedCompletion}</span>
        </div>
      </div>
    </div>
  )
}