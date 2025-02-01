import { useForm, FormProvider, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { baseFormSchema, EnvironmentFormValues, EnvironmentInput, Mount } from "@/types/Environment";
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
import { FormField, FormLabel } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useEffect, useState } from "react";
import { useComfyUIInstall } from "@/hooks/use-comfyui-install";
import { toast } from "@/hooks/use-toast";
import { getComfyUIImageTags } from "@/api/environmentApi";
import { getDefaultMountConfigsForEnvType } from "@/components/utils/MountConfigUtils";
import { joinPaths } from "@/components/utils/PathUtils";
import { SUCCESS_TOAST_DURATION } from "./CreateEnvironmentDialogCopy";


interface EnvironmentDialogProps {
  defaultValues: Partial<EnvironmentFormValues>;
  createEnvironmentHandler: (environment: EnvironmentInput) => Promise<void>;
  onSubmit: (values: EnvironmentFormValues) => Promise<void>;
  title: string;
  submitButtonText?: string;
  children?: React.ReactNode;
}

export function EnvironmentDialog({
  defaultValues,
  createEnvironmentHandler,
  onSubmit,
  title,
  submitButtonText = "Create",
  children,
}: EnvironmentDialogProps) {
  // Dialog state
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [releaseOptions, setReleaseOptions] = useState<string[]>(["latest"])
  const [pendingEnvironment, setPendingEnvironment] = useState<EnvironmentInput | null>(null);

  // Form
  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(baseFormSchema),
    defaultValues,
    mode: "onChange",
  });

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
    if (isDialogOpen) {
      getComfyUIImageTags().then((result) => {
        console.log(result.tags)
        // Convert tags from object to array and add "latest" to the beginning
        const tagsArray = Object.values(result.tags).map(tag => String(tag));
        const filteredTags = tagsArray.filter(tag => tag !== "latest");
        setReleaseOptions(["latest", ...filteredTags]);
        console.log(Object.values(result.tags).map(tag => String(tag)))
      }).catch((error) => {
        console.error(error)
      })
    }
  }, [isDialogOpen])

  useEffect(() => {
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
        form.setValue("mountConfig", updatedMountConfig);
      } else {
        // For preset environment types, regenerate the default config
        const newMountConfig = getDefaultMountConfigsForEnvType(currentEnvType as EnvironmentTypeEnum, comfyUIPath);
        form.setValue("mountConfig", newMountConfig as Mount[]);
      }
    }, 300); // 300ms debounce
  
    return () => clearTimeout(debounceTimer);
  }, [comfyUIPath, form, form.getValues("environmentType")]);

  // Hooks
  const {
    installComfyUIDialog
  } = useComfyUIInstall(form, releaseOptions, toast);

  // Helper functions
  // const finishCreateEnvironment = async (environment: EnvironmentInput | null) => {
  //   if (!environment) return;
  //   // Create environment
  //   await createEnvironmentHandler(environment);
  //   setIsDialogOpen(false);
  //   form.reset();
  //   toast({
  //     title: "Success",
  //     description: "Environment created successfully",
  //     duration: SUCCESS_TOAST_DURATION,
  //   });

  //   // Cleanup after success
  //   setIsLoading(false);
  //   setPendingEnvironment(null);
  // }

  return (
    <>
      
      <Dialog
        open={isDialogOpen}
        onOpenChange={installComfyUIDialog ? undefined : setIsDialogOpen}
      >
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[80vh] min-w-[600px] overflow-y-auto dialog-content">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  {isLoading ? "Processing..." : "Loading..."}
                </div>
              )}

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold">{title}</h2>

                {/* Common Form Fields */}
                <FormFieldComponent name="name" label="Name" placeholder="" />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EnvironmentTypeEnum).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={label}>
                              <div className="flex flex-col">
                                <span className="font-medium">{label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {EnvironmentTypeDescriptions[label as EnvironmentTypeEnum]}
                                </span>
                              </div>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />

                {/* Custom Children */}
                {children}

                {/* Advanced Options */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="advanced-options">
                    <AccordionTrigger>Advanced Options</AccordionTrigger>
                    <AccordionContent className="space-y-4">
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

                      {/* Mount Config */}
                      <div>
                        <FormLabel>Mount Config</FormLabel>
                        <div className="space-y-2 pt-2">
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Submit Button */}
                <div className="flex justify-end">
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
        </DialogContent>
      </Dialog>
    </>
  );
}
