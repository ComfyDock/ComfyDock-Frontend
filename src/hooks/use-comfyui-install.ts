import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { EnvironmentFormValues, Mount } from '@/types/Environment';
import { tryInstallComfyUI, updateUserSettings } from '@/api/environmentApi';
import { getDefaultMountConfigsForEnvType } from '@/components/utils/MountConfigUtils';
import { useToast } from '@/hooks/use-toast';
import { joinPaths, updateComfyUIPath } from '@/components/utils/PathUtils';
import { UserSettingsInput } from '@/types/UserSettings';
export const useComfyUIInstall = (
  form: UseFormReturn<EnvironmentFormValues>,
  toast: ReturnType<typeof useToast>['toast'],
  updateUserSettingsHandler: (userSettings: UserSettingsInput) => Promise<void>,
  handleInstallFinished?: (updatedComfyUIPath: string, updatedMountConfig: Mount[]) => Promise<void>,
) => {
  const [installComfyUIDialog, setInstallComfyUIDialog] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSettingsPrompt, setShowSettingsPrompt] = useState(false);
  const [installedPath, setInstalledPath] = useState("");

  const handleInstallComfyUI = async (branch: string) => {
    try {
      const comfyUIPath = form.getValues("comfyui_path");
      
      setIsInstalling(true);
      await tryInstallComfyUI(comfyUIPath, branch);

      const updatedPath = updateComfyUIPath(comfyUIPath);
      form.setValue("comfyui_path", updatedPath);

      const finalMounts = updateMountConfigs(updatedPath);
      
      // Show settings prompt instead of closing the dialog
      setInstalledPath(updatedPath);
      setIsInstalling(false);
      setShowSettingsPrompt(true);
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: "An unknown error occurred", variant: "destructive" });
      }
      setIsInstalling(false);
    }
  };

  const updateMountConfigs = (comfyUIPath: string): Mount[] => {
    const currentType = form.getValues("environment_type");
    const updatedMounts = form.getValues("mount_config.mounts").map((config: Mount) => {
      if (!config.override) {
        const dir = config.container_path.split('/').pop();
        return { ...config, host_path: joinPaths(comfyUIPath, dir || '') };
      }
      return config;
    });
    
    const finalMounts = currentType === 'Custom' ? updatedMounts : 
      getDefaultMountConfigsForEnvType(currentType, comfyUIPath);
    form.setValue("mount_config.mounts", finalMounts || []);
    return finalMounts || [];
  };

  const handleUpdateUserSettings = async (path: string) => {
    try {
      // Update user settings with the new ComfyUI path
      await updateUserSettingsHandler({
        comfyui_path: path
      });
      
      toast({ 
        title: "Success", 
        description: "ComfyUI installed successfully and set as default path" 
      });
      
      // Close dialog and continue with environment creation
      finishInstallation(path);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update settings, but ComfyUI was installed", 
        variant: "destructive" 
      });
      // Still finish the installation even if settings update fails
      finishInstallation(path);
    }
  };

  const handleCancelSettingsUpdate = () => {
    toast({ 
      title: "Success", 
      description: "ComfyUI installed successfully" 
    });
    // Proceed without updating settings
    finishInstallation(installedPath);
  };

  const finishInstallation = async (path: string) => {
    const finalMounts = updateMountConfigs(path);
    setInstallComfyUIDialog(false);
    setShowSettingsPrompt(false);
    await handleInstallFinished?.(path, finalMounts || []);
  };

  return {
    installComfyUIDialog,
    setInstallComfyUIDialog,
    isInstalling,
    showSettingsPrompt,
    installedPath,
    handleInstallComfyUI,
    handleUpdateUserSettings,
    handleCancelSettingsUpdate,
    updateComfyUIPath
  };
};

