"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Plus, Settings, MoreVertical, History, Sun, Moon, Share, FileText } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

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

  const handleShareAnalytics = () => {
    console.log("Share Analytics clicked")
  }

  const handleExportPDF = () => {
    console.log("Export as PDF clicked")
  }

  // const handleLogout = () => {
  //   router.push("/login")
  // }

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-4 border-b border-border bg-background flex-shrink-0 h-16 transition-all duration-300">
        <div className="flex items-center gap-2 flex-1">
          {!leftPanelOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleLeftPanel(true)}
                  className="hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Controls</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewAnalysis}
                className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-primary">BLUE SHERPA</h1>
          <p className="text-sm text-muted-foreground">Analytics Engine</p>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-50 bg-background shadow-md">
              <DropdownMenuItem onClick={handleShareAnalytics} className="hover:bg-accent transition-colors">
                <Share className="h-4 w-4 mr-2" />
                Share Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="hover:bg-accent transition-colors">
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleTheme} className="hover:bg-accent transition-colors">
                {isDarkMode ? (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {!rightPanelOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleRightPanel(!rightPanelOpen)}
                  className="hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>History</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
