import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  EnvironmentInput, 
  EnvironmentFormValues,
  baseFormSchema,
  EnvironmentTypeEnum,
  Mount,
  Environment
} from "@/types/Environment";
import { UserSettings, UserSettingsInput } from "@/types/UserSettings";
import { useComfyUIInstall } from "@/hooks/use-comfyui-install";
import { 
  checkImageExists, 
  checkValidComfyUIPath 
} from "@/api/environmentApi";
import { getDefaultMountConfigsForEnvType, parseExistingMountConfig } from "@/components/utils/MountConfigUtils";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_COMFYUI_PATH = import.meta.env.VITE_DEFAULT_COMFYUI_PATH;
const SUCCESS_TOAST_DURATION = 2000;

export const useFormDefaults = (userSettings?: UserSettings) => {
  return useMemo(() => ({
    name: "",
    image: null as string | null, // TODO: Add a default based on user's last used image
    comfyUIPath: userSettings?.comfyui_path || DEFAULT_COMFYUI_PATH || "",
    environmentType: EnvironmentTypeEnum.Default,
    command: userSettings?.command || "",
    port: String(userSettings?.port) || "8188",
    runtime: userSettings?.runtime || "nvidia",
    mountConfig: getDefaultMountConfigsForEnvType(
      EnvironmentTypeEnum.Default,
      userSettings?.comfyui_path || DEFAULT_COMFYUI_PATH || ""
    ) as Mount[]
  }), [userSettings]);
};

