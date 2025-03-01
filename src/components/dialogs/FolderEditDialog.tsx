import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Folder } from '@/types/UserSettings'
import { CustomAlertDialog } from './CustomAlertDialog'

const formSchema = z.object({
  name: z.string().min(1, { message: "Folder name is required" }),
})

interface FolderEditDialogProps {
  folder: Folder
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: (folder: Folder) => Promise<void>
  onDelete?: (folder: Folder) => Promise<void>
}

export function FolderEditDialog({ folder, open, onOpenChange, onUpdate, onDelete }: FolderEditDialogProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: folder.name,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onUpdate?.({...folder, name: values.name})
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update folder:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete?.(folder)
      setDeleteDialogOpen(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete folder:', error)
    }
  }

  useEffect(() => {
      form.reset({
        name: folder.name,
      })
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!deleteDialogOpen) {
        onOpenChange(open)
      }
    }}>
      <DialogContent className="sm:max-w-[425px]" >
        <DialogHeader>
          <DialogTitle>Edit Folder</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus={false} autoComplete="off"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Folder
            </Button>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      <CustomAlertDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Folder"
          description={`Are you sure you want to delete ${folder.name}? This cannot be undone.`}
          onAction={() => handleDelete()}
          onCancel={() => setDeleteDialogOpen(false)}
          cancelText="Cancel"
          actionText="Delete"
          variant="destructive"
        />
      {/* <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All environments in this folder will be moved to the default folder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
    </Dialog>
  )
}

