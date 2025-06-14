import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Environment } from "@/types/Environment";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
} from "lucide-react";
import { Folder as FolderType } from "@/types/UserSettings";
import { FolderSelector } from "../FolderSelector";
import { EnvironmentInfoCard } from "../EnvironmentInfoCard";
import ExportImageDialog from "./ExportImageDialog";

const SUCCESS_TOAST_DURATION = 2000;

const formSchema = z.object({
  name: z.string().min(1, { message: "Environment name is required" }),
  folderIds: z.array(z.string()).optional(),
});

export interface SettingsEnvironmentDialogProps {
  environment: Environment;
  folders: FolderType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  updateEnvironmentHandler: (
    id: string,
    name: string,
    folderIds?: string[]
  ) => Promise<void>;
}

const getEnvironmentFolder = (
  environment: Environment,
  folders: FolderType[]
) => {
  return environment.folderIds?.[0]
    ? folders.find((folder) => folder.id === environment.folderIds?.[0]) || {
        id: "None",
        name: "None",
        icon: "FolderX",
      }
    : { id: "None", name: "None", icon: "FolderX" };
};

export default function SettingsEnvironmentDialog({
  environment,
  folders,
  updateEnvironmentHandler,
  open,
  onOpenChange,
}: SettingsEnvironmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [exportImageDialogOpen, setExportImageDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(
    getEnvironmentFolder(environment, folders)
  );
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: environment.name,
      folderIds: environment.folderIds || [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await updateEnvironmentHandler(
        environment.id || "",
        values.name,
        selectedFolder?.id ? [selectedFolder?.id] : environment.folderIds
      );
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Environment updated successfully",
        duration: SUCCESS_TOAST_DURATION,
      });
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      }); 
    } finally {
      setIsLoading(false);
    }
  };

  // On open and close, reset the selected folder and form values
  useEffect(() => {
    setSelectedFolder(getEnvironmentFolder(environment, folders));
    form.reset({
      name: environment.name,
      folderIds: environment.folderIds || [],
    });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[80vh] min-w-[700px] overflow-y-auto dialog-content"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Environment Settings</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="folderIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                  {/* <FormControl> */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <FolderSelector
                      folders={[
                        { id: "None", name: "None", icon: "FolderX" },
                        ...folders,
                      ]}
                      showDefaultFolders={false}
                      searchEnabled={false}
                      showFolderButtons={false}
                      selectedFolder={selectedFolder}
                      onSelectFolder={(folder) => {
                        console.log("folder", folder);
                        setSelectedFolder(folder);
                        form.setValue("folderIds", [folder.id]);
                      }}
                    />
                  </div>
                  {/* </FormControl> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setExportImageDialogOpen(true)}
                disabled={isLoading}
              >
                Export Image
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
            <EnvironmentInfoCard environment={environment} />
          </form>
        </Form>
        <ExportImageDialog
          environment={environment}
          open={exportImageDialogOpen}
          onOpenChange={setExportImageDialogOpen}
        />
      </DialogContent>
    </Dialog>
  );
}