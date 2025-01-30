import { useForm, FormProvider, useFieldArray, useWatch, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { baseFormSchema, EnvironmentFormValues, EnvironmentType, MountConfigFormValues } from "@/types/Environment";
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
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";
import { getDefaultMountConfigsForEnvType } from "../utils/MountConfigUtils";
import { joinPaths } from "../utils/PathUtils";
import { CombinedEnvironmentType } from '@/types/Environment'  


interface EnvironmentFormProps {
  form: UseFormReturn<EnvironmentFormValues>;
  environmentTypeOptions: Record<string, string>;
  environmentTypeDescriptions: typeof EnvironmentTypeDescriptions;
  onSubmit: (values: EnvironmentFormValues) => Promise<void>;
  handleEnvironmentTypeChange: (newType: CombinedEnvironmentType) => void;
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
  // Form Fields
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "mountConfig",
  });

  const handleMountConfigChange = () => {
    form.setValue("environmentType", EnvironmentTypeEnum.Custom);
  };

  const comfyUIPath = useWatch({
    control: form.control,
    name: "comfyUIPath",
  })

  // Effects
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const currentEnvType = form.getValues("environmentType");
      
      if (currentEnvType === EnvironmentTypeEnum.Custom) {
        // For custom environments, update non-overridden paths
        const updatedMountConfig = form.getValues("mountConfig").map((config: MountConfigFormValues) => {
          if (!config.override) {
            const containerDir = config.container_path.split('/').pop() || '';
            return {
              ...config,
              host_path: joinPaths(comfyUIPath, containerDir)
            };
          }
          return config;
        });
        form.setValue("mountConfig", updatedMountConfig);
      } else {
        // For preset environment types, regenerate the default config
        const newMountConfig = getDefaultMountConfigsForEnvType(currentEnvType as EnvironmentTypeEnum, comfyUIPath);
        form.setValue("mountConfig", newMountConfig as MountConfigFormValues[]);
      }
    }, 300); // 300ms debounce
  
    return () => clearTimeout(debounceTimer);
  }, [comfyUIPath, form, form.getValues("environmentType")]);

  // Helper functions
  // const handleEnvironmentTypeChange = (value: EnvironmentTypeEnum) => {
  //   form.setValue("environmentType", value)

  //   // Grab the comfyUI path from the form
  //   const comfyUIPath = form.getValues("comfyUIPath")

  //   // Generate the mount config array
  //   const mountConfigs = getDefaultMountConfigsForEnvType(value, comfyUIPath)

  //   // Update the form state
  //   form.setValue("mountConfig", mountConfigs as MountConfigFormValues[])
  // };
  // const handleEnvironmentTypeChange = (newType: CombinedEnvironmentType) => {
  //   form.setValue("environmentType", newType)
  //   const comfyUIPath = form.getValues("comfyUIPath")

  //   if (newType === CombinedEnvironmentTypeEnum.Auto) {
  //     const autoFilteredMounts = existingMounts.filter((m) => m.type === "mount")
  //     form.setValue("mountConfig", autoFilteredMounts)
  //     return
  //   }

  //   if (newType === EnvironmentTypeEnum.Custom) {
  //     form.setValue("mountConfig", existingMounts)
  //     return
  //   }

  //   const standardConfig = getDefaultMountConfigsForEnvType(newType, comfyUIPath)
  //   form.setValue("mountConfig", standardConfig)
  // }

  // const handleMountConfigChange = () => {
  //   form.setValue("environmentType", EnvironmentTypeEnum.Custom)
  // }

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
            name="comfyUIPath"
            label="Path to ComfyUI"
            placeholder="/path/to/ComfyUI"
          />

          {/* Environment Type Selector */}
          <FormField
            control={form.control}
            name="environmentType"
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
                        <SelectItem key={value} value={label}>
                          <div className="flex flex-col">
                            <span className="font-medium">{label}</span>
                            <span className="text-xs text-muted-foreground">
                              {
                                environmentTypeDescriptions[
                                  label as EnvironmentType
                                ]
                              }
                            </span>
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage className="col-start-2 col-span-3" />
              </FormItem>
            )}
          />

          {/* Advanced Options */}
          <Accordion type="single" collapsible className="w-full px-1">
            <AccordionItem value="advanced-options">
              <AccordionTrigger className="text-md font-semibold py-2 px-2">
                Advanced Options
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 px-4">
                  <FormField
                    control={form.control}
                    name="runtime"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Runtime</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl className="col-span-3">
                            <SelectTrigger>
                              <SelectValue placeholder="Select runtime" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nvidia">Nvidia</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="col-start-2 col-span-3" />
                      </FormItem>
                    )}
                  />
                  <FormFieldComponent
                    name="command"
                    label="Command"
                    placeholder="Additional command"
                  />
                  <FormFieldComponent
                    name="port"
                    label="Port"
                    placeholder="Port number"
                    type="number"
                  />
                  <div>
                    <FormLabel>Mount Config</FormLabel>
                    <div className="space-y-2 pt-2 rounded-lg">
                      {/* Header Row for Column Titles */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-40">Override</div>
                        <div className="w-full">Host Path</div>
                        <div className="w-full">Container Path</div>
                        <div className="w-full">Action</div>
                      </div>
                      {fields.map((field, index) => (
                        <MountConfigRow
                          key={field.id}
                          index={index}
                          remove={remove}
                          onActionChange={handleMountConfigChange}
                        />
                      ))}
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

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            {/* <Button variant="outline" onClick={onCancel} type="button">
              Cancel
            </Button> */}
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