export const useEnvironmentCreation = (
  defaultValues: EnvironmentFormValues,
  selectedFolderRef: React.MutableRefObject<string | undefined>,
  createHandler: (env: EnvironmentInput) => Promise<void>,
  toast: ReturnType<typeof useToast>['toast'],
  updateUserSettingsHandler: (userSettings: UserSettingsInput) => Promise<void>
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEnvironment, setPendingEnvironment] = useState<EnvironmentInput | null>(null);
  const [pullImageDialog, setPullImageDialog] = useState(false);

  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(baseFormSchema),
    defaultValues,
    mode: "onChange"
  });

  const { 
    installComfyUIDialog, 
    setInstallComfyUIDialog,
    isInstalling,
    handleInstallComfyUI,
    showSettingsPrompt,
    installedPath,
    handleUpdateUserSettings,
    handleCancelSettingsUpdate
  } = useComfyUIInstall(form, toast, updateUserSettingsHandler, async (updatedComfyUIPath: string, updatedMountConfig: Mount[]) => {
    if (!pendingEnvironment) throw new Error("No pending environment");
    form.setValue("comfyUIPath", updatedComfyUIPath);
    form.setValue("mountConfig", updatedMountConfig)

    const updatedEnvironment: EnvironmentInput = {
      ...pendingEnvironment,
      comfyui_path: updatedComfyUIPath,
      name: pendingEnvironment?.name || "",
      image: pendingEnvironment?.image || "",
      options: {
        ...pendingEnvironment?.options,
        "comfyui_path": updatedComfyUIPath,
        "mount_config": {mounts: updatedMountConfig},
      }
    };
    setPendingEnvironment(updatedEnvironment);
    await continueCreateEnvironment(updatedEnvironment);
  });


  const createEnvironment = useCallback(async (env: EnvironmentInput | null) => {
    if (!env) return;

    // Update the environment with the selected folder
    env.folderIds = [selectedFolderRef.current || ""];
    
    try {
      await createHandler(env);
      setIsOpen(false);
      form.reset(defaultValues);
      toast({
        title: "Success",
        description: "Environment created successfully",
        duration: SUCCESS_TOAST_DURATION,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setPendingEnvironment(null);
    }
  }, [createHandler, form, defaultValues, toast]);

  const continueCreateEnvironment = useCallback(async (env: EnvironmentInput | null, installComfyUI: boolean = true) => {
    if (!env) return;
    try {
      let imageExists = false;
      let pathValid = false;
      try {
        if (installComfyUI) {
          try {
            pathValid = await checkValidComfyUIPath(env.comfyui_path || "");
          } catch (error: unknown) {
            console.error(error);
          }
        }
        imageExists = await checkImageExists(env.image);
      } catch (error: unknown) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive"
        });
      }

      if (installComfyUI && !pathValid) return setInstallComfyUIDialog(true);
      if (!imageExists) return setPullImageDialog(true);


      await createEnvironment(env);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  }, [createEnvironment, setInstallComfyUIDialog, setPullImageDialog, toast]);

  const handleSubmit = useCallback(async (values: EnvironmentFormValues) => {
    try {

      setIsLoading(true);
      
      const newEnvironment: EnvironmentInput = {
        name: values.name,
        image: values.image || "",
        command: values.command,
        comfyui_path: values.comfyUIPath,
        options: {
          port: values.port,
          mount_config: { mounts: values.mountConfig },
          runtime: values.runtime,
        }
      };

      setPendingEnvironment(newEnvironment);
      
      await continueCreateEnvironment(newEnvironment);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Submission failed",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [toast, continueCreateEnvironment]);

  const handleEnvironmentTypeChange = (newType: EnvironmentTypeEnum) => {
    form.setValue("environmentType", newType)
    const comfyUIPath = form.getValues("comfyUIPath")
    const standardConfig = getDefaultMountConfigsForEnvType(newType as EnvironmentTypeEnum, comfyUIPath)
    form.setValue("mountConfig", standardConfig as Mount[])
  }

  return {
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
    handleInstallFinished: createEnvironment,
    handleEnvironmentTypeChange
  };
};

export const useDuplicateFormDefaults = (
  environment: Environment,
  userSettings?: UserSettings
) => {
  return useMemo(() => {
    const existingMounts = parseExistingMountConfig(
      environment.options?.["mount_config"],
      environment.comfyui_path || ""
    );

    return {
      name: environment.name + "-copy",
      image: environment.metadata?.["base_image"] as string || "",
      comfyUIPath: environment.comfyui_path || userSettings?.comfyui_path || DEFAULT_COMFYUI_PATH || "",
      environmentType: EnvironmentTypeEnum.Auto,
      command: environment.command || userSettings?.command || "",
      port: (environment.options?.["port"] as string) || "8188",
      runtime: (environment.options?.["runtime"] as "nvidia" | "none") || "nvidia",
      mountConfig: existingMounts as Mount[],
    };
  }, [environment, userSettings]);
};

export const useEnvironmentDuplication = (
  defaultValues: EnvironmentFormValues,
  environment: Environment,
  selectedFolderRef: React.MutableRefObject<string | undefined>,
  duplicateHandler: (id: string, env: EnvironmentInput) => Promise<void>,
  setIsOpen: (open: boolean) => void,
  toast: ReturnType<typeof useToast>['toast']
) => {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(baseFormSchema),
    defaultValues,
    mode: "onChange"
  });
  // console.log(`default values: ${JSON.stringify(defaultValues)}`)

  const createEnvironment = useCallback(async (env: EnvironmentInput | null) => {
    console.log(`createEnvironment called with env: ${JSON.stringify(env)}`)
    if (!env) return;
    console.log(`creating environment with values: ${JSON.stringify(env)}`)
    // Update the environment with the selected folder
    env.folderIds = [selectedFolderRef.current || ""];
    console.log(`updated environment with folderId: ${JSON.stringify(env)}`)
    try {
      await duplicateHandler(environment.id || "", env);
      setIsOpen(false);
      form.reset(defaultValues);
      toast({
        title: "Success",
        description: "Environment duplicated successfully",
        duration: SUCCESS_TOAST_DURATION,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Duplication failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [duplicateHandler, environment.id, form, defaultValues, toast]);

  const handleSubmit = useCallback(async (values: EnvironmentFormValues) => {
    console.log(`submitting form with values: ${JSON.stringify(values)}`)
    try {
      setIsLoading(true);
      
      const newEnvironment: EnvironmentInput = {
        name: values.name,
        image: environment.image,
        command: values.command,
        comfyui_path: values.comfyUIPath,
        options: {
          port: values.port,
          mount_config: { mounts: values.mountConfig },
          runtime: values.runtime,
        }
      };

      await createEnvironment(newEnvironment);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [createEnvironment, environment.image, toast]);

  const handleEnvironmentTypeChange = (newType: EnvironmentTypeEnum) => {
    form.setValue("environmentType", newType)
    const comfyUIPath = form.getValues("comfyUIPath")
    const existingMounts = parseExistingMountConfig(environment.options?.["mount_config"], environment.comfyui_path || "")

    console.log(existingMounts)
    if (newType === EnvironmentTypeEnum.Auto) {
      console.log("Auto")
      const autoFilteredMounts = existingMounts.filter((m) => m.type === "mount")
      console.log(autoFilteredMounts)
      form.setValue("mountConfig", autoFilteredMounts as Mount[])
      return
    }

    if (newType === EnvironmentTypeEnum.Custom) {
      console.log("Custom")
      form.setValue("mountConfig", existingMounts as Mount[])
      return
    }

    const standardConfig = getDefaultMountConfigsForEnvType(newType, comfyUIPath)
    console.log(standardConfig)
    form.setValue("mountConfig", standardConfig as Mount[])
  }

  return {
    form,
    isLoading,
    handleSubmit,
    createEnvironment,
    handleEnvironmentTypeChange
  };
};