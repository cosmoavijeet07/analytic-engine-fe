"use client"

// Temporary Fix for the header component with buttons and dropdowns

import { Button } from "@/components/ui/button"
import { Plus, Settings, MoreVertical, History, Sun, Moon, Share, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { ShareAnalyticsModal } from "./share-analytics-modal"

interface DashboardHeaderProps {
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  onToggleLeftPanel: (open: boolean) => void
  onToggleRightPanel: (open: boolean) => void
  onNewAnalysis: () => void
  isDarkMode: boolean
  onToggleTheme: () => void
}

export function DashboardHeader({
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
  onNewAnalysis,
  isDarkMode,
  onToggleTheme,
}: DashboardHeaderProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState("")
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleShareAnalytics = () => {
    setShareModalOpen(true)
    setDropdownOpen(false)
  }

  const handleExportPDF = () => {
    console.log("Export as PDF clicked")
    alert("Export as PDF clicked")
    setDropdownOpen(false)
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
          <h1 className="text-xl font-bold text-primary">BLUE SHERPA</h1>
          <p className="text-sm text-muted-foreground">Analytics Engine</p>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log("Dropdown button clicked, current state:", dropdownOpen)
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
                  >
                    <Share className="h-4 w-4" />
                    Share Analytics
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Export as PDF
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

      <ShareAnalyticsModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} />
    </>
  )
}


// Code need to be fixed
// "use client"

// import { Button } from "@/components/ui/button"
// import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
// import { Plus, Settings, MoreVertical, History, Sun, Moon, Share, FileText } from "lucide-react"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { useRouter } from "next/navigation"

// interface DashboardHeaderProps {
//   leftPanelOpen: boolean
//   rightPanelOpen: boolean
//   onToggleLeftPanel: (open: boolean) => void
//   onToggleRightPanel: (open: boolean) => void
//   onNewAnalysis: () => void
//   isDarkMode: boolean
//   onToggleTheme: () => void
// }

// export function DashboardHeader({
//   leftPanelOpen,
//   rightPanelOpen,
//   onToggleLeftPanel,
//   onToggleRightPanel,
//   onNewAnalysis,
//   isDarkMode,
//   onToggleTheme,
// }: DashboardHeaderProps) {
//   const router = useRouter()

//   const handleShareAnalytics = () => {
//     console.log("Share Analytics clicked")
//   }

//   const handleExportPDF = () => {
//     console.log("Export as PDF clicked")
//   }

//   const handleLogout = () => {
//     router.push("/login")
//   }

//   const getHeaderStyles = () => {
//     let leftOffset = 0
//     let rightOffset = 0

//     if (leftPanelOpen) {
//       leftOffset = 256 // w-64 = 16rem = 256px
//     }

//     if (rightPanelOpen) {
//       rightOffset = 320 // w-80 = 20rem = 320px
//     }

//     return {
//       position: "fixed" as const,
//       top: 0,
//       left: `${leftOffset}px`,
//       right: `${rightOffset}px`,
//       zIndex: 10,
//     }
//   }

//   return (
//     <TooltipProvider>
//       <div
//         className="flex items-center justify-between p-4 border-b border-border bg-background flex-shrink-0 h-16 transition-all duration-300"
//         style={getHeaderStyles()}
//       >
//         <div className="flex items-center gap-2 flex-1">
//           {!leftPanelOpen && (
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => onToggleLeftPanel(true)}
//                   className="hover:bg-accent hover:text-accent-foreground transition-colors"
//                 >
//                   <Settings className="h-4 w-4" />
//                 </Button>
//               </TooltipTrigger>
//               <TooltipContent>Controls</TooltipContent>
//             </Tooltip>
//           )}
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={onNewAnalysis}
//                 className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
//               >
//                 <Plus className="h-4 w-4" />
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent>New</TooltipContent>
//           </Tooltip>
//         </div>

//         <div className="flex-1 text-center">
//           <h1 className="text-xl font-bold text-primary">BLUE SHERPA</h1>
//           <p className="text-sm text-muted-foreground">Analytics Engine</p>
//         </div>

//         <div className="flex items-center gap-2 flex-1 justify-end">
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="hover:bg-accent hover:text-accent-foreground transition-colors"
//               >
//                 <MoreVertical className="h-4 w-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-48">
//               <DropdownMenuItem onClick={handleShareAnalytics} className="hover:bg-accent transition-colors">
//                 <Share className="h-4 w-4 mr-2" />
//                 Share Analytics
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={handleExportPDF} className="hover:bg-accent transition-colors">
//                 <FileText className="h-4 w-4 mr-2" />
//                 Export as PDF
//               </DropdownMenuItem>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem onClick={onToggleTheme} className="hover:bg-accent transition-colors">
//                 {isDarkMode ? (
//                   <>
//                     <Sun className="h-4 w-4 mr-2" />
//                     Light Mode
//                   </>
//                 ) : (
//                   <>
//                     <Moon className="h-4 w-4 mr-2" />
//                     Dark Mode
//                   </>
//                 )}
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//           {!rightPanelOpen && (
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => onToggleRightPanel(!rightPanelOpen)}
//                   className="hover:bg-accent hover:text-accent-foreground transition-colors"
//                 >
//                   <History className="h-4 w-4" />
//                 </Button>
//               </TooltipTrigger>
//               <TooltipContent>History</TooltipContent>
//             </Tooltip>
//           )}
//         </div>
//       </div>
//     </TooltipProvider>
//   )
// }
