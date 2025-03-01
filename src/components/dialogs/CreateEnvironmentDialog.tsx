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
import { UserSettings, UserSettingsInput } from "@/types/UserSettings";
import ImagePullDialog from "@/components/dialogs/PullImageDialog";
import {
  useEnvironmentCreation,
  useFormDefaults,
} from "@/hooks/environment-hooks";
import { DockerImageSelector } from "../DockerImageSelector";
import { DockerImageSelectFormField } from "../form/DockerImageSelectFormField";
import { ComfyUIVersionDialog } from "./ComfyUIInstallDialog";

interface CreateEnvironmentDialogProps {
  children: React.ReactNode;
  userSettings?: UserSettings;
  selectedFolderRef: React.MutableRefObject<string | undefined>;
  createEnvironmentHandler: (environment: EnvironmentInput) => Promise<void>;
  updateUserSettingsHandler: (userSettings: UserSettingsInput) => Promise<void>;
}

export default function CreateEnvironmentDialog({
  children,
  userSettings,
  selectedFolderRef,
  createEnvironmentHandler,
  updateUserSettingsHandler,
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
    showSettingsPrompt,
    installedPath,
    setInstallComfyUIDialog,
    setIsOpen,
    setIsLoading,
    setPendingEnvironment,
    setPullImageDialog,
    handleSubmit,
    handleInstallComfyUI,
    handleUpdateUserSettings,
    handleCancelSettingsUpdate,
    continueCreateEnvironment,
    handleInstallFinished,
    handleEnvironmentTypeChange,
  } = useEnvironmentCreation(formDefaults, selectedFolderRef, createEnvironmentHandler, toast, updateUserSettingsHandler);

  useEffect(() => {
    if (isOpen) {
      console.log("isOpen", isOpen);
      console.log("formDefaults", formDefaults);
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
        title={showSettingsPrompt 
          ? "Update Default ComfyUI Path" 
          : "Could not find valid ComfyUI installation"}
        description={showSettingsPrompt
          ? `Would you like to use this new ComfyUI path (${installedPath}) as the default for future environments?`
          : "We could not find a valid ComfyUI installation at the path you provided. Should we try to install ComfyUI automatically?"}
        cancelText={showSettingsPrompt ? "No" : "No"}
        actionText={showSettingsPrompt ? "Yes" : "Yes"}
        alternateActionText={showSettingsPrompt ? undefined : "Proceed without ComfyUI"}
        onAction={(version) => {
          console.log("onAction", version);
          return showSettingsPrompt 
            ? handleUpdateUserSettings(installedPath)
            : handleInstallComfyUI(version)
        }}
        onCancel={() => {
          console.log("onCancel");
          if (showSettingsPrompt) {
            handleCancelSettingsUpdate();
          } else {
            setInstallComfyUIDialog(false);
            setIsLoading(false);
          }
        }}
        onAlternateAction={showSettingsPrompt ? undefined : () => {
          console.log("onAlternateAction");
          setInstallComfyUIDialog(false);
          continueCreateEnvironment(pendingEnvironment, false);
          setIsLoading(false);
        }}
        onUpdateUserSettings={showSettingsPrompt
          ? (path) => handleUpdateUserSettings(path)
          : undefined
        }
        variant="default"
        loading={isInstalling}
        showSettingsPrompt={showSettingsPrompt}
        installedPath={installedPath}
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
