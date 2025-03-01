import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { pullImageStream, pullImageStreamMock } from '@/api/environmentApi'

interface ImagePullDialogProps {
  image: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function ImagePullDialog({ image, open, onOpenChange, onSuccess }: ImagePullDialogProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [statusText, setStatusText] = useState("")

  // Reset the values when the dialog is closed
  useEffect(() => {
    if (!open) {
      setIsPulling(false)
      setProgress(0)
      setIsComplete(false)
    }
  }, [open])

  const handlePull = async () => {
    setIsPulling(true)
    setIsComplete(false)
    try {
      setStatusText("Downloading image layers")
      await pullImageStream(image, (progress) => {
        setProgress(progress)
      })
      setStatusText("Download complete")
      onSuccess()
    } catch (error) {
      console.error(error)
      setStatusText("Error downloading image: Check if it exists on Docker Hub")
    } finally {
      console.log("Pull complete")
      setIsPulling(false)
      setIsComplete(true)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Image Not Found</DialogTitle>
          <DialogDescription>
            The image <b>{image}</b> does not exist locally.
          </DialogDescription>
        </DialogHeader>
        {!isPulling && !isComplete && (
          <DialogDescription>
            Would you like to pull it?
          </DialogDescription>
        )}
        {(isPulling || isComplete) && (
          <div className="py-4">
            <Progress value={progress} className="w-full" />
            <p className="text-center mt-2">
              {statusText}
            </p>
          </div>
        )}
        <DialogFooter>
          {!isPulling && !isComplete && (
            <>
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button onClick={handlePull}>Pull</Button>
            </>
          )}
          {isComplete && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}