"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface NewAnalysisFormProps {
  analysisTitle: string
  setAnalysisTitle: (title: string) => void
  analysisDomain: string
  setAnalysisDomain: (domain: string) => void
  onStartNewAnalysis: () => void
}

export function NewAnalysisForm({
  analysisTitle,
  setAnalysisTitle,
  analysisDomain,
  setAnalysisDomain,
  onStartNewAnalysis,
}: NewAnalysisFormProps) {
  const [domainOptions] = useState([
    "Finance",
    "Marketing",
    "Operations",
    "Sales",
    "Human Resources",
    "Technology",
    "Customer Service",
    "Product Management",
    "Supply Chain",
    "Legal",
  ])
  const [filteredDomains, setFilteredDomains] = useState(domainOptions)
  const [showDomainDropdown, setShowDomainDropdown] = useState(false)
  const domainInputRef = useRef<HTMLInputElement>(null)

  const handleDomainInputChange = (value: string) => {
    setAnalysisDomain(value)

    if (value.trim() === "") {
      setFilteredDomains(domainOptions)
    } else {
      const filtered = domainOptions.filter((domain) => domain.toLowerCase().includes(value.toLowerCase()))

      if (filtered.length === 0 && value.trim() !== "") {
        setFilteredDomains([value])
      } else {
        setFilteredDomains(filtered)
      }
    }
    setShowDomainDropdown(true)
  }

  const handleDomainSelect = (domain: string) => {
    setAnalysisDomain(domain)
    setShowDomainDropdown(false)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
      <Card className="w-full max-w-md border-0 shadow-none">
        <CardHeader className="text-center pb-6">
          <BarChart3 className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-xl text-foreground">Start New Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">Configure your analytics session</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title of Analysis</label>
            <Input
              placeholder="Enter analysis title..."
              value={analysisTitle}
              onChange={(e) => setAnalysisTitle(e.target.value)}
              className="border-border bg-background focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Domain</label>
            <div className="relative">
              <Input
                ref={domainInputRef}
                placeholder="Enter or select domain..."
                value={analysisDomain}
                onChange={(e) => handleDomainInputChange(e.target.value)}
                onFocus={() => setShowDomainDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowDomainDropdown(false), 150)
                }}
                className="border-border bg-background focus:border-primary/50 focus:ring-primary/20"
              />

              {showDomainDropdown && filteredDomains.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredDomains.map((domain, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-accent cursor-pointer text-sm border-b border-border/50 last:border-b-0 transition-colors"
                      onClick={() => handleDomainSelect(domain)}
                    >
                      {domain}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={onStartNewAnalysis}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            disabled={!analysisTitle || !analysisDomain}
          >
            Start Conversation
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
