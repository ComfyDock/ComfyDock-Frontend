import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { getUserSettings, updateUserSettings } from "@/api/environmentApi";
import { UserSettings, UserSettingsInput } from "@/types/UserSettings";

// TODO: Update only changed fields

const formSchema = z.object({
  comfyui_path: z.string().min(1, { message: "ComfyUI path is required" }),
  port: z.number().int().min(1024).max(65535),
  runtime: z.string().min(1, { message: "Runtime is required" }),
  command: z.string().optional(),
  max_deleted_environments: z.number().int().min(1).max(100),
  folders: z.array(z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().optional(),
  })).optional(),
});

export interface UserSettingsDialogProps {
  updateUserSettingsHandler: (settings: UserSettings) => Promise<void>;
  children: React.ReactNode;
}

export default function UserSettingsDialog({
  children,
  updateUserSettingsHandler,
}: UserSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comfyui_path: "",
      port: 8188,
      runtime: "nvidia",
      command: "",
      folders: [],
      max_deleted_environments: 10,
    },
  });

  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const settings = await getUserSettings();
        console.log(`settings: ${JSON.stringify(settings)}`);
        form.reset(settings);
      } catch (error: unknown) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to load user settings",
          variant: "destructive",
        });
      }
    };

    if (isOpen) {
      loadUserSettings();
    }
  }, [isOpen, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(`onSubmit: ${JSON.stringify(values)}`);
    try {
      setIsLoading(true);
      console.log(`values: ${JSON.stringify(values)}`);
      await updateUserSettingsHandler(values as UserSettingsInput);
      setIsOpen(false);
      toast({
        title: "Success",
        description: "User settings updated successfully",
      });
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-h-[80vh] min-w-[700px] overflow-y-auto dialog-content"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="comfyui_path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default ComfyUI Path</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Port</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="runtime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Runtime</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a runtime" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nvidia">Nvidia</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="command"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Command (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_deleted_environments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Deleted Environments</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
