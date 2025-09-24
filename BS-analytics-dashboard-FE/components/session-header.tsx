"use client"

import { Badge } from "@/components/ui/badge"

interface SessionHeaderProps {
  title: string
  domain: string
  createdAt: Date
}

export function SessionHeader({ title, domain, createdAt }: SessionHeaderProps) {
  return (
    <div className="p-4 mb-4">
      <div className="max-w-2xl">
        {/* Chat Bubble Container */}
        <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground text-sm">{title}</h3>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary text-xs border-primary/20 px-2 py-0.5 rounded-full"
              >
                Active
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">{createdAt.toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary/60"></div>
              {domain.charAt(0).toUpperCase() + domain.slice(1)} Domain
            </span>
            <span>•</span>
            <span>Started {Math.floor((Date.now() - createdAt.getTime()) / 60000)} minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}
