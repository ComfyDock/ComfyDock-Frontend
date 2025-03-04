import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { FormField, FormControl, FormItem } from "@/components/ui/form";
import { CONTAINER_COMFYUI_PATH } from "@/components/utils/MountConfigUtils";
import { useFormContext, useWatch } from "react-hook-form";
import { joinPaths } from "@/components/utils/PathUtils";
import { useState, useEffect, useRef } from "react";

interface MountConfigRowProps {
  index: number;
  remove: (index: number) => void;
  onActionChange: () => void;
}

const MountConfigRow = ({
  index,
  remove,
  onActionChange,
}: MountConfigRowProps) => {
  const { control, setValue } = useFormContext();
  const [isCustomPath, setIsCustomPath] = useState(false);
  const customWasSelected = useRef(false);
  const override = useWatch({
    control,
    name: `mountConfig.${index}.override`,
  });
  const containerPath = useWatch({
    control,
    name: `mountConfig.${index}.container_path`,
  });
  const comfyUIPath = useWatch({
    control,
    name: "comfyUIPath",
  });

  const handleContainerPathChange = (value: string) => {
    if (value === "custom") {
      // Immediately set to custom path mode
      setIsCustomPath(true);
      // Remember that custom was explicitly selected
      customWasSelected.current = true;
      // Clear the value to avoid saving "custom" as the actual path
      setValue(`mountConfig.${index}.container_path`, "");
      onActionChange();
      return;
    }

    setValue(`mountConfig.${index}.container_path`, value);

    if (!override) {
      const containerDir = value.split("/").pop() || "";
      const newHostPath = joinPaths(comfyUIPath, containerDir);
      setValue(`mountConfig.${index}.host_path`, newHostPath);
    }
    onActionChange();
  };

  // Only set isCustomPath based on path if custom wasn't explicitly selected
  useEffect(() => {
    // If custom was explicitly selected, don't change the state back
    if (customWasSelected.current) {
      return;
    }
    
    const predefinedPaths = [
      `${CONTAINER_COMFYUI_PATH}/models`,
      `${CONTAINER_COMFYUI_PATH}/output`,
      `${CONTAINER_COMFYUI_PATH}/input`,
      `${CONTAINER_COMFYUI_PATH}/user`,
      `${CONTAINER_COMFYUI_PATH}/custom_nodes`,
    ];
    setIsCustomPath(containerPath !== "" && !predefinedPaths.includes(containerPath));
  }, [containerPath]);

  return (
    <div className="flex items-center space-x-2 mb-2">
      <div className="w-40">
        <FormField
          control={control}
          name={`mountConfig.${index}.override`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      // When disabling override, reset host path
                      if (!checked) {
                        const containerPath = control._getWatch(`mountConfig.${index}.container_path`);
                        console.log(containerPath);
                        if (!containerPath) {
                          return;
                        }
                        const containerDir = containerPath.split('/').pop() || '';
                        console.log(containerDir);
                        const newHostPath = joinPaths(comfyUIPath, containerDir);
                        console.log(newHostPath);
                        setValue(`mountConfig.${index}.host_path`, newHostPath);
                      }
                      onActionChange();
                    }}
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className="w-full">
        <FormField
          control={control}
          name={`mountConfig.${index}.host_path`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Host Path"
                  disabled={!override}
                  onChange={(e) => {
                    field.onChange(e);
                    onActionChange();
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className="min-w-[120px]">
        <FormField
          control={control}
          name={`mountConfig.${index}.container_path`}
          render={({ field }) => (
            <FormItem>
              {isCustomPath ? (
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Container Path"
                    onChange={(e) => {
                      field.onChange(e);
                      onActionChange();
                      
                      // Update host path if override is disabled
                      if (!override) {
                        const containerDir = e.target.value.split('/').pop() || '';
                        const newHostPath = joinPaths(comfyUIPath, containerDir);
                        setValue(`mountConfig.${index}.host_path`, newHostPath);
                      }
                    }}
                  />
                </FormControl>
              ) : (
                <Select
                  onValueChange={handleContainerPathChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Select Path" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem 
                      value={`${CONTAINER_COMFYUI_PATH}/models`}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Models
                    </SelectItem>
                    <SelectItem 
                      value={`${CONTAINER_COMFYUI_PATH}/output`}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Output
                    </SelectItem>
                    <SelectItem 
                      value={`${CONTAINER_COMFYUI_PATH}/input`}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Input
                    </SelectItem>
                    <SelectItem 
                      value={`${CONTAINER_COMFYUI_PATH}/user`}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      User
                    </SelectItem>
                    <SelectItem 
                      value={`${CONTAINER_COMFYUI_PATH}/custom_nodes`}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Custom Nodes
                    </SelectItem>
                    <SelectItem 
                      value="custom"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Custom...
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormItem>
          )}
        />
      </div>
      <div className="min-w-[85px]">
        <FormField
          control={control}
          name={`mountConfig.${index}.type`}
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  onActionChange();
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="mount">Mount</SelectItem>
                  <SelectItem value="copy">Copy</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          remove(index);
          onActionChange();
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MountConfigRow;
