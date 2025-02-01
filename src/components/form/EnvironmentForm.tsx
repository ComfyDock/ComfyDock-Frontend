import { FormProvider, useFieldArray, useWatch, UseFormReturn } from "react-hook-form";
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
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";
import { getDefaultMountConfigsForEnvType } from "@/components/utils/MountConfigUtils";
import { joinPaths } from "@/components/utils/PathUtils";

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
  // Form Fields
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "mountConfig",
  });

  const handleMountConfigChange = () => {
    console.log("handleMountConfigChange")
    form.setValue("environmentType", EnvironmentTypeEnum.Custom);
  };

  const comfyUIPath = useWatch({
    control: form.control,
    name: "comfyUIPath",
  })

  // Effects
  useEffect(() => {
    console.log("useEffect in EnvironmentForm")
    const debounceTimer = setTimeout(() => {
      const currentEnvType = form.getValues("environmentType");
      
      if (currentEnvType === EnvironmentTypeEnum.Custom) {
        // For custom environments, update non-overridden paths
        const updatedMountConfig = form.getValues("mountConfig").map((config: Mount) => {
          if (!config.override) {
            const containerDir = config.container_path.split('/').pop() || '';
            return {
              ...config,
              host_path: joinPaths(comfyUIPath, containerDir)
            };
          }
          return config;
        });
        console.log(`updatedMountConfig: ${JSON.stringify(updatedMountConfig)}`)
        form.setValue("mountConfig", updatedMountConfig);
      } else {
        // For preset environment types, regenerate the default config
        const newMountConfig = getDefaultMountConfigsForEnvType(currentEnvType as EnvironmentTypeEnum, comfyUIPath);
        if (newMountConfig) {
          form.setValue("mountConfig", newMountConfig as Mount[]);
          console.log(`newMountConfig: ${JSON.stringify(newMountConfig)}`)
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
                                  label as EnvironmentTypeEnum
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
