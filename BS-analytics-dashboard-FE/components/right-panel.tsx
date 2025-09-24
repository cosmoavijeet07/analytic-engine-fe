//Fixed right-panel.tsx - Remove continuous API polling
"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { History, ChevronRight, Search, BarChart3, Loader2 } from "lucide-react"
import type { AnalyticsSession } from "../types"

interface RightPanelProps {
  isOpen: boolean
  onToggle: (open: boolean) => void
  sessions: AnalyticsSession[]
  currentSession: AnalyticsSession | null
  searchQuery: string
  setSearchQuery: (query: string) => void
  onSearch: (query: string) => void
  onSelectSession: (session: AnalyticsSession) => void
  isLoading?: boolean
}

export function RightPanel({
  isOpen,
  onToggle,
  sessions,
  currentSession,
  searchQuery,
  setSearchQuery,
  onSearch,
  onSelectSession,
  isLoading = false,
}: RightPanelProps) {
  
  // REMOVED: The useEffect that was causing continuous API calls
  // This was the source of the continuous polling issue

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Only trigger search on Enter key press
      onSearch(searchQuery)
    }
  }

  const getStatusIcon = (session: AnalyticsSession) => {
    switch (session.currentStep) {
      case 'completed':
        return <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      case 'processing':
        return <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
      case 'ambiguity':
      case 'context':
        return <div className="w-2 h-2 rounded-full bg-orange-500"></div>
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400"></div>
    }
  }

  const getStatusText = (session: AnalyticsSession) => {
    switch (session.currentStep) {
      case 'completed':
        return 'Completed'
      case 'processing':
        return 'Processing'
      case 'ambiguity':
        return 'Resolving ambiguity'
      case 'context':
        return 'Context confirmation'
      case 'query':
        return 'Awaiting query'
      default:
        return 'Active'
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div
      className={`${isOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden border-l border-border bg-background flex-shrink-0`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0 h-16">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground text-sm">Past Analytics</span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(false)}
            className="hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                // Only update the query, don't trigger search automatically
              }}
              onKeyPress={handleSearchKeyPress} // FIXED: Only search on Enter
              className="pl-9 h-9 text-sm border-border focus:border-primary/50 focus:ring-primary/20 bg-background"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {isLoading && sessions.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading conversations...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              {searchQuery ? (
                <>
                  <p className="text-sm text-muted-foreground text-balance leading-relaxed">No conversations found</p>
                  <p className="text-sm text-muted-foreground text-balance leading-relaxed">
                    Try adjusting your search terms
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground text-balance leading-relaxed">You're yet to start</p>
                  <p className="text-sm text-muted-foreground text-balance leading-relaxed">
                    Your analytics conversations will appear here
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative cursor-pointer transition-all duration-200 rounded-xl border bg-card hover:shadow-sm hover:border-primary/30 ${
                    currentSession?.id === session.id
                      ? "border-primary/40 shadow-sm ring-1 ring-primary/20 bg-primary/5"
                      : "border-border/60 hover:bg-accent/30"
                  }`}
                  onClick={() => onSelectSession(session)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-medium text-foreground text-sm leading-tight line-clamp-2">
                        {session.title}
                      </h4>
                      <span className="text-xs text-muted-foreground font-medium shrink-0">
                        {formatDate(session.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-primary font-medium">{session.domain}</span>
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(session)}
                          <span className="text-xs text-muted-foreground">{getStatusText(session)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {session.messages?.length || 0} message{(session.messages?.length || 0) !== 1 ? 's' : ''}
                      </span>
                      <span>Analytics session</span>
                    </div>
                  </div>

                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-200 ${
                      currentSession?.id === session.id ? "bg-primary" : "bg-transparent group-hover:bg-primary/50"
                    }`}
                  ></div>
                </div>
              ))}
              
              {isLoading && sessions.length > 0 && (
                <div className="text-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground inline-block" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}