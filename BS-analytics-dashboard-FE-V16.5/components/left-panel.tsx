"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
// import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { Settings, ChevronLeft, ChevronDown, User, LogOut, BarChart3, FileText, Database } from "lucide-react"

const PROCESSING_TIME_RANGE = { MIN: 1, MAX: 30 } as const
const VALIDATION_LEVELS = ["low", "medium", "high"] as const
const ANALYSIS_DEPTHS = [
  { value: "basic", label: "Basic", color: "emerald" },
  { value: "moderate", label: "Standard", color: "primary" },
  { value: "deep", label: "Deep", color: "destructive" },
] as const
const REPORT_FORMATS = [
  { value: "executive", label: "Executive Summary", icon: BarChart3, desc: "High-level insights" },
  { value: "detailed", label: "Detailed Report", icon: FileText, desc: "Comprehensive analysis" },
  { value: "visual", label: "Data Tables", icon: Database, desc: "Raw data export" },
] as const

interface LeftPanelProps {
  isOpen: boolean
  onToggle: (open: boolean) => void
  controlsDisabled: boolean
  processingTime: number
  setProcessingTime: (time: number) => void
  analyticsDepth: string
  setAnalyticsDepth: (depth: string) => void
  reportingStyle: string
  setReportingStyle: (style: string) => void
  crossValidation: string
  setCrossValidation: (validation: string) => void
  showAdvancedSettings: boolean
  setShowAdvancedSettings: (show: boolean) => void
  autoSave: boolean
  setAutoSave: (save: boolean) => void
  realTimeUpdates: boolean
  setRealTimeUpdates: (updates: boolean) => void
  isProcessing: boolean
}

