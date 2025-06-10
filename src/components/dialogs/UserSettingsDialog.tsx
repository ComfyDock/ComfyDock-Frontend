import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { getUserSettings } from "@/api/environmentApi";
import { 
  UserSettings, 
  UserSettingsInput,
  userSettingsSchema,
  DEFAULT_USER_SETTINGS 
} from "@/types/UserSettings";
import FormFieldComponent from "@/components/form/FormFieldComponent";

// TODO: Update only changed fields

export interface UserSettingsDialogProps {
  userSettings?: UserSettings;
  updateUserSettingsHandler: (userSettings: UserSettingsInput) => Promise<void>;
  children: React.ReactNode;
}

export default function UserSettingsDialog({
  userSettings,
  updateUserSettingsHandler,
  children,
}: UserSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserSettings>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: DEFAULT_USER_SETTINGS,
    mode: "onChange",
  });

  useEffect(() => {
    if (isOpen) {
      console.log(`userSettings: ${JSON.stringify(userSettings)}`);
      if (userSettings) {
        form.reset(userSettings);
      } else {
        form.reset(DEFAULT_USER_SETTINGS);
      }
    }
  }, [isOpen, form, userSettings]);

  const onSubmit = async (values: UserSettings) => {
    try {
      setIsLoading(true);
      await updateUserSettingsHandler(values);
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
            <FormFieldComponent
              name="comfyui_path"
              label="Default ComfyUI Path"
              placeholder="Default ComfyUI Path"
              tooltip="The default path to the ComfyUI executable"
              layout="stack"
            />
            <FormFieldComponent
              name="runtime"
              label="Default Runtime"
              placeholder="Select runtime"
              type="select"
              options={[
                { value: "nvidia", label: "Nvidia" },
                { value: "none", label: "None" }
              ]}
              defaultValue="nvidia"
              tooltip="Select the runtime for the container"
              layout="stack"
            />
            <FormFieldComponent
              name="port"
              label="Ports"
              placeholder="8188:8188"
              type="text"
              tooltip="Override the ports of the container. Format follows standard docker port mapping (e.g. host:container;host:container/protocol)"
              layout="stack"
            />
            <FormFieldComponent
              name="url"
              label="Default URL"
              placeholder="http://localhost:8188"
              type="text"
              tooltip="Override the URL of the container."
              layout="stack"
            />
            <FormFieldComponent
              name="command"
              label="Default Command"
              placeholder="Optional command"
              tooltip="Override the command of the container"
              layout="stack"
            />
            <FormFieldComponent
              name="entrypoint"
              label="Default Entrypoint"
              placeholder="/bin/bash"
              tooltip="Override the entrypoint of the container"
              layout="stack"
            />
            <FormFieldComponent
              name="environment_variables"
              label="Default Environment Variables"
              placeholder="VAR1=1, VAR2=2, etc."
              tooltip="Override the environment variables of the container"
              layout="stack"
            />
            <FormFieldComponent
              name="max_deleted_environments"
              label="Max Deleted Environments"
              placeholder="10"
              tooltip="The maximum number of environments to delete at once"
              type="number"
              layout="stack"
            />
            <FormFieldComponent
              name="allow_multiple"
              label="Allow Running Multiple Environments"
              placeholder="false"
              tooltip="Allow multiple environments to be active at once"
              type="checkbox"
              className=""
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
