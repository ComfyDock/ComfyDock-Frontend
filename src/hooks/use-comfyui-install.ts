import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { EnvironmentFormValues, Mount } from '@/types/Environment';
import { tryInstallComfyUI } from '@/api/environmentApi';
import { getDefaultMountConfigsForEnvType } from '@/components/utils/MountConfigUtils';
import { useToast } from '@/hooks/use-toast';
import { joinPaths, updateComfyUIPath } from '@/components/utils/PathUtils';

export const useComfyUIInstall = (
  form: UseFormReturn<EnvironmentFormValues>,
  toast: ReturnType<typeof useToast>['toast'],
  handleInstallFinished?: (updatedComfyUIPath: string, updatedMountConfig: Mount[]) => Promise<void>,
) => {
  const [installComfyUIDialog, setInstallComfyUIDialog] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallComfyUI = async (branch: string) => {
    try {
      const comfyUIPath = form.getValues("comfyUIPath");
      
      setIsInstalling(true);
      await tryInstallComfyUI(comfyUIPath, branch);

      const updatedPath = updateComfyUIPath(comfyUIPath);
      form.setValue("comfyUIPath", updatedPath);

      const finalMounts = updateMountConfigs(updatedPath);
      setInstallComfyUIDialog(false);
      await handleInstallFinished?.(updatedPath, finalMounts || []);
      toast({ title: "Success", description: "ComfyUI installed successfully" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: "An unknown error occurred", variant: "destructive" });
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const updateMountConfigs = (comfyUIPath: string): Mount[] => {
    const currentType = form.getValues("environmentType");
    const updatedMounts = form.getValues("mountConfig").map((config: Mount) => {
      if (!config.override) {
        const dir = config.container_path.split('/').pop();
        return { ...config, host_path: joinPaths(comfyUIPath, dir || '') };
      }
      return config;
    });
    
    const finalMounts = currentType === 'Custom' ? updatedMounts : 
      getDefaultMountConfigsForEnvType(currentType, comfyUIPath);
    form.setValue("mountConfig", finalMounts || []);
    return finalMounts || [];
  };

  return {
    installComfyUIDialog,
    setInstallComfyUIDialog,
    isInstalling,
    handleInstallComfyUI,
    updateComfyUIPath
  };
};

