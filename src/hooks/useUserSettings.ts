import { useEffect, useState } from "react";
import { getUserSettings, updateUserSettings, createFolder, updateFolder, deleteFolder } from "@/api/environmentApi";
import { Folder, FolderInput, UserSettings, UserSettingsInput } from "@/types/UserSettings";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_FOLDERS } from "@/components/FolderSelector";

export function useUserSettingsManager() {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [folders, setFolders] = useState<Folder[]>(DEFAULT_FOLDERS);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(DEFAULT_FOLDERS[0]);
  const { toast } = useToast();

  useEffect(() => {
    getUserSettings().then((settings) => {
      console.log(`settings: ${JSON.stringify(settings)}`);
      setUserSettings(settings);
      setFolders(settings.folders || DEFAULT_FOLDERS);
      // optional: if you want to default to the first custom folder
    });
  }, []);

  const updateUserSettingsHandler = async (settings: UserSettingsInput) => {
    try {
      // Merge existing settings with new settings
      const updatedSettings = {
        ...userSettings,
        ...settings
      } as UserSettings;
      
      await updateUserSettings(updatedSettings);
      setUserSettings(updatedSettings);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleAddFolder = async (folder: FolderInput) => {
    if (folder.name) {
      try {
        const newFolder = await createFolder(folder.name);
        setFolders((prev) => [...prev, newFolder]);
        toast({
          title: "Success",
          description: `Folder "${folder.name}" created`,
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to create folder: ${error}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleEditFolder = async (folder: Folder) => {
    if (folder.name) {
      try {
        const updated = await updateFolder(folder.id, folder.name);
        setFolders((prev) => prev.map((f) => (f.id === folder.id ? updated : f)));
        setSelectedFolder(updated);
        toast({
          title: "Success",
          description: `Folder "${folder.name}" updated`,
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to update folder: ${error}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteFolder = async (folder: Folder | null) => {
    if (!folder || folder.id === "all" || folder.id === "deleted") {
      toast({
        title: "Error",
        description: "Cannot delete default folders",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteFolder(folder.id);
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      setSelectedFolder(DEFAULT_FOLDERS[0]);
      toast({
        title: "Success",
        description: `Folder "${folder.name}" deleted`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete folder: ${error}`,
        variant: "destructive",
      });
    }
  };

  return {
    userSettings: userSettings as UserSettings,
    folders,
    selectedFolder,
    setSelectedFolder,
    handleAddFolder,
    handleEditFolder,
    handleDeleteFolder,
    updateUserSettingsHandler,
  };
}
