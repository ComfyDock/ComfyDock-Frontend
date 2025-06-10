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
 *  DEFAULTS FOR "CREATE" FORM
 * ------------------------------------------------------------------ */
export const useFormDefaults = (userSettings?: UserSettings): EnvironmentFormValues =>
  useMemo(
    () => ({
      // Core fields
      name: "",
      image: "",
      comfyui_path: userSettings?.comfyui_path || DEFAULT_COMFYUI_PATH || "",
      environment_type: EnvironmentTypeEnum.Default,
      command: userSettings?.command || "",
      folderIds: undefined,

      // Options fields
      port: String(userSettings?.port) || DEFAULT_OPTIONS.port,
      runtime: userSettings?.runtime || DEFAULT_OPTIONS.runtime,
      url: DEFAULT_OPTIONS.url,
      mount_config: {
        mounts: getDefaultMountConfigsForEnvType(
          EnvironmentTypeEnum.Default,
          userSettings?.comfyui_path || DEFAULT_COMFYUI_PATH || "",
        ) as Mount[],
      },
      entrypoint: undefined,
      environment_variables: undefined,
    }),
    [userSettings],
  );

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
    console.log(`handleEnvironmentTypeChange: ${newType}`);
    form.setValue("environment_type", newType);
    const comfyUIPath = form.getValues("comfyui_path");
    const standardConfig = getDefaultMountConfigsForEnvType(
      newType,
      comfyUIPath,
    );
    console.log(`standardConfig: ${JSON.stringify(standardConfig)}`);
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
  environment: Environment,
  userSettings?: UserSettings,
): EnvironmentFormValues =>
  useMemo(() => {
    const existingMounts = parseExistingMountConfig(
      environment.options?.["mount_config"],
      environment.comfyui_path || "",
    );

    return {
      // Core fields
      name: `${environment.name}-copy`,
      image: (environment.metadata?.["base_image"] as string) ?? environment.image ?? "",
      comfyui_path: environment.comfyui_path || userSettings?.comfyui_path || DEFAULT_COMFYUI_PATH || "",
      environment_type: EnvironmentTypeEnum.Auto,
      command: environment.command || userSettings?.command || "",
      folderIds: undefined,

      // Options fields
      port: (environment.options?.["port"] as string) || DEFAULT_OPTIONS.port,
      runtime: (environment.options?.["runtime"] as "nvidia" | "none") || DEFAULT_OPTIONS.runtime,
      url: environment.options?.["url"] as string || DEFAULT_OPTIONS.url,
      mount_config: {
        mounts: existingMounts as Mount[],
      },
      entrypoint: environment.options?.["entrypoint"] as string || undefined,
      environment_variables: environment.options?.["environment_variables"] as string || undefined,
    };
  }, [environment, userSettings]);

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
        console.log(`newEnvironment: ${JSON.stringify(newEnvironment)}`);

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