export function LeftPanel({
  isOpen,
  onToggle,
  controlsDisabled,
  processingTime,
  setProcessingTime,
  analyticsDepth,
  setAnalyticsDepth,
  reportingStyle,
  setReportingStyle,
  crossValidation,
  setCrossValidation,
  showAdvancedSettings,
  setShowAdvancedSettings,
  autoSave,
  setAutoSave,
  realTimeUpdates,
  setRealTimeUpdates,
  isProcessing,
}: LeftPanelProps) {
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [tempTimeValue, setTempTimeValue] = useState("")
  const [isDraggingSlider, setIsDraggingSlider] = useState(false)
  const [isDraggingProcessingSlider, setIsDraggingProcessingSlider] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const router = useRouter()

  const processingTimePercentage = useMemo(
    () =>
      ((processingTime - PROCESSING_TIME_RANGE.MIN) / (PROCESSING_TIME_RANGE.MAX - PROCESSING_TIME_RANGE.MIN)) * 100,
    [processingTime],
  )

  const validationPercentage = useMemo(() => {
    switch (crossValidation) {
      case "low":
        return 0
      case "medium":
        return 50
      case "high":
        return 100
      default:
        return 0
    }
  }, [crossValidation])

  const createSliderHandler = useCallback(
    (updateValue: (percentage: number) => void, setDragging: (dragging: boolean) => void) => (e: React.MouseEvent) => {
      e.preventDefault()
      setDragging(true)

      const sliderElement = e.currentTarget.parentElement
      if (!sliderElement) return

      const updateSliderValue = (clientX: number) => {
        const rect = sliderElement.getBoundingClientRect()
        const x = clientX - rect.left
        const percentage = Math.max(0, Math.min(1, x / rect.width))
        updateValue(percentage)
      }

      const handleMouseMove = (e: MouseEvent) => updateSliderValue(e.clientX)
      const handleMouseUp = () => {
        setDragging(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.userSelect = ""
      }

      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      updateSliderValue(e.clientX)
    },
    [],
  )

  const handleProcessingTimeSliderMouseDown = useMemo(
    () =>
      createSliderHandler((percentage) => {
        const newTime =
          Math.round(percentage * (PROCESSING_TIME_RANGE.MAX - PROCESSING_TIME_RANGE.MIN)) + PROCESSING_TIME_RANGE.MIN
        setProcessingTime(Math.max(PROCESSING_TIME_RANGE.MIN, Math.min(PROCESSING_TIME_RANGE.MAX, newTime)))
      }, setIsDraggingProcessingSlider),
    [createSliderHandler, setProcessingTime],
  )

  const handleValidationSliderMouseDown = useMemo(
    () =>
      createSliderHandler((percentage) => {
        if (percentage <= 0.33) setCrossValidation("low")
        else if (percentage <= 0.66) setCrossValidation("medium")
        else setCrossValidation("high")
      }, setIsDraggingSlider),
    [createSliderHandler, setCrossValidation],
  )

  const handleTimeInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const numValue = Number.parseInt(tempTimeValue)
        if (!isNaN(numValue) && numValue >= PROCESSING_TIME_RANGE.MIN && numValue <= PROCESSING_TIME_RANGE.MAX) {
          setProcessingTime(numValue)
        }
        setIsEditingTime(false)
        setTempTimeValue("")
      } else if (e.key === "Escape") {
        setIsEditingTime(false)
        setTempTimeValue("")
      }
    },
    [tempTimeValue, setProcessingTime],
  )

  const handleTimeInputBlur = useCallback(() => {
    const numValue = Number.parseInt(tempTimeValue)
    if (!isNaN(numValue) && numValue >= PROCESSING_TIME_RANGE.MIN && numValue <= PROCESSING_TIME_RANGE.MAX) {
      setProcessingTime(numValue)
    }
    setIsEditingTime(false)
    setTempTimeValue("")
  }, [tempTimeValue, setProcessingTime])

  const handleLogout = useCallback(() => {
    setProfileDropdownOpen(false)
    router.push("/login")
  }, [router])

  return (
      <div
        className={`${isOpen ? "w-64" : "w-0"} transition-all duration-300 overflow-hidden border-r border-border bg-background flex-shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0 h-16">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground text-sm">Agent Controls</span>
            </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggle(false)}
                  className="hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className={`relative ${controlsDisabled ? "pointer-events-none opacity-50" : ""}`}>
              <div className="p-3 space-y-4">
                {/* Processing Time Dial */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Processing Time
                  </label>
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="dark:text-white">{PROCESSING_TIME_RANGE.MIN} min</span>
                        <span className="dark:text-white">15 min</span>
                        <span className="dark:text-white">{PROCESSING_TIME_RANGE.MAX} min</span>
                      </div>
                      <div
                        className="relative h-2 bg-muted rounded-full cursor-pointer"
                        onClick={(e) => {
                          if (controlsDisabled) return
                          const rect = e.currentTarget.getBoundingClientRect()
                          const x = e.clientX - rect.left
                          const percentage = Math.max(0, Math.min(1, x / rect.width))
                          const newTime =
                            Math.round(percentage * (PROCESSING_TIME_RANGE.MAX - PROCESSING_TIME_RANGE.MIN)) +
                            PROCESSING_TIME_RANGE.MIN
                          setProcessingTime(
                            Math.max(PROCESSING_TIME_RANGE.MIN, Math.min(PROCESSING_TIME_RANGE.MAX, newTime)),
                          )
                        }}
                      >
                        <div
                          className="absolute h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${processingTimePercentage}%` }}
                        />
                        <div
                          className={`absolute w-5 h-5 bg-background border-2 border-primary rounded-full shadow-lg transform -translate-y-1.5 transition-all duration-300 cursor-grab ${
                            isDraggingProcessingSlider ? "cursor-grabbing scale-110 shadow-xl" : "hover:scale-110"
                          }`}
                          style={{ left: `calc(${processingTimePercentage}% - 10px)` }}
                          onMouseDown={handleProcessingTimeSliderMouseDown}
                        />
                        {isProcessing && (
                          <div
                            className="absolute h-full bg-primary/30 rounded-full animate-pulse"
                            style={{ width: `${processingTimePercentage}%` }}
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-center">
                        {isEditingTime ? (
                          <input
                            type="number"
                            min={PROCESSING_TIME_RANGE.MIN}
                            max={PROCESSING_TIME_RANGE.MAX}
                            value={tempTimeValue}
                            onChange={(e) => setTempTimeValue(e.target.value)}
                            onKeyDown={handleTimeInputKeyDown}
                            onBlur={handleTimeInputBlur}
                            className="w-16 text-sm text-center bg-background rounded px-2 py-1 border border-border focus:border-primary outline-none"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => {
                              if (controlsDisabled) return
                              setIsEditingTime(true)
                              setTempTimeValue(processingTime.toString())
                            }}
                            className="text-sm font-semibold dark:text-white hover:text-primary flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors"
                          >
                            {processingTime} min
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysis Depth */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Analysis Depth
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-primary/5 border border-primary/10 rounded-lg">
                    {ANALYSIS_DEPTHS.map((depth) => (
                      <button
                        key={depth.value}
                        onClick={() => !controlsDisabled && setAnalyticsDepth(depth.value)}
                        className={`px-2 py-1.5 rounded text-xs font-semibold transition-all duration-200 transform hover:scale-105 ${
                          analyticsDepth === depth.value
                            ? depth.color === "primary"
                              ? "bg-primary text-primary-foreground shadow-md"
                              : depth.color === "emerald"
                                ? "bg-emerald-500 text-white shadow-md"
                                : "bg-destructive text-destructive-foreground shadow-md"
                            : "text-gray-900 dark:text-white hover:bg-background hover:shadow-sm border border-transparent hover:border-border"
                        }`}
                        disabled={controlsDisabled}
                      >
                        {depth.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Report Format */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Report Format</label>
                  <div className="space-y-1">
                    {REPORT_FORMATS.map((style) => {
                      const Icon = style.icon
                      return (
                        <div
                          key={style.value}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                            reportingStyle === style.value
                              ? "bg-primary/10 border-primary/30 shadow-md"
                              : "bg-card border-border hover:border-primary/20 hover:shadow-sm"
                          }`}
                          onClick={() => setReportingStyle(style.value)}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              reportingStyle === style.value
                                ? "bg-primary border-primary"
                                : "border-muted-foreground bg-background"
                            }`}
                          >
                            {reportingStyle === style.value && (
                              <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full"></div>
                            )}
                          </div>
                          <Icon
                            className={`w-4 h-4 transition-colors duration-200 ${
                              reportingStyle === style.value ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold dark:text-white">{style.label}</div>
                            <div className="text-xs dark:text-gray-200 truncate">{style.desc}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Validation Level Slider */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Validation Level
                  </label>
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                    <div className="flex justify-between text-xs font-semibold mb-3">
                      {VALIDATION_LEVELS.map((level) => (
                        <span
                          key={level}
                          className={crossValidation === level ? "text-primary" : "text-gray-900 dark:text-white"}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </span>
                      ))}
                    </div>
                    <div
                      className="relative h-2 bg-muted rounded-full cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const percentage = x / rect.width
                        if (percentage <= 0.33) setCrossValidation("low")
                        else if (percentage <= 0.66) setCrossValidation("medium")
                        else setCrossValidation("high")
                      }}
                    >
                      <div
                        className="absolute h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${validationPercentage}%` }}
                      />
                      <div
                        className={`absolute w-5 h-5 bg-background border-2 border-primary rounded-full shadow-lg transform -translate-y-1.5 transition-all duration-300 cursor-grab ${isDraggingSlider ? "cursor-grabbing scale-110 shadow-xl" : "hover:scale-110"}`}
                        style={{ left: `calc(${validationPercentage}% - 10px)` }}
                        onMouseDown={handleValidationSliderMouseDown}
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-foreground uppercase tracking-wide hover:bg-accent hover:text-accent-foreground rounded px-2 py-1 transition-all duration-200"
                  >
                    Advanced Settings
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${showAdvancedSettings ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showAdvancedSettings && (
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      {[
                        { label: "Auto-save Results", value: autoSave, setter: setAutoSave },
                        { label: "Real-time Updates", value: realTimeUpdates, setter: setRealTimeUpdates },
                      ].map(({ label, value, setter }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          <button
                            onClick={() => setter(!value)}
                            className={`w-10 h-5 rounded-full relative transition-all duration-200 shadow-inner ${
                              value ? "bg-primary" : "bg-muted border border-border"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 bg-background rounded-full absolute top-0.5 transition-all duration-200 shadow-sm ${
                                value
                                  ? "right-0.5 border border-primary/20"
                                  : "left-0.5 border border-muted-foreground/20"
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Processing Overlay */}
              {controlsDisabled && (
                <div className="absolute inset-0 bg-background/10 backdrop-blur-[0.5px] rounded-lg flex items-center justify-center">
                  <div className="bg-background/90 rounded-lg px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-foreground">Processing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Section */}
          <div className="p-3 border-t border-border flex-shrink-0 relative">
                <button
                  className="flex items-center gap-2 w-full hover:bg-accent hover:text-accent-foreground rounded-lg p-1 transition-colors"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-medium text-foreground truncate">Sarah Johnson</p>
                    <p className="text-xs text-muted-foreground">Data Analyst</p>
                  </div>
                  <ChevronDown
                    className={`h-3 w-3 text-muted-foreground transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

            {profileDropdownOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-1 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
                    <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                      <User className="h-3 w-3" />
                      Profile
                    </button>
                    <button
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-3 w-3" />
                      Logout
                    </button>
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
