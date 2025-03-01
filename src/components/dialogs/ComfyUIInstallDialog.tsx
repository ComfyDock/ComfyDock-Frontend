import React, { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export interface ComfyUIVersionDialogProps {
  title: string
  description: string
  cancelText: string
  actionText: string
  alternateActionText?: string
  onAction: (selectedVersion: string) => void
  onCancel: () => void
  onAlternateAction?: () => void
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: "default" | "destructive"
  loading?: boolean
  versionSelectLabel?: string
  showSettingsPrompt?: boolean
  installedPath?: string
  onUpdateUserSettings?: (updatedPath: string) => void
}

export function ComfyUIVersionDialog({ 
  title, 
  description, 
  cancelText, 
  actionText, 
  alternateActionText, 
  onAction, 
  onCancel, 
  onAlternateAction, 
  children, 
  open, 
  onOpenChange, 
  variant = "destructive", 
  loading = false,
  versionSelectLabel = "Select ComfyUI Version",
  showSettingsPrompt = false,
  installedPath = "",
  onUpdateUserSettings
}: ComfyUIVersionDialogProps) {
  const [selectedVersion, setSelectedVersion] = useState<string>("")
  const [versionOptions, setVersionOptions] = useState<{ value: string, label: string }[]>([
    { value: "master", label: "Latest" }
  ])
  const [fetchingVersions, setFetchingVersions] = useState(false)
  
  // Fetch the latest releases from GitHub when dialog opens
  useEffect(() => {
    const fetchComfyUIReleases = async () => {
      if (!open) return

      setFetchingVersions(true)
      try {
        const response = await fetch("https://api.github.com/repos/comfyanonymous/ComfyUI/releases?per_page=10")
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ComfyUI releases: ${response.status}`)
        }
        
        const releases = await response.json()
        
        // Transform the releases into the format we need
        const options = [
          { value: "master", label: "Latest" },
          ...releases.map((release: { tag_name: string }) => ({
            value: release.tag_name,
            label: release.tag_name
          }))
        ]
        
        setVersionOptions(options)
      } catch (error) {
        console.error("Error fetching ComfyUI releases:", error)
      } finally {
        setFetchingVersions(false)
      }
    }
    
    fetchComfyUIReleases()
  }, [open])
  
  const handleAction = () => {
    console.log("handleAction", selectedVersion)
    onAction(selectedVersion)
  }

  // Handle updating user settings
  const handleUpdateSettings = () => {
    if (onUpdateUserSettings && installedPath) {
      onUpdateUserSettings(installedPath)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && (
        <AlertDialogTrigger asChild>
          {children}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {showSettingsPrompt ? (
          // Settings confirmation prompt
          <div className="py-4">
            {/* No description needed here since we're setting it through props */}
          </div>
        ) : (
          // Version selection
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              {versionSelectLabel}
            </label>
            <Select
              value={selectedVersion}
              onValueChange={setSelectedVersion}
              disabled={loading || fetchingVersions}
            >
              <SelectTrigger>
                <SelectValue placeholder={fetchingVersions ? "Loading versions..." : "Choose a version"} />
              </SelectTrigger>
              <SelectContent>
                {versionOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fetchingVersions && (
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin mr-1" /> 
                Fetching latest versions...
              </div>
            )}
          </div>
        )}
        
        <AlertDialogFooter>
          {showSettingsPrompt ? (
            <>
              <AlertDialogCancel onClick={onCancel}>
                No
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleUpdateSettings}>
                Yes
              </AlertDialogAction>
            </>
          ) : (
            <>
              <AlertDialogCancel disabled={loading} onClick={onCancel}>
                {cancelText}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleAction} 
                variant={variant} 
                disabled={loading || fetchingVersions || !selectedVersion}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                    loading...
                  </>
                ) : actionText}
              </AlertDialogAction>
              {onAlternateAction && (
                <AlertDialogAction 
                  onClick={onAlternateAction} 
                  disabled={loading}
                >
                  {alternateActionText}
                </AlertDialogAction>
              )}
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}