import {
  EnvironmentTypeEnum,
  Mount,
  MountActionEnum,
} from "@/types/Environment";
import { joinPaths } from "@/components/utils/PathUtils";

export const CONTAINER_COMFYUI_PATH = "/app/ComfyUI";

/**
 * createMountConfig
 *
 * Helper to create a single MountConfig object.
 * `containerDir` is the directory name inside the container (e.g. "models").
 * `comfyUIPath` is the local path to ComfyUI that we want to mount/copy from.
 * `action` is either "mount" or "copy".
 */
export function createMountConfig(
  containerDir: string,
  comfyUIPath: string,
  action: MountActionEnum
): Mount {
  return {
    container_path: `${CONTAINER_COMFYUI_PATH}/${containerDir}`,
    host_path: joinPaths(comfyUIPath, containerDir),
    type: action,
    read_only: false,
    override: false,
  };
}

/**
 * parseExistingMountConfig
 *
 * Converts the environment.options.mount_config from either old style or new style
 * into a new-style array of mount objects.
 */
export function parseExistingMountConfig(
  mountConfigData: any,
  comfyUIPath: string
): Mount[] {
  if (!mountConfigData) {
    return [];
  }

  // If it's new style with a "mounts" array, return that directly
  if (Array.isArray(mountConfigData.mounts)) {
    return mountConfigData.mounts;
  }

  // Otherwise assume old style: { "models": "mount", "output": "mount", "custom_nodes": "copy" }
  const results: Mount[] = [];

  // For each key, if the value is "mount" or "copy", create a new style object
  for (const [key, val] of Object.entries(mountConfigData)) {
    if (val === "mount" || val === "copy") {
      results.push({
        container_path: `${CONTAINER_COMFYUI_PATH}/${key}`,
        host_path: joinPaths(comfyUIPath, key),
        type: val === "mount" ? MountActionEnum.Mount : MountActionEnum.Copy,
        read_only: false,
        override: false,
      });
    }
  }

  // Add override field to existing configs
  return results.map((config) => ({
    ...config,
    override: config.override || false, // Default to false if missing
  }));
}

/**
 * getDefaultMountConfigsForEnvType
 *
 * Given the environment type and the comfyUIPath, returns an array of mount objects
 * that map to the user’s choice.
 */
export function getDefaultMountConfigsForEnvType(
  envType: EnvironmentTypeEnum,
  comfyUIPath: string
): Mount[] | undefined {
  switch (envType) {
    case EnvironmentTypeEnum.Default:
      return [
        createMountConfig("models", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("output", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("input", comfyUIPath, MountActionEnum.Mount),
      ];
    case EnvironmentTypeEnum.DefaultPlusWorkflows:
      return [
        createMountConfig("user", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("models", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("output", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("input", comfyUIPath, MountActionEnum.Mount),
      ];
    case EnvironmentTypeEnum.DefaultPlusCustomNodes:
      return [
        createMountConfig("custom_nodes", comfyUIPath, MountActionEnum.Copy),
        createMountConfig("models", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("output", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("input", comfyUIPath, MountActionEnum.Mount),
      ];
    case EnvironmentTypeEnum.DefaultPlusBoth:
      return [
        createMountConfig("custom_nodes", comfyUIPath, MountActionEnum.Copy),
        createMountConfig("user", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("models", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("output", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("input", comfyUIPath, MountActionEnum.Mount),
      ];
    case EnvironmentTypeEnum.Isolated:
      return [];
  }
}
