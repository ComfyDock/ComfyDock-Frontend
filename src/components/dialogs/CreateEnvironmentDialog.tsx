import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { EnvironmentForm } from '@/components/form/EnvironmentForm';
import { EnvironmentTypeEnum, EnvironmentTypeDescriptions } from '@/components/utils/MountConfigUtils';
import { useToast } from '@/hooks/use-toast';
import { Environment, EnvironmentFormValues, EnvironmentInput } from '@/types/Environment';
import { UserSettings } from '@/types/UserSettings';
import FormFieldComponent from '../form/FormFieldComponent';
import { CustomAlertDialog } from './CustomAlertDialog';
import { useComfyUIInstall } from '@/hooks/use-comfyui-install';

interface CreateEnvironmentDialogProps {
  children: React.ReactNode;
  userSettings: UserSettings;
  environments: Environment[];
  createEnvironmentHandler: (environment: EnvironmentInput) => Promise<void>;
}

export default function CreateEnvironmentDialog({ 
  children, 
  userSettings,
  environments, 
  createEnvironmentHandler 
}: CreateEnvironmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const defaultValues = {
    name: "",
    comfyUIPath: userSettings?.comfyui_path || "",
    command: userSettings?.command || "",
    port: String(userSettings?.port) || "8188",
    runtime: userSettings?.runtime || "nvidia",
    environmentType: EnvironmentTypeEnum.Default,
    mountConfig: []
  }

  const handleSubmit = async (values: EnvironmentFormValues) => {
    try {
      setIsLoading(true);
      const newEnvironment: EnvironmentInput = {
        ...values,
        image: values.image || "", // Add image handling if needed
        options: {
          "comfyui_release": values.release || "",
          "port": values.port,
          "mount_config": { mounts: values.mountConfig },
          "runtime": values.runtime
        }
      };
      await createEnvironmentHandler(newEnvironment);
      setIsOpen(false);
      toast({ title: "Success", description: "Environment created successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Hooks
  const {
    installComfyUIDialog,
    setInstallComfyUIDialog,
    isInstalling,
    handleInstallComfyUI
  } = useComfyUIInstall(form, releaseOptions, toast);

  return (
    <>
    <CustomAlertDialog
      open={installComfyUIDialog}
      title="Could not find valid ComfyUI installation"
      description="We could not find a valid ComfyUI installation at the path you provided. Should we try to install ComfyUI automatically?"
      cancelText="No"
      actionText="Yes"

      alternateActionText="Proceed without ComfyUI"
      onAction={handleInstallComfyUI}
      onCancel={async () => {
        setInstallComfyUIDialog(false);
      }}
      onAlternateAction={async () => {
        setInstallComfyUIDialog(false);
        await finishCreateEnvironment(pendingEnvironment);
      }}
      variant="default"
      loading={isInstalling}
    />
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <EnvironmentForm
          title="Create New Environment"
          defaultValues={defaultValues}
          environmentTypeOptions={EnvironmentTypeEnum}
          environmentTypeDescriptions={EnvironmentTypeDescriptions}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitButtonText="Create"
        >
          {/* Create-specific fields */}
          <FormFieldComponent
            name="release"
            label="ComfyUI Release"
            placeholder="latest"
          />
          <FormFieldComponent
            name="image"
            label="Custom Docker Image"
            placeholder="Optional: DockerHub image URL"
          />
        </EnvironmentForm>
      </DialogContent>
    </Dialog>
  );
}