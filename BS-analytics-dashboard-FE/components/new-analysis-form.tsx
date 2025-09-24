"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"
import type { Domain } from "@/types/api"

interface NewAnalysisFormProps {
  analysisTitle: string
  setAnalysisTitle: (title: string) => void
  analysisDomain: string
  setAnalysisDomain: (domain: string) => void
  onStartNewAnalysis: () => void
  isLoading?: boolean
}

export function NewAnalysisForm({
  analysisTitle,
  setAnalysisTitle,
  analysisDomain,
  setAnalysisDomain,
  onStartNewAnalysis,
  isLoading = false,
}: NewAnalysisFormProps) {
  const [domainOptions, setDomainOptions] = useState<Domain[]>([])
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([])
  const [showDomainDropdown, setShowDomainDropdown] = useState(false)
  const [domainsLoading, setDomainsLoading] = useState(true)
  const domainInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load domains on mount with authentication check
  useEffect(() => {
    loadDomains()
  }, [])

  const loadDomains = async () => {
    try {
      setDomainsLoading(true)
      // Check authentication before loading domains
      await apiService.getProfile()
      const domainsResponse = await apiService.getDomains()
      setDomainOptions(domainsResponse.domains)
      setFilteredDomains(domainsResponse.domains)
    } catch (error) {
      console.error("Failed to load domains:", error)
      if (error instanceof Error && error.message.includes('Authentication required')) {
        // Skip showing error toast for authentication issues
        console.warn("Authentication required for loading domains")
      } else {
        toast({
          title: "Failed to load domains",
          description: "Using default domain options.",
          variant: "destructive",
        })
      }

      // Fallback to default domains
      const defaultDomains: Domain[] = [
        { id: 'finance', name: 'Finance', description: 'Financial analysis', usage_count: 0, created_at: '' },
        { id: 'marketing', name: 'Marketing', description: 'Marketing analysis', usage_count: 0, created_at: '' },
        { id: 'operations', name: 'Operations', description: 'Operations analysis', usage_count: 0, created_at: '' },
        { id: 'sales', name: 'Sales', description: 'Sales analysis', usage_count: 0, created_at: '' },
        { id: 'hr', name: 'Human Resources', description: 'HR analysis', usage_count: 0, created_at: '' },
        { id: 'technology', name: 'Technology', description: 'Technology analysis', usage_count: 0, created_at: '' },
      ]
      setDomainOptions(defaultDomains)
      setFilteredDomains(defaultDomains)
    } finally {
      setDomainsLoading(false)
    }
  }

  const handleDomainInputChange = (value: string) => {
    setAnalysisDomain(value)

    if (value.trim() === "") {
      setFilteredDomains(domainOptions)
    } else {
      const filtered = domainOptions.filter((domain) => 
        domain.name.toLowerCase().includes(value.toLowerCase())
      )

      if (filtered.length === 0 && value.trim() !== "") {
        // Allow custom domain creation
        const customDomain: Domain = {
          id: value.toLowerCase().replace(/\s+/g, '_'),
          name: value,
          description: `${value} analytics`,
          usage_count: 0,
          created_at: new Date().toISOString()
        }
        setFilteredDomains([customDomain])
      } else {
        setFilteredDomains(filtered)
      }
    }
    setShowDomainDropdown(true)
  }

  const handleDomainSelect = async (domain: Domain) => {
    setAnalysisDomain(domain.name)
    setShowDomainDropdown(false)
    
    // If it's a new custom domain, create it in the backend
    if (!domainOptions.find(d => d.id === domain.id)) {
      try {
        await apiService.createDomain({
          name: domain.name,
          description: domain.description
        })
        
        // Refresh domains list
        await loadDomains()
        
        toast({
          title: "Domain created",
          description: `New domain "${domain.name}" has been added.`,
        })
      } catch (error) {
        console.error("Failed to create domain:", error)
        // Continue anyway - user can still use the domain name
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStartNewAnalysis()
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title of Analysis</label>
              <Input
                placeholder="Enter analysis title..."
                value={analysisTitle}
                onChange={(e) => setAnalysisTitle(e.target.value)}
                className="border-border bg-background focus:border-primary/50 focus:ring-primary/20"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Domain</label>
              <div className="relative">
                <Input
                  ref={domainInputRef}
                  placeholder={domainsLoading ? "Loading domains..." : "Enter or select domain..."}
                  value={analysisDomain}
                  onChange={(e) => handleDomainInputChange(e.target.value)}
                  onFocus={() => setShowDomainDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowDomainDropdown(false), 150)
                  }}
                  className="border-border bg-background focus:border-primary/50 focus:ring-primary/20"
                  disabled={isLoading || domainsLoading}
                  required
                />

                {showDomainDropdown && filteredDomains.length > 0 && !domainsLoading && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredDomains.map((domain, index) => (
                      <div
                        key={domain.id}
                        className="px-3 py-2 hover:bg-accent cursor-pointer text-sm border-b border-border/50 last:border-b-0 transition-colors"
                        onClick={() => handleDomainSelect(domain)}
                      >
                        <div className="font-medium">{domain.name}</div>
                        {domain.description && (
                          <div className="text-xs text-muted-foreground mt-1">{domain.description}</div>
                        )}
                        {domain.usage_count > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Used {domain.usage_count} time{domain.usage_count !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!domainsLoading && (
                <p className="text-xs text-muted-foreground">
                  Type to search existing domains or create a new one
                </p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              disabled={!analysisTitle || !analysisDomain || isLoading || domainsLoading}
            >
              {isLoading ? "Creating Session..." : "Start Conversation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}