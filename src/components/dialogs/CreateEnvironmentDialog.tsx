import React from "react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { EnvironmentForm } from "@/components/form/EnvironmentForm";
import { useToast } from "@/hooks/use-toast";
import {
  EnvironmentInput,
  EnvironmentTypeDescriptions,
  EnvironmentTypeEnum,
} from "@/types/Environment";
import { UserSettings } from "@/types/UserSettings";
import ImagePullDialog from "@/components/dialogs/PullImageDialog";
import {
  useEnvironmentCreation,
  useFormDefaults,
} from "@/hooks/environment-hooks";
import { DockerImageSelector } from "../DockerImageSelector";
import { DockerImageSelectFormField } from "../form/DockerImageSelectFormField";
import { ComfyUIVersionDialog } from "./ComfyUIInstallDialog";
import { Button } from "../ui/button";

interface CreateEnvironmentDialogProps {
  children: React.ReactNode;
  userSettings?: UserSettings;
  createEnvironmentHandler: (environment: EnvironmentInput) => Promise<void>;
}

const MOCK_INSTALLED_IMAGES = [
  "akatzai/comfydock-env:v0.3.15-py3.12-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.11-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.10-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.9-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.8-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.7-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.6-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.5-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.4-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.3-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.2-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.1-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py3.0-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py2.7-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py2.6-cuda12.1-ptstable",
  "akatzai/comfydock-env:v0.3.15-py2.5-cuda12.1-ptstable",
];

export default function CreateEnvironmentDialog({
  children,
  userSettings,
  createEnvironmentHandler,
}: CreateEnvironmentDialogProps) {
  const { toast } = useToast();
  const formDefaults = useFormDefaults(userSettings);
  const [dockerSelectorOpen, setDockerSelectorOpen] = useState(false);

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
    setIsLoading,
    setPendingEnvironment,
    setPullImageDialog,
    handleSubmit,
    handleInstallComfyUI,
    continueCreateEnvironment,
    handleInstallFinished,
    handleEnvironmentTypeChange,
  } = useEnvironmentCreation(
    formDefaults,
    createEnvironmentHandler,
    toast
  );

  useEffect(() => {
    if (isOpen) {
      form.reset(formDefaults);
    }
  }, [formDefaults, isOpen]);

  const handleImageSelect = (image: string) => {
    console.log("handleImageSelect", image);
    form.setValue("image", image);
  };

  // Filter out the Auto option from the environment type options
  const filteredEnvironmentTypeOptions: Record<string, string> = Object.values(
    EnvironmentTypeEnum
  )
    .filter((type) => type !== EnvironmentTypeEnum.Auto)
    .reduce((acc, type) => {
      acc[type] = type;
      return acc;
    }, {} as Record<string, string>);

  return (
    <>
      <ComfyUIVersionDialog
        open={installComfyUIDialog}
        title="Could not find valid ComfyUI installation"
        description="We could not find a valid ComfyUI installation at the path you provided. Should we try to install ComfyUI automatically?"
        cancelText="No"
        actionText="Yes"
        alternateActionText="Proceed without ComfyUI"
        onAction={(version) => handleInstallComfyUI(version)}
        onCancel={() => {
          console.log("onCancel");
          setInstallComfyUIDialog(false);
          setIsLoading(false);
        }}
        onAlternateAction={() => {
          console.log("onAlternateAction");
          setInstallComfyUIDialog(false);
          continueCreateEnvironment(pendingEnvironment, false);
          setIsLoading(false);
        }}
        variant="default"
        loading={isInstalling}
      />

      <ImagePullDialog
        image={pendingEnvironment?.image || ""}
        open={pullImageDialog}
        onOpenChange={(open) => {
          setPullImageDialog(open);
          if (!open) {
            setPendingEnvironment(null);
            setIsLoading(false);
          }
        }}
        onSuccess={() => {
          setPullImageDialog(false);
          setIsLoading(true);
          handleInstallFinished(pendingEnvironment);
        }}
      />

      <Dialog
        open={isOpen}
        onOpenChange={installComfyUIDialog ? undefined : setIsOpen}
      >
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[80vh] min-w-[600px] overflow-y-auto [scrollbar-gutter:stable] dialog-content">
          <DialogHeader>
            <DialogTitle>Create New Environment</DialogTitle>
          </DialogHeader>
          <EnvironmentForm
            form={form}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitButtonText="Create"
            environmentTypeOptions={filteredEnvironmentTypeOptions}
            environmentTypeDescriptions={EnvironmentTypeDescriptions}
            handleEnvironmentTypeChange={handleEnvironmentTypeChange}
          >
            <DockerImageSelectFormField
              name="image"
              label="Docker Image"
              placeholder="Select a Docker image"
              onOpenDialog={() => setDockerSelectorOpen(true)}
            />
          </EnvironmentForm>
        </DialogContent>
      </Dialog>

      <DockerImageSelector
        onSelect={handleImageSelect}
        open={dockerSelectorOpen}
        onOpenChange={setDockerSelectorOpen}
      />
    </>
  );
}
