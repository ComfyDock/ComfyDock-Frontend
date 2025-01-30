import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { EnvironmentInput, Mount, MountConfigFormValues } from '@/types/Environment';
import { checkValidComfyUIPath, tryInstallComfyUI } from '@/api/environmentApi';
import { getDefaultMountConfigsForEnvType } from '@/components/utils/MountConfigUtils';
import { useToast } from '@/hooks/use-toast';
import { joinPaths, updateComfyUIPath } from '@/components/utils/PathUtils';
import { getLatestComfyUIReleaseFromBranch } from '@/components/utils/ComfyUtils';


export const useComfyUIInstall = (
  form: UseFormReturn<any>,
  releaseOptions: string[],
  toast: ReturnType<typeof useToast>['toast'],
  handleInstallFinished?: (updatedComfyUIPath: string, updatedMountConfig: MountConfigFormValues[]) => void,
) => {
  const [installComfyUIDialog, setInstallComfyUIDialog] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallComfyUI = async () => {
    try {
      const comfyUIPath = form.getValues("comfyUIPath");
      const branch = getLatestComfyUIReleaseFromBranch(form.getValues("release"), releaseOptions);
      
      setIsInstalling(true);
      await tryInstallComfyUI(comfyUIPath, branch);

      const updatedPath = updateComfyUIPath(comfyUIPath);
      form.setValue("comfyUIPath", updatedPath);

      const finalMounts = updateMountConfigs(updatedPath);
      setInstallComfyUIDialog(false);
      handleInstallFinished?.(updatedPath, finalMounts);
      toast({ title: "Success", description: "ComfyUI installed successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsInstalling(false);
    }
  };

  const updateMountConfigs = (comfyUIPath: string) => {
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
    form.setValue("mountConfig", finalMounts);
    return finalMounts;
  };

  return {
    installComfyUIDialog,
    setInstallComfyUIDialog,
    isInstalling,
    handleInstallComfyUI,
    updateComfyUIPath
  };
};

