import React, { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EnvironmentInput,
  EnvironmentFormValues,
  envCoreSchema,          // <- NEW
  EnvironmentTypeEnum,
  Mount,
  Environment,
  formToInput,
  DEFAULT_OPTIONS,             // <- NEW
  createFormDefaults,
} from "@/types/Environment";
import { UserSettings, UserSettingsInput } from "@/types/UserSettings";
import { useComfyUIInstall } from "@/hooks/use-comfyui-install";
import {
  checkImageExists,
  checkValidComfyUIPath,
} from "@/api/environmentApi";
import {
  getDefaultMountConfigsForEnvType,
  parseExistingMountConfig,
} from "@/components/utils/MountConfigUtils";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_COMFYUI_PATH = import.meta.env.VITE_DEFAULT_COMFYUI_PATH;
const SUCCESS_TOAST_DURATION = 2000;

/* ------------------------------------------------------------------ *
 *  HELPER FUNCTIONS
 * ------------------------------------------------------------------ */
const getDefaultValue = <T>(
  userSettings: UserSettings | undefined,
  field: keyof UserSettings,
  defaultOptions: Record<string, T>,
  defaultOptionsField?: string
): T | undefined => {
  // Try userSettings first
  if (userSettings && field in userSettings) {
    const value = userSettings[field];
    if (value !== undefined && value !== "") {
      return value as T;
    }
  }
  
  // Then try DEFAULT_OPTIONS
  const optionsField = defaultOptionsField || field;
  if (optionsField in defaultOptions) {
    return defaultOptions[optionsField];
  }
  
  // Finally return undefined
  return undefined;
};

/* ------------------------------------------------------------------ *
 *  DEFAULTS FOR "CREATE" FORM
 * ------------------------------------------------------------------ */
export const useFormDefaults = (userSettings?: UserSettings): EnvironmentFormValues =>
  useMemo(() => createFormDefaults({ userSettings }), [userSettings]);

/* ------------------------------------------------------------------ *
 *  CREATE ENVIRONMENT HOOK
 * ------------------------------------------------------------------ */
