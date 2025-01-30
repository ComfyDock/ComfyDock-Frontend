import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Environment,
  EnvironmentInput,
  MountConfig,
} from "@/types/Environment";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, X } from "lucide-react";
import FormFieldComponent from "../form/FormFieldComponent";
import MountConfigRow from "../form/MountConfigRow";
import {
  getDefaultMountConfigsForEnvType,
  parseExistingMountConfig,
} from "@/components/utils/MountConfigUtils";
import { MountActionEnum, EnvironmentTypeEnum, EnvironmentTypeDescriptions, CombinedEnvironmentTypeEnum, CombinedEnvironmentType } from "@/types/Environment";

import { FormProvider } from "react-hook-form";

const defaultComfyUIPath = import.meta.env.VITE_DEFAULT_COMFYUI_PATH;
const SUCCESS_TOAST_DURATION = 2000;

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Environment name is required" })
    .max(128, { message: "Environment name must be less than 128 characters" }),
  release: z.string().optional(),
  image: z.string().optional(),
  comfyUIPath: z.string().min(1, { message: "ComfyUI path is required" }),
  command: z.string().optional(),
  port: z.string().optional(),
  runtime: z.enum(["nvidia", "none"]),
  environmentType: z.nativeEnum(CombinedEnvironmentTypeEnum),
  mountConfig: z.array(
    z.object({
      container_path: z.string(),
      host_path: z.string(),
      type: z.nativeEnum(MountActionEnum),
      read_only: z.boolean().default(false),
      override: z.boolean().default(false),
    })
  ),
});

export interface DuplicateEnvironmentDialogProps {
  environment: Environment;
  environments: Environment[];
  duplicateEnvironmentHandler: (
    id: string,
    environment: EnvironmentInput
  ) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DuplicateEnvironmentDialog({
  environment,
  environments,
  duplicateEnvironmentHandler,
  open,
  onOpenChange,
}: DuplicateEnvironmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const existingMounts = parseExistingMountConfig(
    environment.options?.["mount_config"],
    environment.comfyui_path || ""
  );

  const defaultValues = {
    name: environment.name + "-copy",
    release: (environment.options?.["comfyui_release"] as string) || "latest",
    image: "",
    comfyUIPath: environment.comfyui_path || defaultComfyUIPath || "",
    command: environment.command || "",
    port: (environment.options?.["port"] as string) || "8188",
    runtime:
      (environment.options?.["runtime"] as "nvidia" | "none") || "nvidia",
    environmentType:
      CombinedEnvironmentTypeEnum.Auto as CombinedEnvironmentType,
    mountConfig: existingMounts,
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  const resetForm = () => {
    form.reset(defaultValues);
  };

  useEffect(() => {
    if (open) {
      // When dialog opens, re-parse and filter mounts for Auto type
      const freshMounts = parseExistingMountConfig(
        environment.options?.["mount_config"],
        environment.comfyui_path || ""
      );
      const filteredMounts = freshMounts.filter((m) => m.type === "mount");
      form.reset({
        ...defaultValues,
        mountConfig: filteredMounts,
      });
    }
  }, [open]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "mountConfig",
  });

  const comfyUIPath = useWatch({
    control: form.control,
    name: "comfyUIPath",
  });

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const currentEnvType = form.getValues("environmentType");

      if (currentEnvType === CombinedEnvironmentTypeEnum.Auto) {
        return; // Don't modify mounts for Auto type
      }

      if (currentEnvType === EnvironmentTypeEnum.Custom) {
        // For custom environments, update non-overridden paths
        const updatedMountConfig = form
          .getValues("mountConfig")
          .map((config) => {
            if (!config.override) {
              const containerDir = config.container_path.split("/").pop() || "";
              return {
                ...config,
                host_path: joinPaths(comfyUIPath, containerDir),
              };
            }
            return config;
          });
        form.setValue("mountConfig", updatedMountConfig);
      } else {
        // For preset environment types, regenerate the default config
        const newMountConfig = getDefaultMountConfigsForEnvType(
          currentEnvType as EnvironmentTypeEnum,
          comfyUIPath
        );
        form.setValue("mountConfig", newMountConfig);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [comfyUIPath, form, form.getValues("environmentType")]);

  const handleMountConfigChange = () => {
    form.setValue("environmentType", EnvironmentTypeEnum.Custom);
  };

  const handleEnvironmentTypeChange = (newType: CombinedEnvironmentType) => {
    form.setValue("environmentType", newType);
    const comfyUIPath = form.getValues("comfyUIPath");

    if (newType === CombinedEnvironmentTypeEnum.Auto) {
      const autoFilteredMounts = existingMounts.filter(
        (m) => m.type === "mount"
      );
      form.setValue("mountConfig", autoFilteredMounts);
      return;
    }

    if (newType === EnvironmentTypeEnum.Custom) {
      form.setValue("mountConfig", existingMounts);
      return;
    }

    const standardConfig = getDefaultMountConfigsForEnvType(
      newType,
      comfyUIPath
    );
    form.setValue("mountConfig", standardConfig);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const newEnvironment: EnvironmentInput = {
      name: values.name,
      image: "",
      command: values.command,
      comfyui_path: values.comfyUIPath,
      options: {
        comfyui_release: values.release,
        port: values.port,
        mount_config: { mounts: values.mountConfig },
        runtime: values.runtime,
      },
    };

    try {
      setIsLoading(true);
      await duplicateEnvironmentHandler(environment.id || "", newEnvironment);
      setIsLoading(false);
      onOpenChange(false);
      resetForm();
      toast({
        title: "Success",
        description: "Environment created successfully",
        duration: SUCCESS_TOAST_DURATION,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent className="max-h-[80vh] min-w-[600px] overflow-y-auto dialog-content">
        <DialogHeader>
          <DialogTitle>Duplicate Environment</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />{" "}
                Creating...
              </div>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormFieldComponent
                control={form.control}
                name="name"
                label="Name"
                placeholder=""
              />
              <FormFieldComponent
                control={form.control}
                name="comfyUIPath"
                label="Path to ComfyUI"
                placeholder="/path/to/ComfyUI"
                onChange={(value: string) => {
                  form.setValue("comfyUIPath", value);
                }}
              />
              <FormField
                control={form.control}
                name="environmentType"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">
                      Environment Type
                    </FormLabel>
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
                        {Object.entries(CombinedEnvironmentTypeEnum).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={label}>
                              <div className="flex flex-col">
                                <span className="font-medium">{label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {
                                    EnvironmentTypeDescriptions[
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
                            <FormLabel className="text-right">
                              Runtime
                            </FormLabel>
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
                        control={form.control}
                        name="command"
                        label="Command"
                        placeholder="Additional command"
                      />
                      <FormFieldComponent
                        control={form.control}
                        name="port"
                        label="Port"
                        placeholder="Port number"
                        type="number"
                      />
                      <div>
                        <FormLabel>Mount Config</FormLabel>
                        <div className="space-y-2 pt-2 rounded-lg">
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
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
