import React, { useState } from "react"
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
  versionSelectLabel = "Select ComfyUI Version"
}: ComfyUIVersionDialogProps) {
  const [selectedVersion, setSelectedVersion] = useState<string>("")
  
  const handleAction = () => {
    console.log("handleAction", selectedVersion)
    onAction(selectedVersion)
  }

  // Placeholder version options
  const versionOptions = [
    { value: "master", label: "Latest" },
    { value: "v0.3.15", label: "v0.3.15" },
    { value: "v0.3.14", label: "v0.3.14" },
    { value: "v0.3.13", label: "v0.3.13" },
    { value: "v0.3.12", label: "v0.3.12" },
    { value: "v0.3.11", label: "v0.3.11" },
    { value: "v0.3.10", label: "v0.3.10" },
  ]

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
        
        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">
            {versionSelectLabel}
          </label>
          <Select
            value={selectedVersion}
            onValueChange={setSelectedVersion}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a version" />
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
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={onCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleAction} 
            variant={variant} 
            disabled={loading || !selectedVersion}
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}