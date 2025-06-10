import React from "react";
import {
  FormProvider,
  useFieldArray,
  useWatch,
  UseFormReturn,
} from "react-hook-form";
import { EnvironmentFormValues, Mount } from "@/types/Environment";
import {
  EnvironmentTypeDescriptions,
  EnvironmentTypeEnum,
  MountActionEnum,
} from "@/types/Environment";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FormFieldComponent from "@/components/form/FormFieldComponent";
import MountConfigRow from "@/components/form/MountConfigRow";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect } from "react";
import { getDefaultMountConfigsForEnvType } from "@/components/utils/MountConfigUtils";
import { joinPaths } from "@/components/utils/PathUtils";
import StyledSelectItem from "@/components/atoms/StyledSelectItem";

interface EnvironmentFormProps {
  form: UseFormReturn<EnvironmentFormValues>;
  environmentTypeOptions: Record<string, string>;
  environmentTypeDescriptions: typeof EnvironmentTypeDescriptions;
  onSubmit: (values: EnvironmentFormValues) => Promise<void>;
  handleEnvironmentTypeChange: (newType: EnvironmentTypeEnum) => void;
  isLoading: boolean;
  submitButtonText?: string;
  children?: React.ReactNode;
}

export function EnvironmentForm({
  form,
  environmentTypeOptions,
  environmentTypeDescriptions,
  onSubmit,
  handleEnvironmentTypeChange,
  isLoading,
  submitButtonText = "Create",
  children,
}: EnvironmentFormProps) {
  // Mount Config Form Fields
  const { fields: mountFields, append, remove } = useFieldArray({
    control: form.control,
    name: "mount_config.mounts",
  });

  const handleMountConfigChange = () => {
    console.log("handleMountConfigChange");
    form.setValue("environment_type", EnvironmentTypeEnum.Custom);
  };

  const comfyUIPath = useWatch({
    control: form.control,
    name: "comfyui_path",
  });

  // Effects
  useEffect(() => {
    console.log("useEffect in EnvironmentForm");
    const debounceTimer = setTimeout(() => {
      const currentEnvType = form.getValues("environment_type");

      if (currentEnvType === EnvironmentTypeEnum.Custom) {
        // For custom environments, update non-overridden paths
        const updatedMountConfig = form?.getValues("mount_config.mounts")?.map((config: Mount) => {
            if (!config.override) {
              const containerDir = config.container_path.split("/").pop() || "";
              return {
                ...config,
                host_path: joinPaths(comfyUIPath, containerDir),
              };
            }
            return config;
          });
        console.log(
          `updatedMountConfig: ${JSON.stringify(updatedMountConfig)}`
        );
        form.setValue("mount_config.mounts", updatedMountConfig || []);
      } else {
        // For preset environment types, regenerate the default config
        const newMountConfig = getDefaultMountConfigsForEnvType(
          currentEnvType as EnvironmentTypeEnum,
          comfyUIPath
        );
        if (newMountConfig) {
          form.setValue("mount_config.mounts", newMountConfig as Mount[]);
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [comfyUIPath, form]);

  return (
    <FormProvider {...form}>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            {isLoading ? "Processing..." : "Loading..."}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* <h2 className="text-lg font-semibold">{title}</h2> */}

          {/* Common Form Fields */}
          <FormFieldComponent name="name" label="Name" placeholder="" />

          {/* Custom Children */}
          {children}

          <FormFieldComponent
            name="comfyui_path"
            label="Path to ComfyUI"
            placeholder="/path/to/ComfyUI"
          />

          {/* Environment Type Selector */}
          <FormField
            control={form.control}
            name="environment_type"
            render={({ field }) => (
              <FormItem className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">Environment Type</FormLabel>
                <Select
                  onValueChange={handleEnvironmentTypeChange}
                  value={field.value}
                >
                  <FormControl className="col-span-3">
                    <SelectTrigger>
                      <SelectValue>{field.value}</SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(environmentTypeOptions).map(
                      ([value, label]) => (
                        <StyledSelectItem key={value} value={label}>
                          <div className="flex flex-col">
                            <span className="font-medium">{label}</span>
                            <span className="text-xs text-muted-foreground">
                              {
                                environmentTypeDescriptions[
                                  label as EnvironmentTypeEnum
                                ]
                              }
                            </span>
                          </div>
                        </StyledSelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage className="col-start-2 col-span-3" />
              </FormItem>
            )}
          />

          {/* Mount Config */}
          <Accordion type="single" collapsible className="w-full px-1">
            <AccordionItem value="mount-config" className="overflow-hidden">
              <AccordionTrigger className="text-md font-semibold py-2 px-2">
                Mount Config
              </AccordionTrigger>
              <AccordionContent className="overflow-visible">
                <div className="space-y-4 px-4 transition-all duration-300 ease-in-out">
                  <div className="min-h-[50px]">
                    {/* <FormLabel>Mount Config</FormLabel> */}
                    <div className="space-y-2 pt-2 rounded-lg">
                      {/* Header Row for Column Titles */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-40">Override</div>
                        <div className="w-full">Host Path</div>
                        <div className="w-full">Container Path</div>
                        <div className="w-full">Action</div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto pr-2">
                        {mountFields.map((field, index) => (
                          <MountConfigRow
                            key={field.id}
                            index={index}
                            remove={remove}
                            onActionChange={handleMountConfigChange}
                          />
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          append({
                            type: MountActionEnum.Mount,
                            container_path: "",
                            host_path: "",
                            read_only: false,
                            override: false,
                          });
                          handleMountConfigChange();
                        }}
                      >
                        Add Directory
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Advanced Options */}
          <Accordion type="single" collapsible className="w-full px-1">
            <AccordionItem value="advanced-options">
              <AccordionTrigger className="text-md font-semibold py-2 px-2">
                Advanced Options
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 px-4">
                  <FormFieldComponent
                    name="runtime"
                    label="Runtime"
                    placeholder="Select runtime"
                    type="select"
                    options={[
                      { value: "nvidia", label: "Nvidia" },
                      { value: "none", label: "None" }
                    ]}
                    defaultValue="nvidia"
                    tooltip="Select the runtime for the container"
                    className="col-span-3"
                  />
                  <FormFieldComponent
                    name="port"
                    label="Ports"
                    placeholder="8188:8188"
                    tooltip="Override the ports of the container. Format follows standard docker port mapping (e.g. host:container;host:container/protocol)"
                  />
                  <FormFieldComponent
                    name="url"
                    label="Host URL"
                    placeholder="http://localhost:8188"
                    tooltip="Override the host URL for connecting to the container"
                  />
                  <FormFieldComponent
                    name="command"
                    label="Command"
                    placeholder="Optional command"
                    tooltip="Override the command of the container"
                  />
                  <FormFieldComponent
                    name="entrypoint"
                    label="Override Entrypoint"
                    placeholder="/bin/bash"
                    type="text"
                    tooltip="Override the entrypoint of the container"
                  />
                  <FormFieldComponent
                    name="environment_variables"
                    label="Environment Variables"
                    placeholder="VAR1=1, VAR2=2, etc."
                    type="text"
                    tooltip="Override the environment variables of the container"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {submitButtonText}...
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
