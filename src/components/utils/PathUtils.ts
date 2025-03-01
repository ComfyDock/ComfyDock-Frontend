
export function joinPaths(basePath: string, subPath: string): string {
  // Determine the separator style based on the basePath
  const separator = basePath.includes("\\") ? "\\" : "/";

  // Normalize the paths to ensure consistent separators
  // const normalizedBasePath = basePath.replace(/\\/g, '/');
  // const normalizedSubPath = subPath.replace(/\\/g, '/');

  // Join the paths using the determined separator
  const joinedPath = [basePath, subPath].join("/").replace(/\/+/g, "/");

  // Convert back to the original separator style
  return joinedPath.replace(/\//g, separator);
}

export const updateComfyUIPath = (comfyUIPath: string) => {
  return joinPaths(comfyUIPath, "ComfyUI");
};