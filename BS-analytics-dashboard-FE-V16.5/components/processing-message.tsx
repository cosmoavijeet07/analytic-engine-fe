"use client"
import { Clock, Database, TrendingUp, Code, FileText } from "lucide-react"
import type { ProcessingStage } from "../types"

interface ProcessingMessageProps {
  processingStages: ProcessingStage[]
}

const iconMap = {
  Database,
  TrendingUp,
  Code,
  FileText,
}

export function ProcessingMessage({ processingStages }: ProcessingMessageProps) {
  const calculateMainProgress = () => {
    const totalStages = processingStages.length
    if (totalStages === 0) return 0
    
    // Calculate weighted progress based on individual stage progress
    const totalProgress = processingStages.reduce((acc, stage) => {
      // Each stage contributes its progress percentage to the total
      return acc + stage.progress
    }, 0)
    
    // Return the average progress across all stages
    return totalProgress / totalStages
  }

  const mainProgress = calculateMainProgress()

  return (
    <div className="flex justify-start">
      <div className="
  bg-gradient-to-br 
  from-[#040d36] 
  to-primary 
  text-primary-foreground 
  rounded-lg 
  p-6 
  max-w-2xl 
  w-full
">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
              {/* /* <div className="w-8 h-8 border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
            <div
              className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-primary-foreground/60 rounded-full animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div> */ }
            <img src="/Spinner.gif" alt="Processing" className="w-13 h-13" />
          </div>
          <div>
            <div className="font-semibold">Cognitive Core Processing</div>
            <div className="text-sm text-primary-foreground/80">Advanced AI analysis in progress...</div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="w-full bg-primary-foreground/20 rounded-full h-2 mb-4">
            <div
              className="bg-primary-foreground h-2 rounded-full transition-all duration-500"
              style={{
                width: `${mainProgress}%`,
              }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {processingStages.map((stage) => {
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
                      className="bg-primary-foreground h-1 rounded-full transition-all duration-300"
                      style={{ width: `${stage.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-primary-foreground/80 capitalize">
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
          <span>Estimated completion: 2-3 minutes</span>
        </div>
      </div>
    </div>
  )
}