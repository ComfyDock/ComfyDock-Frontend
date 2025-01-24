import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import {
  FormField,
  FormControl,
  FormItem,
} from "@/components/ui/form";
import { CONTAINER_COMFYUI_PATH } from "../utils/MountConfigUtils";

interface MountConfigRowProps {
  index: number;
  remove: (index: number) => void;
  control: any;
  onActionChange: () => void;
}

const MountConfigRow = ({ index, remove, control, onActionChange }: MountConfigRowProps) => (
  <div className="flex items-center space-x-2 mb-2">
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
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                onActionChange();
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select Path" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={`${CONTAINER_COMFYUI_PATH}/models`}>Models</SelectItem>
                <SelectItem value={`${CONTAINER_COMFYUI_PATH}/output`}>Output</SelectItem>
                <SelectItem value={`${CONTAINER_COMFYUI_PATH}/input`}>Input</SelectItem>
                <SelectItem value={`${CONTAINER_COMFYUI_PATH}/user`}>User</SelectItem>
                <SelectItem value={`${CONTAINER_COMFYUI_PATH}/custom_nodes`}>Custom Nodes</SelectItem>
              </SelectContent>
            </Select>
            {/* <FormControl>
              <Input
                {...field}
                placeholder="Container Path"
                onChange={(e) => {
                  field.onChange(e);
                  onActionChange();
                }}
              />
            </FormControl> */}
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

export default MountConfigRow;
