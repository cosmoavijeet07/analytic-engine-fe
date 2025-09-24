"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Copy, Check } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"

interface ShareAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  currentSessionId?: string
}

export function ShareAnalyticsModal({ isOpen, onClose, currentSessionId }: ShareAnalyticsModalProps) {
  const [emails, setEmails] = useState<string[]>([])
  const [currentEmail, setCurrentEmail] = useState("")
  const [accessLevel, setAccessLevel] = useState<"VIEW" | "COMMENT" | "EDIT">("VIEW")
  const [linkCopied, setLinkCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const { toast } = useToast()

  const handleCopyLink = async () => {
    if (!shareUrl) {
      toast({
        title: "No link to copy",
        description: "Please create a share link first.",
        variant: "destructive",
      })
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
      
      toast({
        title: "Link copied",
        description: "Share link has been copied to clipboard.",
      })
    } catch (err) {
      console.error("Failed to copy link:", err)
      toast({
        title: "Failed to copy link",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const email = currentEmail.trim()
      if (email && isValidEmail(email) && !emails.includes(email)) {
        setEmails([...emails, email])
        setCurrentEmail("")
      }
    }
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove))
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleShare = async () => {
    if (!currentSessionId) {
      toast({
        title: "No session selected",
        description: "Please select a session to share.",
        variant: "destructive",
      })
      return
    }

    setIsSharing(true)

    try {
      const shareData = await apiService.createShareLink({
        session_id: currentSessionId,
        access_level: accessLevel,
        emails: emails.length > 0 ? emails : undefined,
      })

      setShareUrl(shareData.share_url)

      toast({
        title: "Share link created",
        description: `Analytics session shared with ${accessLevel.toLowerCase()} access.${emails.length > 0 ? ` Invitations sent to ${emails.length} recipient(s).` : ''}`,
      })

      // Reset form
      setEmails([])
      setCurrentEmail("")
    } catch (error) {
      console.error("Failed to create share link:", error)
      
      // Fallback: Generate a mock share URL for demo purposes
      const mockShareUrl = `https://analytics.bluesherpa.com/share/${currentSessionId}_${Date.now()}`
      setShareUrl(mockShareUrl)
      
      toast({
        title: "Share link created (Demo)",
        description: `Mock share link generated for demonstration.`,
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleClose = () => {
    // Reset state when closing
    setEmails([])
    setCurrentEmail("")
    setAccessLevel("VIEW")
    setShareUrl("")
    setLinkCopied(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Share Analytics</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Share Link */}
          {shareUrl && (
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex items-center gap-2">
                <Input value={shareUrl} readOnly className="flex-1 text-sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 bg-transparent"
                  disabled={!shareUrl}
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <Label>Invite by Email (Optional)</Label>
            <Input
              placeholder="Enter email addresses (press Enter or comma to add)"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              onKeyDown={handleAddEmail}
              disabled={isSharing}
            />

            {/* Email Tags */}
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {emails.map((email) => (
                  <div
                    key={email}
                    className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm flex items-center gap-1"
                  >
                    {email}
                    <button 
                      onClick={() => handleRemoveEmail(email)} 
                      className="hover:bg-primary/20 rounded-full p-0.5"
                      disabled={isSharing}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Access Level */}
          <div className="space-y-2">
            <Label>Access Level</Label>
            <Select 
              value={accessLevel} 
              onValueChange={(value: "VIEW" | "COMMENT" | "EDIT") => setAccessLevel(value)}
              disabled={isSharing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEW">View Only</SelectItem>
                <SelectItem value="COMMENT">Can Comment</SelectItem>
                <SelectItem value="EDIT">Can Edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Session Info */}
          {currentSessionId && (
            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              Sharing session: {currentSessionId}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={handleClose} disabled={isSharing}>
            Cancel
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={isSharing || !currentSessionId}
          >
            {isSharing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              "Create Share Link"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}