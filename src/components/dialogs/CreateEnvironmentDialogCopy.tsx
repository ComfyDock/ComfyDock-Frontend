import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Environment, EnvironmentInput } from '@/types/Environment'
import { Switch } from '@/components/ui/switch'
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2, X } from 'lucide-react'
import { checkImageExists, checkValidComfyUIPath, getComfyUIImageTags, pullImageStream, tryInstallComfyUI } from '@/api/environmentApi'
import { CustomAlertDialog } from './CustomAlertDialog'
import FormFieldComponent from '../form/FormFieldComponent'
import MountConfigRow from '../form/MountConfigRow'
import { UserSettings } from '@/types/UserSettings'
import { Progress } from '../ui/progress'
import ImagePullDialog from './PullImageDialog'
import {
  getDefaultMountConfigsForEnvType,
  MountAction,
  EnvironmentTypeEnum,
  MountActionEnum,
  EnvironmentTypeDescriptions,
  EnvironmentType,
  joinPaths
} from "@/components/utils/MountConfigUtils"
import { useWatch } from 'react-hook-form'
import { FormProvider } from 'react-hook-form';

export const defaultComfyUIPath = import.meta.env.VITE_DEFAULT_COMFYUI_PATH

export const COMFYUI_IMAGE_NAME = "akatzai/comfyui-env"
export const SUCCESS_TOAST_DURATION = 2000

// Get the inverse mapping of dockerImageToReleaseMap
// const comfyUIReleasesFromImageMap = Object.fromEntries(Object.entries(dockerImageToReleaseMap).map(([release, image]) => [image, release]))



export const formSchema = z.object({
  name: z.string().min(1, { message: "Environment name is required" }).max(128, { message: "Environment name must be less than 128 characters" }),
  release: z.string().min(1, { message: "Release is required" }),
  image: z.string().optional(),
  comfyUIPath: z.string().min(1, { message: "ComfyUI path is required" }),
  environmentType: z.nativeEnum(EnvironmentTypeEnum),
  copyCustomNodes: z.boolean().default(false),
  command: z.string().optional(),
  port: z.string().optional(),
  runtime: z.enum(["nvidia", "none"]),
  mountConfig: z.array(z.object({
    container_path: z.string(),
    host_path: z.string(),
    type: z.nativeEnum(MountActionEnum),
    read_only: z.boolean().default(false),
    override: z.boolean().default(false)
  }))
})


export interface CreateEnvironmentDialogProps {
  children: React.ReactNode
  userSettings: UserSettings | null
  environments: Environment[]
  createEnvironmentHandler: (environment: EnvironmentInput) => Promise<void>
}



