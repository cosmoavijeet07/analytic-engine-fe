"use client"

import { Button } from "@/components/ui/button"
import { Plus, Settings, MoreVertical, History, Sun, Moon, Share, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { ShareAnalyticsModal } from "./share-analytics-modal"
import { apiService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"
import type { AnalyticsSession } from "@/types"

interface DashboardHeaderProps {
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  onToggleLeftPanel: (open: boolean) => void
  onToggleRightPanel: (open: boolean) => void
  onNewAnalysis: () => void
  isDarkMode: boolean
  onToggleTheme: () => void
  currentSession?: AnalyticsSession | null
}

export function DashboardHeader({
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
  onNewAnalysis,
  isDarkMode,
  onToggleTheme,
  currentSession,
}: DashboardHeaderProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState("")
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const handleShareAnalytics = () => {
    if (!currentSession) {
      toast({
        title: "No session selected",
        description: "Please select or create a session to share.",
        variant: "destructive",
      })
      setDropdownOpen(false)
      return
    }

    setShareModalOpen(true)
    setDropdownOpen(false)
  }

  const handleExportPDF = async () => {
    if (!currentSession) {
      toast({
        title: "No session selected",
        description: "Please select a completed session to export.",
        variant: "destructive",
      })
      setDropdownOpen(false)
      return
    }

    if (currentSession.currentStep !== "completed") {
      toast({
        title: "Analysis not completed",
        description: "Please wait for the analysis to complete before exporting.",
        variant: "destructive",
      })
      setDropdownOpen(false)
      return
    }

    setIsExporting(true)
    setDropdownOpen(false)

    try {
      const exportData = await apiService.exportPDF(currentSession.id)
      
      toast({
        title: "PDF Export Ready",
        description: `${exportData.filename} (${exportData.size}) is ready for download.`,
      })
      
      // In a real implementation, this would trigger a download
      console.log("PDF Export data:", exportData)
    } catch (error) {
      console.error("PDF export failed:", error)
      toast({
        title: "Export failed",
        description: "Could not generate PDF export. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleThemeToggle = () => {
    onToggleTheme()
    setDropdownOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  const getHeaderStyles = () => {
    let leftOffset = 0
    let rightOffset = 0

    if (leftPanelOpen) {
      leftOffset = 256
    }

    if (rightPanelOpen) {
      rightOffset = 320
    }

    return {
      position: "fixed" as const,
      top: 0,
      left: `${leftOffset}px`,
      right: `${rightOffset}px`,
      zIndex: 10,
    }
  }

  return (
    <>
      <div
        className="flex items-center justify-between p-4 border-b border-border bg-background flex-shrink-0 h-16 transition-all duration-300"
        style={getHeaderStyles()}
      >
        <div className="flex items-center gap-2 flex-1">
          {!leftPanelOpen && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleLeftPanel(true)}
                onMouseEnter={() => setTooltipVisible("controls")}
                onMouseLeave={() => setTooltipVisible("")}
                className="hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
              </Button>
              {tooltipVisible === "controls" && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                  Controls
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewAnalysis}
              onMouseEnter={() => setTooltipVisible("new")}
              onMouseLeave={() => setTooltipVisible("")}
              className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {tooltipVisible === "new" && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                New Analysis
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 text-center">
          <div className="flex flex-col items-center">
            <img src="/blue-sherpa-logo.png" alt="Blue Sherpa" className="h-9 w-auto object-contain" />
          </div>
          <p className="text-m text-muted-foreground">Analytics Engine</p>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDropdownOpen(!dropdownOpen)
              }}
              className="hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={handleShareAnalytics}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                    disabled={!currentSession}
                  >
                    <Share className="h-4 w-4" />
                    Share Analytics
                    {!currentSession && (
                      <span className="text-xs text-muted-foreground ml-auto">No session</span>
                    )}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={!currentSession || currentSession.currentStep !== "completed" || isExporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Export as PDF
                        {!currentSession && (
                          <span className="text-xs text-muted-foreground ml-auto">No session</span>
                        )}
                        {currentSession && currentSession.currentStep !== "completed" && (
                          <span className="text-xs text-muted-foreground ml-auto">Not ready</span>
                        )}
                      </>
                    )}
                  </button>
                  <div className="border-t border-border my-1"></div>
                  <button
                    onClick={handleThemeToggle}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  >
                    {isDarkMode ? (
                      <>
                        <Sun className="h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {!rightPanelOpen && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleRightPanel(!rightPanelOpen)}
                onMouseEnter={() => setTooltipVisible("history")}
                onMouseLeave={() => setTooltipVisible("")}
                className="hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <History className="h-4 w-4" />
              </Button>
              {tooltipVisible === "history" && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover border border-border text-popover-foreground text-xs rounded-md whitespace-nowrap z-50 shadow-md">
                  History Panel
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ShareAnalyticsModal 
        isOpen={shareModalOpen} 
        onClose={() => setShareModalOpen(false)}
        currentSessionId={currentSession?.id}
      />
    </>
  )
}