import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
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
import StyledSelectItem from "@/components/atoms/StyledSelectItem";

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
    name: `mount_config.mounts.${index}.override`,
  });
  const containerPath = useWatch({
    control,
    name: `mount_config.mounts.${index}.container_path`,
  });
  const comfyUIPath = useWatch({
    control,
    name: "comfyui_path",
  });

  const handleContainerPathChange = (value: string) => {
    if (value === "custom") {
      // Immediately set to custom path mode
      setIsCustomPath(true);
      // Remember that custom was explicitly selected
      customWasSelected.current = true;
      // Clear the value to avoid saving "custom" as the actual path
      setValue(`mount_config.mounts.${index}.container_path`, "");
      onActionChange();
      return;
    }

    setValue(`mount_config.mounts.${index}.container_path`, value);

    if (!override) {
      const containerDir = value.split("/").pop() || "";
      const newHostPath = joinPaths(comfyUIPath, containerDir);
      setValue(`mount_config.mounts.${index}.host_path`, newHostPath);
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
          name={`mount_config.mounts.${index}.override`}
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
                        const containerPath = control._getWatch(`mount_config.mounts.${index}.container_path`);
                        console.log(containerPath);
                        if (!containerPath) {
                          return;
                        }
                        const containerDir = containerPath.split('/').pop() || '';
                        console.log(containerDir);
                        const newHostPath = joinPaths(comfyUIPath, containerDir);
                        console.log(newHostPath);
                        setValue(`mount_config.mounts.${index}.host_path`, newHostPath);
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
          name={`mount_config.mounts.${index}.host_path`}
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
          name={`mount_config.mounts.${index}.container_path`}
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
                        setValue(`mount_config.mounts.${index}.host_path`, newHostPath);
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
                    <StyledSelectItem value={`${CONTAINER_COMFYUI_PATH}/models`}>
                      Models
                    </StyledSelectItem>
                    <StyledSelectItem value={`${CONTAINER_COMFYUI_PATH}/output`}>
                      Output
                    </StyledSelectItem>
                    <StyledSelectItem value={`${CONTAINER_COMFYUI_PATH}/input`}>
                      Input
                    </StyledSelectItem>
                    <StyledSelectItem value={`${CONTAINER_COMFYUI_PATH}/user`}>
                      User
                    </StyledSelectItem>
                    <StyledSelectItem value={`${CONTAINER_COMFYUI_PATH}/custom_nodes`}>
                      Custom Nodes
                    </StyledSelectItem>
                    <StyledSelectItem value="custom">
                      Custom...
                    </StyledSelectItem>
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
          name={`mount_config.mounts.${index}.type`}
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
                  <StyledSelectItem value="mount">Mount</StyledSelectItem>
                  <StyledSelectItem value="copy">Copy</StyledSelectItem>
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
