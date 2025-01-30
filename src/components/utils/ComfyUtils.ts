
export const COMFYUI_IMAGE_NAME = "akatzai/comfyui-env"

export const getLatestComfyUIReleaseFromBranch = (branch: string, releases: string[]) => {
  if (branch === "latest") {
    const filteredReleases = releases.filter(release => release !== "latest");
    return filteredReleases[0] || "latest"; // fallback to latest if none found
  }
  return branch;
}