export default function CreateEnvironmentDialog({ children, userSettings, environments, createEnvironmentHandler }: CreateEnvironmentDialogProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [installComfyUIDialog, setInstallComfyUIDialog] = useState(false)
  const [isInstallingComfyUILoading, setIsInstallingComfyUILoading] = useState(false)
  const [releaseOptions, setReleaseOptions] = useState<string[]>(["latest"])
  const [pullImageDialog, setPullImageDialog] = useState(false)
  const [pendingEnvironment, setPendingEnvironment] = useState<EnvironmentInput | null>(null);
  
  const { toast } = useToast()

  const initialComfyUIPath = userSettings?.comfyui_path || defaultComfyUIPath || ""
  const defaultEnvType = EnvironmentTypeEnum.Default

  // Form default values as a constant to avoid duplication
  const defaultValues = {
    name: "",
    release: "latest",
    image: "",
    comfyUIPath: initialComfyUIPath,
    environmentType: defaultEnvType,
    copyCustomNodes: false,
    command: userSettings?.command || "",
    port: String(userSettings?.port) || "8188",
    runtime: String(userSettings?.runtime) as "nvidia" | "none" || "nvidia",
    mountConfig: getDefaultMountConfigsForEnvType(defaultEnvType, initialComfyUIPath)
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const comfyUIPath = useWatch({
    control: form.control,
    name: "comfyUIPath",
  })

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const currentEnvType = form.getValues("environmentType");
      
      if (currentEnvType === EnvironmentTypeEnum.Custom) {
        // For custom environments, update non-overridden paths
        const updatedMountConfig = form.getValues("mountConfig").map(config => {
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
        const newMountConfig = getDefaultMountConfigsForEnvType(currentEnvType, comfyUIPath);
        form.setValue("mountConfig", newMountConfig);
      }
    }, 300); // 300ms debounce
  
    return () => clearTimeout(debounceTimer);
  }, [comfyUIPath, form, form.getValues("environmentType")]);

  useEffect(() => {
    if (isCreateModalOpen) {
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
  }, [isCreateModalOpen])

  useEffect(() => {
    form.reset(defaultValues)
  }, [userSettings])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "mountConfig",
  })

  const resetForm = () => {
    form.reset(defaultValues)
  }


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(`onSubmit: ${JSON.stringify(values)}`)
    let release = getLatestComfyUIReleaseFromBranch(values.release, releaseOptions)
    console.log(release)
    const newEnvironment: EnvironmentInput = {
      name: values.name,
      image: values.image || `${COMFYUI_IMAGE_NAME}:${release}`,
      command: values.command,
      comfyui_path: values.comfyUIPath,
      options: {
        "comfyui_release": release,
        "port": values.port,
        "mount_config": {mounts: values.mountConfig},
        "runtime": values.runtime,
      }
    }

    try {
      // validateEnvironmentInput(newEnvironment)
      console.log(newEnvironment)

      // Start loading state
      setIsLoading(true)

      setPendingEnvironment(newEnvironment)
      await continueCreateEnvironment(newEnvironment)
    } catch (error: any) {
      console.log(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const finishCreateEnvironment = async (environment: EnvironmentInput | null) => {
    if (!environment) return;
    // Create environment
    await createEnvironmentHandler(environment);
    setIsCreateModalOpen(false);
    resetForm();
    toast({
      title: "Success",
      description: "Environment created successfully",
      duration: SUCCESS_TOAST_DURATION,
    });

    // Cleanup after success
    setIsLoading(false);
    setPendingEnvironment(null);
  }

  const continueCreateEnvironment = async (environment: EnvironmentInput | null) => {
    if (!environment) return;
    try {
      const imageExists = await checkImageExists(environment.image);
      if (!imageExists) {
        setPullImageDialog(true);
        setIsLoading(false);
        return; // Early return, no cleanup here
      }

      const validComfyUIPath = await checkValidComfyUIPath(environment.comfyui_path || "");
      if (!validComfyUIPath) {
        setInstallComfyUIDialog(true);
        setIsLoading(false);
        return; // Early return, no cleanup here
      }
  
      await finishCreateEnvironment(environment);
    } catch (error: any) {
      // Handle error
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      setPendingEnvironment(null);
    }
  };

  const handleEnvironmentTypeChange = (value: EnvironmentTypeEnum) => {
    form.setValue("environmentType", value)

    // Grab the comfyUI path from the form
    const comfyUIPath = form.getValues("comfyUIPath")

    // Generate the mount config array
    const mountConfigs = getDefaultMountConfigsForEnvType(value, comfyUIPath)

    // Update the form state
    form.setValue("mountConfig", mountConfigs)
  };

  const handleMountConfigChange = () => {
    form.setValue("environmentType", EnvironmentTypeEnum.Custom)
  }

  const updateComfyUIPath = async (comfyUIPath: string) => {
    // TODO: This is a temporary solution to update the comfyUI path based on the OS
    // We should find a better way to do this in the future
    const isUnix = comfyUIPath.includes("/")
    const isWindows = comfyUIPath.includes("\\")
    if (isUnix) {
      return comfyUIPath + "/ComfyUI"
    } else if (isWindows) {
      return comfyUIPath + "\\ComfyUI"
    }
    return comfyUIPath
  }

  const handleInstallComfyUI = async () => {
    try {
      const comfyUIPath = form.getValues("comfyUIPath")
      console.log(comfyUIPath)
      let branch = form.getValues("release")
      branch = getLatestComfyUIReleaseFromBranch(branch, releaseOptions)
      console.log(branch)
      setIsInstallingComfyUILoading(true)

      await tryInstallComfyUI(comfyUIPath, branch)

      setInstallComfyUIDialog(false);
      setIsInstallingComfyUILoading(false);
      setIsLoading(true);
      toast({
        title: "Success",
        description: "ComfyUI installed successfully",
        duration: SUCCESS_TOAST_DURATION,
      })
      // Try updating the comfyUI path with /ComfyUI or \ComfyUI based on the OS
      const updatedComfyUIPath = await updateComfyUIPath(comfyUIPath);
      form.setValue("comfyUIPath", updatedComfyUIPath);
      // Also update the mount config to use the updated comfyUI path
      const currentEnvironmentType = form.getValues("environmentType")
      // const updatedMountConfig = getDefaultMountConfigsForEnvType(currentEnvironmentType, updatedComfyUIPath)
      const updatedMountConfig = form.getValues("mountConfig").map(config => {
        if (!config.override) {
          // Only update non-overridden paths
          const containerDir = config.container_path.split('/').pop();
          return {
            ...config,
            host_path: joinPaths(updatedComfyUIPath, containerDir || '')
          };
        }
        return config;
      });
      console.log(updatedMountConfig)
      form.setValue("mountConfig", updatedMountConfig)
      const updatedEnvironment: EnvironmentInput = {
        ...pendingEnvironment,
        comfyui_path: updatedComfyUIPath,
        name: pendingEnvironment?.name || "",
        image: pendingEnvironment?.image || "",
        options: {
          ...pendingEnvironment?.options,
          "comfyui_path": updatedComfyUIPath,
          "mount_config": {mounts: updatedMountConfig},
        }
      };
      setPendingEnvironment(updatedEnvironment);
      await continueCreateEnvironment(updatedEnvironment);
      
    } catch (error: any) {
      setIsInstallingComfyUILoading(false);
      setInstallComfyUIDialog(false);
      setPendingEnvironment(null);
      setIsLoading(false);
      console.error(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // console.log(Object.entries(EnvironmentTypeEnum).map(([key, value]) => (value)))

  return (
    <>
      <CustomAlertDialog
        open={installComfyUIDialog}
        title="Could not find valid ComfyUI installation"
        description="We could not find a valid ComfyUI installation at the path you provided. Should we try to install ComfyUI automatically?"
        cancelText="No"
        actionText="Yes"
        onAction={handleInstallComfyUI}
        onCancel={async () => {
          console.log("onCancel")
          setInstallComfyUIDialog(false)
          await finishCreateEnvironment(pendingEnvironment);
        }}
        variant="default"
        loading={isInstallingComfyUILoading}
      />

      <ImagePullDialog
        image={pendingEnvironment?.image || ""}
        open={pullImageDialog}
        onOpenChange={(open) => {
          setPullImageDialog(open);
          if (!open) {
            setPendingEnvironment(null);
            setIsLoading(false);
          }
        }}
        onSuccess={async () => {
          setPullImageDialog(false);
          setIsLoading(true);
          await continueCreateEnvironment(pendingEnvironment);
        }}
      />

      <Dialog open={isCreateModalOpen} onOpenChange={installComfyUIDialog ? undefined : setIsCreateModalOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[80vh] min-w-[600px] overflow-y-auto dialog-content">
          <DialogHeader>
            <DialogTitle>Create New Environment</DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />{" "}
                  Creating...
                </div>
              )}
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormFieldComponent
                  control={form.control}
                  name="name"
                  label="Name"
                  placeholder=""
                />
                <FormField
                  control={form.control}
                  name="release"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">
                        ComfyUI Release
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl className="col-span-3">
                          <SelectTrigger>
                            <SelectValue placeholder="Select a release" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {releaseOptions.map(
                            (release) => (
                              <SelectItem key={release} value={release}>
                                {release}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage className="col-start-2 col-span-3" />
                    </FormItem>
                  )}
                />
                <FormFieldComponent
                  control={form.control}
                  name="image"
                  label="Custom Docker Image"
                  placeholder="Optional: DockerHub image URL"
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
                            <SelectValue>
                              {field.value}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(EnvironmentTypeEnum).map(([value, label]) => (
                            <SelectItem key={value} value={label}>
                              <div className="flex flex-col">
                                <span className="font-medium">{label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {EnvironmentTypeDescriptions[label as EnvironmentType]}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
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
                                append({ type: MountActionEnum.Mount, container_path: "", host_path: "", read_only: false, override: false });
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
    </>
  );
}
