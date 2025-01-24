
export const CONTAINER_COMFYUI_PATH = "/app/ComfyUI"

export function joinPaths(basePath: string, subPath: string): string {
  // Determine the separator style based on the basePath
  const separator = basePath.includes('\\') ? '\\' : '/';

  // Normalize the paths to ensure consistent separators
  // const normalizedBasePath = basePath.replace(/\\/g, '/');
  // const normalizedSubPath = subPath.replace(/\\/g, '/');

  // Join the paths using the determined separator
  const joinedPath = [basePath, subPath].join('/').replace(/\/+/g, '/');

  // Convert back to the original separator style
  return joinedPath.replace(/\//g, separator);
}

/**
 * The kind of mount/copy action we're supporting
 */
export enum MountActionEnum {
  Mount = "mount",
  Copy = "copy"
}

export type MountAction = MountActionEnum

/**
 * Type of environment for which we build a mount config
 */
export enum EnvironmentTypeEnum {
  Default = "Default",
  DefaultPlusWorkflows = "Default+Workflows",
  DefaultPlusCustomNodes = "Default+CustomNodes",
  DefaultPlusBoth = "Default+Both",
  Isolated = "Isolated",
  Custom = "Custom"
}

export type EnvironmentType = EnvironmentTypeEnum

// Expand your environment type enum to also have "Auto"
export const CombinedEnvironmentTypeEnum = {
  Auto: "Auto",
  ...EnvironmentTypeEnum,
} as const
export type CombinedEnvironmentType = EnvironmentTypeEnum | "Auto"

export const EnvironmentTypeDescriptions = {
  [CombinedEnvironmentTypeEnum.Auto]: 'Keeps the same mount configuration as the original environment, excluding copied directories.',
  [EnvironmentTypeEnum.Default]: 'Mounts models, output, and input directories from your local ComfyUI installation.',
  [EnvironmentTypeEnum.DefaultPlusWorkflows]: 'Same as default, but also mounts workflows from your local ComfyUI installation.',
  [EnvironmentTypeEnum.DefaultPlusCustomNodes]: 'Same as default, but also copies and installs custom nodes from your local ComfyUI installation.',
  [EnvironmentTypeEnum.DefaultPlusBoth]: 'Same as default, but also mounts workflows and copies custom nodes from your local ComfyUI installation.',
  [EnvironmentTypeEnum.Isolated]: 'Creates an isolated environment with no mounts.',
  [EnvironmentTypeEnum.Custom]: 'Allows for advanced configuration options.',
}


interface MountConfig {
  container_path: string
  host_path: string
  type: MountAction
  read_only: boolean
}

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
  action: MountAction
): MountConfig {
  return {
    container_path: `${CONTAINER_COMFYUI_PATH}/${containerDir}`,
    host_path: joinPaths(comfyUIPath, containerDir),
    type: action,
    read_only: false,
  }
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
): MountConfig[] {
  if (!mountConfigData) {
    return [];
  }

  // If it's new style with a "mounts" array, return that directly
  if (Array.isArray(mountConfigData.mounts)) {
    return mountConfigData.mounts;
  }

  // Otherwise assume old style: { "models": "mount", "output": "mount", "custom_nodes": "copy" }
  const results: MountConfig[] = [];

  // For each key, if the value is "mount" or "copy", create a new style object
  for (const [key, val] of Object.entries(mountConfigData)) {
    if (val === "mount" || val === "copy") {
      results.push({
        container_path: `${CONTAINER_COMFYUI_PATH}/${key}`,
        host_path: joinPaths(comfyUIPath, key),
        type: val === "mount" ? MountActionEnum.Mount : MountActionEnum.Copy,
        read_only: false,
      });
    }
  }

  return results;
}

/**
 * getDefaultMountConfigsForEnvType
 * 
 * Given the environment type and the comfyUIPath, returns an array of mount configs
 * that map to the user’s choice.
 */
export function getDefaultMountConfigsForEnvType(
  envType: EnvironmentType,
  comfyUIPath: string
): MountConfig[] {
  switch (envType) {
    case EnvironmentTypeEnum.Default:
      return [
        createMountConfig("models", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("output", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("input", comfyUIPath, MountActionEnum.Mount),
      ]
    case EnvironmentTypeEnum.DefaultPlusWorkflows:
      return [
        createMountConfig("user", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("models", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("output", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("input", comfyUIPath, MountActionEnum.Mount),
      ]
    case EnvironmentTypeEnum.DefaultPlusCustomNodes:
      return [
        createMountConfig("custom_nodes", comfyUIPath, MountActionEnum.Copy),
        createMountConfig("models", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("output", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("input", comfyUIPath, MountActionEnum.Mount),
      ]
    case EnvironmentTypeEnum.DefaultPlusBoth:
      return [
        createMountConfig("custom_nodes", comfyUIPath, MountActionEnum.Copy),
        createMountConfig("user", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("models", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("output", comfyUIPath, MountActionEnum.Mount),
        createMountConfig("input", comfyUIPath, MountActionEnum.Mount),
      ]
    case EnvironmentTypeEnum.Isolated:
      return []
    case EnvironmentTypeEnum.Custom:
      // For custom, we typically might not generate anything.
      // Or if you’d like to have a different default for custom, you can do so here.
      return []
  }
}
