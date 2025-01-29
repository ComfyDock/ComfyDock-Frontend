import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  
  const colorClasses = {
    'Created': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'Running': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Exited': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'Dead': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }

  const badgeColor = colorClasses[capitalizedStatus as keyof typeof colorClasses] || 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'

  return (
    <span className={cn(
      "px-2 py-1 rounded-full text-xs font-medium",
      badgeColor,
      className
    )}>
      {capitalizedStatus}
    </span>
  )
}