export const useEnvironmentCreation = (
  defaultValues: EnvironmentFormValues,
  selectedFolderRef: React.MutableRefObject<string | undefined>,
  createHandler: (env: EnvironmentInput) => Promise<void>,
  toast: ReturnType<typeof useToast>["toast"],
  updateUserSettingsHandler: (
    userSettings: UserSettingsInput,
  ) => Promise<void>,
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEnvironment, setPendingEnvironment] =
    useState<EnvironmentInput | null>(null);
  const [pullImageDialog, setPullImageDialog] = useState(false);

  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(envCoreSchema), // <- UPDATED
    defaultValues,
    mode: "onChange",
  });

  /* ---------------- install-ComfyUI helper ---------------- */
  const {
    installComfyUIDialog,
    setInstallComfyUIDialog,
    isInstalling,
    handleInstallComfyUI,
    showSettingsPrompt,
    installedPath,
    handleUpdateUserSettings,
    handleCancelSettingsUpdate,
  } = useComfyUIInstall(
    form,
    toast,
    updateUserSettingsHandler,
    async (
      updatedComfyUIPath: string,
      updatedMountConfig: Mount[],
    ) => {
      if (!pendingEnvironment) throw new Error("No pending environment");

      form.setValue("comfyui_path", updatedComfyUIPath);
      form.setValue("mount_config", { mounts: updatedMountConfig });

      const updatedEnvironment: EnvironmentInput = {
        ...pendingEnvironment,
        comfyui_path: updatedComfyUIPath,
        options: {
          ...pendingEnvironment.options,
          mount_config: { mounts: updatedMountConfig }, // <- camel-case
        },
      };
      setPendingEnvironment(updatedEnvironment);
      await continueCreateEnvironment(updatedEnvironment);
    },
  );

  /* ---------------- core creator fn ---------------- */
  const createEnvironment = useCallback(
    async (env: EnvironmentInput | null) => {
      if (!env) return;

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
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setPendingEnvironment(null);
      }
    },
    [createHandler, form, defaultValues, toast],
  );

  /* ---------------- pre-flight checks ---------------- */
  const continueCreateEnvironment = useCallback(
    async (env: EnvironmentInput | null, installComfyUI = true) => {
      if (!env) return;
      try {
        let imageExists = false;
        let pathValid = false;
        try {
          if (installComfyUI) {
            pathValid = await checkValidComfyUIPath(env.comfyui_path || "");
          }
          imageExists = await checkImageExists(env.image);
        } catch (error) {
          toast({
            title: "Error",
            description:
              error instanceof Error ? error.message : "Unknown error occurred",
            variant: "destructive",
          });
        }

        if (installComfyUI && !pathValid)
          return setInstallComfyUIDialog(true);
        if (!imageExists) return setPullImageDialog(true);

        await createEnvironment(env);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    [createEnvironment, setInstallComfyUIDialog, setPullImageDialog, toast],
  );

  /* ---------------- onSubmit handler ---------------- */
  const handleSubmit = useCallback(
    async (values: EnvironmentFormValues) => {
      try {
        setIsLoading(true);

        const newEnvironment = formToInput(values);
        setPendingEnvironment(newEnvironment);

        await continueCreateEnvironment(newEnvironment);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Submission failed",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    },
    [toast, continueCreateEnvironment],
  );

  /* ---------------- quick switch for predefined configs ---------------- */
  const handleEnvironmentTypeChange = (newType: EnvironmentTypeEnum) => {
    form.setValue("environment_type", newType);
    const comfyUIPath = form.getValues("comfyui_path");
    const standardConfig = getDefaultMountConfigsForEnvType(
      newType,
      comfyUIPath,
    );
    form.setValue("mount_config.mounts", standardConfig as Mount[]);
  };

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
    handleEnvironmentTypeChange,
  };
};

/* ------------------------------------------------------------------ *
 *  DEFAULTS FOR "DUPLICATE" FORM
 * ------------------------------------------------------------------ */
export const useDuplicateFormDefaults = (
  environment: Environment
): EnvironmentFormValues =>
  useMemo(() => createFormDefaults({ environment }), [environment]);

/* ------------------------------------------------------------------ *
 *  DUPLICATE HOOK
 * ------------------------------------------------------------------ */
export const useEnvironmentDuplication = (
  defaultValues: EnvironmentFormValues,
  environment: Environment,
  selectedFolderRef: React.MutableRefObject<string | undefined>,
  duplicateHandler: (id: string, env: EnvironmentInput) => Promise<void>,
  setIsOpen: (open: boolean) => void,
  toast: ReturnType<typeof useToast>["toast"],
) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(envCoreSchema), // <- UPDATED
    defaultValues,
    mode: "onChange",
  });

  const createEnvironment = useCallback(
    async (env: EnvironmentInput | null) => {
      if (!env) return;

      env.folderIds = [selectedFolderRef.current || ""];

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
          description:
            error instanceof Error ? error.message : "Duplication failed",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [duplicateHandler, environment.id, form, defaultValues, toast],
  );

  const handleSubmit = useCallback(
    async (values: EnvironmentFormValues) => {
      try {
        setIsLoading(true);

        const newEnvironment = formToInput(values);

        await createEnvironment(newEnvironment);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    },
    [createEnvironment, environment.image, toast],
  );

  const handleEnvironmentTypeChange = (newType: EnvironmentTypeEnum) => {
    form.setValue("environment_type", newType);
    const comfyUIPath = form.getValues("comfyui_path");
    const existingMounts = parseExistingMountConfig(
      environment.options?.["mount_config"],
      environment.comfyui_path || "",
    );

    if (newType === EnvironmentTypeEnum.Auto) {
      form.setValue(
        "mount_config.mounts",
        existingMounts.filter((m) => m.type === "mount") as Mount[]
      );
      return;
    }

    if (newType === EnvironmentTypeEnum.Custom) {
      form.setValue("mount_config.mounts", existingMounts as Mount[]);
      return;
    }

    const standardConfig = getDefaultMountConfigsForEnvType(
      newType,
      comfyUIPath,
    );
    form.setValue("mount_config.mounts", standardConfig as Mount[]);
  };

  return {
    form,
    isLoading,
    handleSubmit,
    createEnvironment,
    handleEnvironmentTypeChange,
  };
};
