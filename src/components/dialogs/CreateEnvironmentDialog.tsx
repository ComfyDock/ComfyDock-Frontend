import { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { EnvironmentForm } from "@/components/form/EnvironmentForm";
import { useToast } from "@/hooks/use-toast";
import { EnvironmentInput, EnvironmentTypeDescriptions, EnvironmentTypeEnum } from "@/types/Environment";
import { UserSettings } from "@/types/UserSettings";
import { CustomAlertDialog } from "./CustomAlertDialog";
import ImagePullDialog from "./PullImageDialog";
import { SelectFormField } from "../form/SelectFormField";
import FormFieldComponent from "../form/FormFieldComponent";
import { useComfyUIReleases } from "@/hooks/use-comfyui-releases";
import { useEnvironmentCreation, useFormDefaults } from "@/hooks/environment-hooks";

interface CreateEnvironmentDialogProps {
  children: React.ReactNode;
  userSettings?: UserSettings;
  createEnvironmentHandler: (environment: EnvironmentInput) => Promise<void>;
}

export default function CreateEnvironmentDialog({
  children,
  userSettings,
  createEnvironmentHandler,
}: CreateEnvironmentDialogProps) {
  const { toast } = useToast();
  const { releaseOptions } = useComfyUIReleases();
  const formDefaults = useFormDefaults(userSettings);
  
  const {
    form,
    isOpen,
    isLoading,
    pendingEnvironment,
    pullImageDialog,
    installComfyUIDialog,
    isInstalling,
    setInstallComfyUIDialog,
    setIsOpen,
    setPullImageDialog,
    handleSubmit,
    handleInstallComfyUI,
    handleInstallFinished,
    handleEnvironmentTypeChange
  } = useEnvironmentCreation(formDefaults, releaseOptions, createEnvironmentHandler, toast);

  useEffect(() => {
    if (isOpen) {
      form.reset(formDefaults)
    }
  }, [formDefaults, isOpen])

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
        onCancel={() => setInstallComfyUIDialog(false)}
        onAlternateAction={() => handleInstallFinished(pendingEnvironment)}
        variant="default"
        loading={isInstalling}
      />

      <ImagePullDialog
        image={pendingEnvironment?.image || ""}
        open={pullImageDialog}
        onOpenChange={setPullImageDialog}
        onSuccess={() => handleInstallFinished(pendingEnvironment)}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[80vh] min-w-[600px] overflow-y-auto dialog-content">
          <DialogHeader>
            <DialogTitle>Create New Environment</DialogTitle>
          </DialogHeader>
          <EnvironmentForm
            form={form}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitButtonText="Create"
            environmentTypeOptions={EnvironmentTypeEnum}
            environmentTypeDescriptions={EnvironmentTypeDescriptions}
            handleEnvironmentTypeChange={handleEnvironmentTypeChange}
          >
            <SelectFormField
              name="release"
              label="ComfyUI Release"
              options={releaseOptions}
              placeholder="Select a release"
            />
            
            <FormFieldComponent
              name="image"
              label="Custom Docker Image"
              placeholder="Optional: DockerHub image URL"
            />
          </EnvironmentForm>
        </DialogContent>
      </Dialog>
    </>
  );
}