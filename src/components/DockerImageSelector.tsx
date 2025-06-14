import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComfyUIReleases } from "@/hooks/use-comfyui-releases";
import { Badge } from "@/components/ui/badge";

interface DockerImage {
  tag: string;
  comfyUIVersion: string;
  pythonVersion: string;
  cudaVersion: string;
  pytorchVersion?: string;
  fullImageName: string;
  size: number;
  lastUpdated: string;
  digest: string;
}

type SortField = 'tag' | 'status' | 'size' | 'updated';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

type InstalledSortField = 'tag' | 'size' | 'created';

interface InstalledSortState {
  field: InstalledSortField;
  direction: SortDirection;
}

interface DockerImageSelectorProps {
  onSelect: (image: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DockerImageSelector({
  onSelect,
  open,
  onOpenChange,
}: DockerImageSelectorProps) {
  const { releaseOptions, installedImages, isLoading: isLoadingComfyUIReleases } = useComfyUIReleases(open);
  // Parse tags once
  const parsedImages: DockerImage[] = useMemo(() => {
    const filteredTags = releaseOptions.filter((tag) => tag.tagName !== "latest");
    const images = filteredTags.map((tag) => {
      const [comfyUIVersion, pythonVersion, cudaVersion, pytorchVersion] =
        tag.tagName.split("-");
      return {
        tag: tag.tagName,
        fullImageName: tag.fullImageName,
        size: tag.size,
        lastUpdated: tag.lastUpdated,
        digest: tag.digest,
        comfyUIVersion: comfyUIVersion || "",
        pythonVersion: pythonVersion?.replace("py", "") || "",
        cudaVersion: cudaVersion?.replace("cuda", "") || "",
        pytorchVersion: pytorchVersion?.replace("pt", "") || "",
      };
    });
    
    // Sort by comfyui > python > cuda > pytorch stable > pytorch nightly
    return images.sort((a, b) => {
      // First by comfyUIVersion (descending)
      if (a.comfyUIVersion !== b.comfyUIVersion) {
        return b.comfyUIVersion.localeCompare(a.comfyUIVersion, undefined, { numeric: true });
      }
      
      // Then by pythonVersion (descending)
      if (a.pythonVersion !== b.pythonVersion) {
        return b.pythonVersion.localeCompare(a.pythonVersion, undefined, { numeric: true });
      }
      
      // Then by cudaVersion (descending)
      if (a.cudaVersion !== b.cudaVersion) {
        return b.cudaVersion.localeCompare(a.cudaVersion, undefined, { numeric: true });
      }
      
      // Then prioritize stable pytorch over nightly
      const aIsNightly = a.pytorchVersion?.includes("nightly") || false;
      const bIsNightly = b.pytorchVersion?.includes("nightly") || false;
      
      if (aIsNightly !== bIsNightly) {
        return aIsNightly ? 1 : -1; // Stable comes first
      }
      
      // Finally by pytorchVersion (descending)
      return (b.pytorchVersion || "").localeCompare(a.pytorchVersion || "", undefined, { numeric: true });
    });
  }, [releaseOptions]);

  // Extract unique versions for filtering
  const comfyUIVersions = useMemo(
    () =>
      Array.from(new Set(parsedImages.map((img) => img.comfyUIVersion)))
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true })),
    [parsedImages]
  );
  const pythonVersions = useMemo(
    () =>
      Array.from(new Set(parsedImages.map((img) => img.pythonVersion)))
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true })),
    [parsedImages]
  );
  const cudaVersions = useMemo(
    () =>
      Array.from(new Set(parsedImages.map((img) => img.cudaVersion)))
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true })),
    [parsedImages]
  );

  // Filter states
  const [selectedComfyUI, setSelectedComfyUI] = useState<string>("all");
  const [selectedPython, setSelectedPython] = useState<string>("all");
  const [selectedCuda, setSelectedCuda] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [customImage, setCustomImage] = useState<string>("");
  
  // Sorting states
  const [sortState, setSortState] = useState<SortState>({ field: 'updated', direction: 'desc' });
  const [installedSortState, setInstalledSortState] = useState<InstalledSortState>({ field: 'created', direction: 'desc' });
  
  const loading = parsedImages.length === 0;

  // Create a Set of installed image digests for O(1) lookup
  const installedDigests = useMemo(() => {
    const digestSet = new Set<string>();
    installedImages.forEach(img => {
      if (img.digest) {
        digestSet.add(img.digest);
      }
    });
    return digestSet;
  }, [installedImages]);

  // Function to check if an image is installed
  const isImageInstalled = useCallback((digest: string) => {
    return digest && installedDigests.has(digest);
  }, [installedDigests]);

  // Sorting functions
  const handleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleInstalledSort = (field: InstalledSortField) => {
    setInstalledSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortState.field !== field) return null;
    return sortState.direction === 'asc' ? <ChevronUp className="h-5 w-5 text-blue-500" /> : <ChevronDown className="h-5 w-5 text-blue-500" />;
  };

  const getInstalledSortIcon = (field: InstalledSortField) => {
    if (installedSortState.field !== field) return null;
    return installedSortState.direction === 'asc' ? <ChevronUp className="h-5 w-5 text-blue-500" /> : <ChevronDown className="h-5 w-5 text-blue-500" />;
  };

  // Filter and sort logic
  const filteredImages = useMemo(() => {
    const filtered = parsedImages.filter((img) => {
      const comfyMatch =
        selectedComfyUI === "all" || img.comfyUIVersion === selectedComfyUI;
      const pythonMatch =
        selectedPython === "all" || img.pythonVersion === selectedPython;
      const cudaMatch =
        selectedCuda === "all" || img.cudaVersion === selectedCuda;
      const searchMatch =
        !searchTerm || img.tag.toLowerCase().includes(searchTerm.toLowerCase());
      return comfyMatch && pythonMatch && cudaMatch && searchMatch;
    });

    return filtered.sort((a, b) => {
      // First prioritize installed images
      const aInstalled = isImageInstalled(a.digest);
      const bInstalled = isImageInstalled(b.digest);
      
      if (aInstalled !== bInstalled) {
        return aInstalled ? -1 : 1; // Installed images come first
      }
      
      // Then sort based on selected sort field
      let compareResult = 0;
      
      switch (sortState.field) {
        case 'tag':
          compareResult = a.fullImageName.localeCompare(b.fullImageName);
          break;
        case 'status':
          // Installed vs not installed (already handled above)
          compareResult = 0;
          break;
        case 'size':
          compareResult = a.size - b.size;
          break;
        case 'updated':
          compareResult = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
          break;
        default:
          compareResult = 0;
      }
      
      // Apply sort direction
      const result = sortState.direction === 'asc' ? compareResult : -compareResult;
      
      // If the primary sort is equal, fall back to the original complex sorting for installed images
      if (result === 0 && (aInstalled && bInstalled)) {
        // Original complex sorting logic for installed images
        if (a.comfyUIVersion !== b.comfyUIVersion) {
          return b.comfyUIVersion.localeCompare(a.comfyUIVersion, undefined, { numeric: true });
        }
        
        if (a.pythonVersion !== b.pythonVersion) {
          return b.pythonVersion.localeCompare(a.pythonVersion, undefined, { numeric: true });
        }
        
        if (a.cudaVersion !== b.cudaVersion) {
          return b.cudaVersion.localeCompare(a.cudaVersion, undefined, { numeric: true });
        }
        
        const aIsNightly = a.pytorchVersion?.includes("nightly") || false;
        const bIsNightly = b.pytorchVersion?.includes("nightly") || false;
        
        if (aIsNightly !== bIsNightly) {
          return aIsNightly ? 1 : -1;
        }
        
        return (b.pytorchVersion || "").localeCompare(a.pytorchVersion || "", undefined, { numeric: true });
      }
      
      return result;
    });
  }, [parsedImages, selectedComfyUI, selectedPython, selectedCuda, searchTerm, isImageInstalled, sortState]);

  // Sorted installed images
  const sortedInstalledImages = useMemo(() => {
    return [...installedImages].sort((a, b) => {
      let compareResult = 0;
      
      switch (installedSortState.field) {
        case 'tag':
          compareResult = a.tag.localeCompare(b.tag);
          break;
        case 'size':
          compareResult = a.size - b.size;
          break;
        case 'created':
          compareResult = new Date(a.created).getTime() - new Date(b.created).getTime();
          break;
        default:
          compareResult = 0;
      }
      
      return installedSortState.direction === 'asc' ? compareResult : -compareResult;
    });
  }, [installedImages, installedSortState]);

  const handleSelectImage = (image: string) => {
    console.log("handleSelectImage", image);
    onSelect(image);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 
        Keep the dialog height fixed so the tab contents can't expand beyond 
        the boundary, and we can scroll inside.
      */}
      <DialogContent
        className="max-w-3xl h-[600px] flex flex-col overflow-hidden"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle>Select Docker Image</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="browse"
          className="w-full flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent
            value="browse"
            className="
              data-[state=active]:flex
              data-[state=inactive]:hidden
              flex-1
              flex-col
              overflow-hidden
              space-y-4
              pt-4
            "
          >
            {/* Filter controls */}
            <div className="flex space-x-4 px-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">ComfyUI Version</label>
                <Select
                  value={selectedComfyUI}
                  onValueChange={setSelectedComfyUI}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="ComfyUI Version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {comfyUIVersions.map((version) => (
                      <SelectItem key={version} value={version}>
                        {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Python Version</label>
                <Select
                  value={selectedPython}
                  onValueChange={setSelectedPython}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Python Version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {pythonVersions.map((version) => (
                      <SelectItem key={version} value={version}>
                        {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">CUDA Version</label>
                <Select value={selectedCuda} onValueChange={setSelectedCuda}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="CUDA Version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {cudaVersions.map((version) => (
                      <SelectItem key={version} value={version}>
                        {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="px-4">
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Scrollable list area with columns */}
            <div className="flex-1 overflow-hidden px-4 pb-[45px]">
              {/* Header row */}
              <div className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-2 border-b pb-2 mb-2 font-semibold px-6">
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                  onClick={() => handleSort('tag')}
                >
                  Tag {getSortIcon('tag')}
                </div>
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </div>
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                  onClick={() => handleSort('size')}
                >
                  Size {getSortIcon('size')}
                </div>
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                  onClick={() => handleSort('updated')}
                >
                  Updated {getSortIcon('updated')}
                </div>
              </div>
              <ScrollArea className="h-full w-full rounded-md border">
                {isLoadingComfyUIReleases ? (
                  <div className="absolute inset-0 flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="p-4">
                    {filteredImages.map((img) => (
                      <div
                        key={img.tag}
                        className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-2 p-2 items-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                        onClick={() =>
                          handleSelectImage(img.fullImageName)
                        }
                      >
                        {/* First (largest) column: Tag */}
                        <div>
                          {img.fullImageName}
                        </div>
                        {/* Second column: Status */}
                        <div>
                          {isImageInstalled(img.digest) ? (
                            <Badge variant="outline" className="bg-green-500 text-white">
                              Installed
                            </Badge>
                          ) : null}
                        </div>
                        {/* Third column: Size placeholder */}
                        <div>{(img.size / (1024 * 1024 * 1024)).toFixed(2)} GB</div>
                        {/* Fourth column: Date created placeholder */}
                        <div>{new Date(img.lastUpdated).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent
            value="installed"
            className="
              data-[state=active]:flex
              data-[state=inactive]:hidden
              flex-1
              flex-col
              overflow-hidden
              pt-4
              px-4
            "
          >
            {/* Scrollable list area with columns */}
            <div className="flex-1 overflow-hidden px-4 pb-[45px]">
              {/* Header row */}
              <div className="grid grid-cols-[3fr_1fr_1fr] gap-2 border-b pb-2 mb-2 font-semibold px-6">
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                  onClick={() => handleInstalledSort('tag')}
                >
                  Tag {getInstalledSortIcon('tag')}
                </div>
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                  onClick={() => handleInstalledSort('size')}
                >
                  Size {getInstalledSortIcon('size')}
                </div>
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                  onClick={() => handleInstalledSort('created')}
                >
                  Created {getInstalledSortIcon('created')}
                </div>
              </div>
              <ScrollArea className="h-full w-full rounded-md border">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="p-4">
                    {sortedInstalledImages.map((img) => (
                      <div
                        key={img.id + img.tag}
                        className="grid grid-cols-[3fr_1fr_1fr] gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                        onClick={() => handleSelectImage(img.tag)}
                      >
                        {/* First (largest) column: Tag */}
                        <div>{img.tag}</div>
                        {/* Third column: Size placeholder */}
                        <div>{(img.size / (1024 * 1024 * 1024)).toFixed(2)} GB</div>
                        {/* Fourth column: Date created placeholder */}
                        <div>{new Date(img.created).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
          <TabsContent
            value="custom"
            className="
              data-[state=active]:flex
              data-[state=inactive]:hidden
              flex-1
              flex-col
              overflow-hidden
              pt-4
              px-4
              space-y-4
            "
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Custom DockerHub image URL"
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                />
              </div>
              <Button onClick={() => handleSelectImage(customImage)}>
                Accept
              </Button>
            </div>
            {/* Title over list of "previously used custom images" */}
            {/* <div className="text-lg font-semibold px-4">Previously used custom images</div> */}
            {/* <ScrollArea className="h-full w-full rounded-md border">
              <div className="p-4">
                {installedImages.map((img) => (
                  <div
                    key={img.id}
                    className="p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleSelectImage(img.id)}
                  >
                    {img.tag}
                  </div>
                ))}
              </div>
            </ScrollArea> */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
