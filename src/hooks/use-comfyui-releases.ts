// hooks/use-comfyui-releases.ts
import { useState, useEffect } from "react";
import { getComfyUIImageTags, getInstalledImages } from "@/api/environmentApi";
import { ImageTag, InstalledImage } from "@/types/Images";

// Module-level cache that persists for page lifetime
let cachedReleases: ImageTag[] | null = null;
let cachedInstalledImages: InstalledImage[] | null = null;
export const useComfyUIReleases = (open: boolean) => {
  const [releaseOptions, setReleaseOptions] = useState<ImageTag[]>([]);
  const [installedImages, setInstalledImages] = useState<InstalledImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchReleases = async () => {
      try {
        // Return cached results if available
        if (cachedReleases) {
          console.log("Using cached releases");
          setReleaseOptions(cachedReleases);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        console.log("Fetching releases");
        const result = await getComfyUIImageTags();
        console.log("Releases fetched:", result);
        // Process tags and ensure "latest" is first
        const tagsArray = result.tags;
        // const filteredTags = tagsArray.filter(tag => tag !== "latest");
        // const releases = ["latest", ...filteredTags];
        
        // Update cache and state
        cachedReleases = tagsArray;
        setReleaseOptions(tagsArray);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch ComfyUI releases:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch releases"));
      } finally {
        setIsLoading(false);
      }
    };

    const fetchInstalledImages = async () => {
      try {
        if (cachedInstalledImages) {
          console.log("Using cached installed images");
          setInstalledImages(cachedInstalledImages);
          setIsLoading(false);
          return;
        }
        const installedImages = await getInstalledImages();
        console.log("installedImages", installedImages);
        setInstalledImages(installedImages.images);
        // cachedInstalledImages = installedImages.images;
      } catch (error) {
        console.error("Error fetching installed images:", error);
      }
    };

    fetchInstalledImages();
    fetchReleases();
  }, [open]); // Empty dependency array ensures this runs once on mount

  return {
    releaseOptions,
    installedImages,
    isLoading,
    error,
    /**
     * Manual refresh option for future use
     * (Not currently used but available if needed)
     */
    refresh: async () => {
      try {
        setIsLoading(true);
        const result = await getComfyUIImageTags();
        const tagsArray = result.tags;
        
        cachedReleases = tagsArray;
        setReleaseOptions(tagsArray);
        setError(null);
      } catch (err) {
        console.error("Failed to refresh ComfyUI releases:", err);
        setError(err instanceof Error ? err : new Error("Failed to refresh releases"));
      } finally {
        setIsLoading(false);
      }
    }
  };
};