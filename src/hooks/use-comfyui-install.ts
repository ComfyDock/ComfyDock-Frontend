import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { EnvironmentInput, Mount } from '@/types/Environment';
import { checkValidComfyUIPath, tryInstallComfyUI } from '@/api/environmentApi';
import { getDefaultMountConfigsForEnvType } from '@/components/utils/MountConfigUtils';
import { useToast } from '@/hooks/use-toast';
import { joinPaths, updateComfyUIPath } from '@/components/utils/PathUtils';

export const useComfyUIInstall = (
  form: UseFormReturn<any>,
  releaseOptions: string[],
  toast: ReturnType<typeof useToast>['toast']
) => {
  const [installComfyUIDialog, setInstallComfyUIDialog] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);


  const getLatestComfyUIReleaseFromBranch = (branch: string, releases: string[]) => {
    if (branch === "latest") {
      const filteredReleases = releases.filter(release => release !== "latest");
      return filteredReleases[0] || "latest"; // fallback to latest if none found
    }
    return branch;
  }

  const handleInstallComfyUI = async () => {
    try {
      const comfyUIPath = form.getValues("comfyUIPath");
      const branch = getLatestComfyUIReleaseFromBranch(form.getValues("release"), releaseOptions);
      
      setIsInstalling(true);
      await tryInstallComfyUI(comfyUIPath, branch);

      const updatedPath = updateComfyUIPath(comfyUIPath);
      form.setValue("comfyUIPath", updatedPath);

      updateMountConfigs(updatedPath);
      setInstallComfyUIDialog(false);
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
    
    form.setValue("mountConfig", currentType === 'Custom' ? updatedMounts : 
      getDefaultMountConfigsForEnvType(currentType, comfyUIPath));
  };

  return {
    installComfyUIDialog,
    setInstallComfyUIDialog,
    isInstalling,
    handleInstallComfyUI,
    updateComfyUIPath
  };
};

