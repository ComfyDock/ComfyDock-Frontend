// hooks/use-comfyui-releases.ts
import { useState, useEffect } from "react";
import { getComfyUIImageTags } from "@/api/environmentApi";

// Module-level cache that persists for page lifetime
let cachedReleases: string[] | null = null;

export const useComfyUIReleases = () => {
  const [releaseOptions, setReleaseOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        // Return cached results if available
        if (cachedReleases) {
          setReleaseOptions(cachedReleases);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        const result = await getComfyUIImageTags();
        
        // Process tags and ensure "latest" is first
        const tagsArray = Object.values(result.tags).map(String);
        const filteredTags = tagsArray.filter(tag => tag !== "latest");
        const releases = ["latest", ...filteredTags];
        
        // Update cache and state
        cachedReleases = releases;
        setReleaseOptions(releases);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch ComfyUI releases:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch releases"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleases();
  }, []); // Empty dependency array ensures this runs once on mount

  return {
    releaseOptions,
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
        const tagsArray = Object.values(result.tags).map(String);
        const filteredTags = tagsArray.filter(tag => tag !== "latest");
        const releases = ["latest", ...filteredTags];
        
        cachedReleases = releases;
        setReleaseOptions(releases);
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