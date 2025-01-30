import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EnvironmentForm } from "@/components/form/EnvironmentForm";
import { useToast } from "@/hooks/use-toast";
import {
  Environment,
  EnvironmentFormValues,
  EnvironmentInput,
  EnvironmentTypeEnum,
  EnvironmentTypeDescriptions,
  baseFormSchema,
  MountActionEnum,
  MountConfigFormValues,
} from "@/types/Environment";
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
import { UserSettings } from "@/types/UserSettings";
import FormFieldComponent from "../form/FormFieldComponent";
import { CustomAlertDialog } from "./CustomAlertDialog";
import { useComfyUIInstall } from "@/hooks/use-comfyui-install";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkImageExists, checkValidComfyUIPath, getComfyUIImageTags } from "@/api/environmentApi";
import * as z from "zod";
import { getLatestComfyUIReleaseFromBranch, COMFYUI_IMAGE_NAME } from "@/components/utils/ComfyUtils";
import ImagePullDialog from "./PullImageDialog";
import { getDefaultMountConfigsForEnvType } from "../utils/MountConfigUtils";


const SUCCESS_TOAST_DURATION = 2000
const DEFAULT_COMFYUI_PATH = import.meta.env.VITE_DEFAULT_COMFYUI_PATH

interface CreateEnvironmentDialogProps {
  children: React.ReactNode;
  userSettings: UserSettings;
  environments: Environment[];
  createEnvironmentHandler: (environment: EnvironmentInput) => Promise<void>;
}

export default function CreateEnvironmentDialog({
  children,
  userSettings,
  createEnvironmentHandler,
}: CreateEnvironmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [releaseOptions, setReleaseOptions] = useState<string[]>([]);
  const [pendingEnvironment, setPendingEnvironment] = useState<EnvironmentInput | null>(null);
  const [pullImageDialog, setPullImageDialog] = useState(false)
  const { toast } = useToast();

  const initialComfyUIPath = userSettings?.comfyui_path || DEFAULT_COMFYUI_PATH || ""
  const defaultEnvType = EnvironmentTypeEnum.Default

  const defaultValues = {
    name: "",
    release: "latest",
    image: "",
    comfyUIPath: initialComfyUIPath,
    environmentType: defaultEnvType,
    command: userSettings?.command || "",
    port: String(userSettings?.port) || "8188",
    runtime: userSettings?.runtime || "nvidia",
    mountConfig: getDefaultMountConfigsForEnvType(defaultEnvType, initialComfyUIPath) as MountConfigFormValues[],
  };

  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(baseFormSchema),
    defaultValues,
    mode: "onChange",
  });

  

  const onSubmit = async (values: z.infer<typeof baseFormSchema>) => {
    console.log(`onSubmit: ${JSON.stringify(values)}`)
    let release = getLatestComfyUIReleaseFromBranch(values.release || "latest", releaseOptions)
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
    setIsOpen(false);
    form.reset(defaultValues)
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

  useEffect(() => {
    if (isOpen) {
      getComfyUIImageTags()
        .then((result) => {
          console.log(result.tags);
          // Convert tags from object to array and add "latest" to the beginning
          const tagsArray = Object.values(result.tags).map((tag) =>
            String(tag)
          );
          const filteredTags = tagsArray.filter((tag) => tag !== "latest");
          setReleaseOptions(["latest", ...filteredTags]);
          console.log(Object.values(result.tags).map((tag) => String(tag)));
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    form.reset(defaultValues)
  }, [userSettings])

  const onComfyUIInstallFinished = async (updatedComfyUIPath: string, updatedMountConfig: MountConfigFormValues[]) => {
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
  }

  // Hooks
  const {
    installComfyUIDialog,
    setInstallComfyUIDialog,
    isInstalling,
    handleInstallComfyUI,
  } = useComfyUIInstall(form, releaseOptions, toast, onComfyUIInstallFinished);

  return (
    <>
      <CustomAlertDialog
        open={installComfyUIDialog}
        title="Could not find valid ComfyUI installation"
        description="We could not find a valid ComfyUI installation at the path you provided. Should we try to install ComfyUI automatically?"
        cancelText="No"
        actionText="Yes"
        alternateActionText="Proceed without ComfyUI"
        onAction={handleInstallComfyUI}
        onCancel={async () => {
          setInstallComfyUIDialog(false);
        }}
        onAlternateAction={async () => {
          setInstallComfyUIDialog(false);
          await finishCreateEnvironment(pendingEnvironment);
        }}
        variant="default"
        loading={isInstalling}
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
      <Dialog open={isOpen} onOpenChange={installComfyUIDialog ? undefined : setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-h-[80vh] min-w-[600px] overflow-y-auto dialog-content">
          <EnvironmentForm
            title="Create New Environment"
            defaultValues={defaultValues}
            form={form}
            environmentTypeOptions={EnvironmentTypeEnum}
            environmentTypeDescriptions={EnvironmentTypeDescriptions}
            onSubmit={onSubmit}
            isLoading={isLoading}
            submitButtonText="Create"
          >
            {/* Create-specific fields */}
            <FormField
              control={form.control}
              name="release"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">ComfyUI Release</FormLabel>
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
                      {releaseOptions.map((release) => (
                        <SelectItem key={release} value={release}>
                          {release}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-start-2 col-span-3" />
                </FormItem>
              )}
            />
            <FormFieldComponent
              name="image"
              label="Custom Docker Image"
              placeholder="Optional: DockerHub image URL"
            />
          </EnvironmentForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
