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
import { Loader2 } from "lucide-react"

export interface CustomAlertDialogProps {
  title: string
  description: string
  cancelText: string
  actionText: string
  alternateActionText?: string
  onAction: () => void
  onCancel: () => void
  onAlternateAction?: () => void
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: "default" | "destructive"
  loading?: boolean
}

export function CustomAlertDialog({ title, description, cancelText, actionText, alternateActionText, onAction, onCancel, onAlternateAction, children, open, onOpenChange, variant = "destructive", loading = false }: CustomAlertDialogProps) {
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
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={onCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onAction} variant={variant} disabled={loading}>{loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> loading...</>) : actionText}</AlertDialogAction>
          {onAlternateAction && <AlertDialogAction onClick={onAlternateAction} disabled={loading}>{alternateActionText}</AlertDialogAction>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}