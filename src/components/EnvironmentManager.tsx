import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  FolderIcon,
  HelpCircle,
  Loader2,
  RefreshCcw,
  Settings,
  Trash2,
} from "lucide-react";
import { Environment, EnvironmentInput } from "@/types/Environment";
import CreateEnvironmentDialog from "./dialogs/CreateEnvironmentDialog";
import { useToast } from "@/hooks/use-toast";
import {
  createEnvironment,
  fetchEnvironments,
  activateEnvironment,
  deactivateEnvironment,
  duplicateEnvironment,
  deleteEnvironment,
  updateEnvironment,
  getUserSettings,
  updateUserSettings,
  createFolder,
  updateFolder,
  deleteFolder,
} from "@/api/environmentApi";
import UserSettingsDialog from "./dialogs/UserSettingsDialog";
import { FolderInput, UserSettings, UserSettingsInput } from "@/types/UserSettings";
import EnvironmentCard from "./EnvironmentCard";
import { DEFAULT_FOLDERS, FolderSelector } from "./FolderSelector";
import { Folder } from "@/types/UserSettings";
import { CustomAlertDialog } from "./dialogs/CustomAlertDialog";

const POLL_INTERVAL = 2000;
const SUCCESS_TOAST_DURATION = 2000;
const WS_URL = "ws://localhost:5172/ws";

export function EnvironmentManagerComponent() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activatingEnvironment, setActivatingEnvironment] = useState<
    string | null
  >(null);
  const [deletingEnvironment, setDeletingEnvironment] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [folders, setFolders] = useState<Folder[]>(DEFAULT_FOLDERS);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(
    DEFAULT_FOLDERS[0]
  );
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected"
  >("disconnected");
  const { toast } = useToast();

  const selectedFolderRef = useRef<Folder | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update the ref whenever selectedFolder changes
  useEffect(() => {
    selectedFolderRef.current = selectedFolder;
  }, [selectedFolder]);

  useEffect(() => {
    let reconnectInterval: NodeJS.Timeout | undefined;
    let wsInstance: WebSocket | null = null; // Track the current WebSocket instance
  
    function connect() {
      // Clean up any existing connection before creating a new one
      if (wsInstance) {
        wsInstance.close(); // Explicitly close previous connection
        wsInstance = null;
      }
  
      const ws = new WebSocket(WS_URL);
      wsInstance = ws; // Store reference to current instance
      
      ws.onopen = () => {
        console.log("WebSocket connection established");
        setConnectionStatus('connected');
        // Clear any existing reconnection interval
        if (reconnectInterval) {
          clearInterval(reconnectInterval);
          reconnectInterval = undefined;
        }
      };
      
      ws.onmessage = (event) => {
        const message = event.type;
        console.log(`WebSocket message: ${message}`);
        // Debounce the environment updates
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(async () => {
          try {
            // Use the ref to get the current folder ID
            const currentFolderId = selectedFolderRef.current?.id;
            console.log(`Updating environments for folder: ${currentFolderId}`);
            await updateEnvironments(currentFolderId);

          } catch (error) {
            console.error('Error updating environments:', error);
          }
        }, 500); // Adjust debounce time as needed (300ms here)
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Close the faulty connection immediately
        ws.close();
        handleDisconnect();
      };
      
      ws.onclose = () => {
        handleDisconnect();
      };
  
      setSocket(ws);
    }
  
    function handleDisconnect() {
      setConnectionStatus('disconnected');
      
      // Clean up current instance
      if (wsInstance) {
        wsInstance.close();
        wsInstance = null;
      }
  
      // Start polling for reconnection if not already polling
      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          console.log("Attempting to reconnect...");
          connect();
        }, POLL_INTERVAL);
      }
    }
  
    // Initial connection
    connect();
  
    // Cleanup function for effect
    return () => {
      // Clear any existing interval
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
      }
      
      // Close any existing WebSocket connection
      if (wsInstance) {
        wsInstance.close();
      }
      
      // Clear the socket state
      setSocket(null);
    };
  }, []);

  useEffect(() => {
    try {
      setIsLoading(true);
      updateEnvironments(selectedFolder?.id);
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating environments:", error);
      toast({
        title: "Error",
        description: `Failed to update environments: ${error}`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const updateEnvironments = async (folderId?: string) => {
    try {
      const curFolder = folderId || selectedFolder?.id;
      const fetchedEnvironments = await fetchEnvironments(curFolder);
      setEnvironments(fetchedEnvironments);
    } catch (error) {
      console.error("Failed to fetch environments:", error);
      throw Error(`Failed to fetch environments: ${error}`);
      // Keep isLoading true to continue showing the loading state
    }
  };

  const handleAddFolder = async (folder: FolderInput) => {
    if (folder.name) {
      try {
        const newFolder = await createFolder(folder.name);
        setFolders((prev) => [...prev, newFolder]);
        await updateEnvironments();
        toast({
          title: "Success",
          description: `Folder "${folder.name}" created`,
          variant: "default",
          duration: SUCCESS_TOAST_DURATION,
        });
      } catch (error) {
        console.error(error);
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
        await updateEnvironments();
        setFolders((prev) =>
          prev.map((f) => (f.id === folder.id ? updated : f))
        );
        setSelectedFolder(updated);
        toast({
          title: "Success",
          description: `Folder "${folder.name}" updated`,
          variant: "default",
          duration: SUCCESS_TOAST_DURATION,
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: `Failed to update folder: ${error}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteFolder = async (folder: Folder | null) => {
    if (!folder) {
      toast({
        title: "Error",
        description: "No folder selected",
        variant: "destructive",
      });
      return;
    }
    if (folder.id === "all" || folder.id === "deleted") {
      toast({
        title: "Error",
        description: "Cannot delete default folders",
        variant: "destructive",
      });
      return;
    }

    try {
      let newFolder =
        folder.id === selectedFolder?.id ? DEFAULT_FOLDERS[0] : selectedFolder;
      await deleteFolder(folder.id);
      await updateEnvironments(newFolder?.id);
      setSelectedFolder(newFolder);
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      toast({
        title: "Success",
        description: `Folder "${folder.name}" deleted`,
        variant: "default",
        duration: SUCCESS_TOAST_DURATION,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: `Failed to delete folder: ${error}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const createEnvironmentHandler = async (environment: EnvironmentInput) => {
    try {
      // TODO: possibly change this to user dropdown in create dialog instead of default
      // Add current folder id to environment if not a default folder
      if (
        selectedFolder?.id &&
        selectedFolder?.id !== "all" &&
        selectedFolder?.id !== "deleted"
      ) {
        environment.folderIds = [selectedFolder?.id];
      }
      await createEnvironment(environment);
      await updateEnvironments();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const duplicateEnvironmentHandler = async (
    id: string,
    environment: EnvironmentInput
  ) => {
    try {
      if (
        selectedFolder?.id &&
        selectedFolder?.id !== "all" &&
        selectedFolder?.id !== "deleted"
      ) {
        environment.folderIds = [selectedFolder?.id];
      }
      console.log(`duplicateEnvironmentHandler: ${environment}`);
      const response = await duplicateEnvironment(id, environment);
      await updateEnvironments();
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const activateEnvironmentHandler = async (id: string) => {
    try {
      setActivatingEnvironment(id);
      await activateEnvironment(id);
      await updateEnvironments();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: `Failed to activate environment: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setActivatingEnvironment(null);
    }
  };

  const deactivateEnvironmentHandler = async (id: string) => {
    try {
      setActivatingEnvironment(id);
      await deactivateEnvironment(id);
      await updateEnvironments();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: `Failed to deactivate environment: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setActivatingEnvironment(null);
    }
  };

  const deleteEnvironmentHandler = async (id: string) => {
    // Get the environment
    const environment = environments.find((env) => env.id === id);
    if (!environment) {
      throw new Error(`Environment with id ${id} not found`);
    }

    try {
      console.log(`deleteEnvironmentHandler: ${id} ${environment.folderIds}`);
      setDeletingEnvironment(id);
      const response = await deleteEnvironment(id);
      await updateEnvironments();
      return response;
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: `Failed to delete environment: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setDeletingEnvironment(null);
    }
  };

  const updateEnvironmentHandler = async (
    id: string,
    name: string,
    folderIds?: string[]
  ) => {
    console.log(`updateEnvironmentHandler: ${id} ${name} ${folderIds}`);
    try {
      await updateEnvironment(id, { name, folderIds });
      await updateEnvironments();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateUserSettingsHandler = async (settings: UserSettingsInput) => {
    try {
      await updateUserSettings(settings);
      setUserSettings(settings);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Get the user settings on mount
  useEffect(() => {
    getUserSettings().then((settings: UserSettings) => {
      setUserSettings(settings);
      setFolders(settings.folders || []);
    });
  }, []);

  // Poll every 5 seconds to refresh the environments
  // useEffect(() => {
  //   updateEnvironments(selectedFolder?.id);
  //   const retryInterval = setInterval(async () => {
  //     try {
  //       await updateEnvironments(selectedFolder?.id);
  //     } catch (error) {
  //       console.error("Error updating environments1:", error);
  //       setIsLoading(true);
  //     }
  //   }, POLL_INTERVAL);
  //   return () => clearInterval(retryInterval);
  // }, [selectedFolder?.id]);

  return (
    <div className="container min-w-[100vw] min-h-screen mx-auto p-4 relative">
      {isLoading && (
        <div className="fixed inset-0 bg-zinc-200/50 dark:bg-zinc-800/50 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <Loader2 className="w-12 h-12 text-zinc-900 dark:text-zinc-50 animate-spin mb-4" />
          <p className="text-zinc-900 dark:text-zinc-50 text-lg font-semibold">
            Connecting to server...
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Please wait while we establish a connection.
          </p>
        </div>
      )}

      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-teal-600 text-transparent bg-clip-text title">
        ComfyDock
      </h1>

      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4 md:mb-0">
          <CreateEnvironmentDialog
            userSettings={userSettings || undefined}
            createEnvironmentHandler={createEnvironmentHandler}
          >
            <Button className="bg-blue-600 hover:bg-blue-700">
              Create Environment
            </Button>
          </CreateEnvironmentDialog>

          <UserSettingsDialog
            updateUserSettingsHandler={updateUserSettingsHandler}
          >
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </UserSettingsDialog>
        </div>

        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4 md:mb-0">
          <a
            href={`https://cyber-damselfly-b6c.notion.site/ComfyUI-Environment-Manager-14ffd5b1ca3b804abafbdb4bd6b8068e`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <Button className="bg-slate-600 hover:bg-slate-700">
              <ExternalLink className="w-4 h-4" />
              Documentation
            </Button>
          </a>

          <a
            href="https://ko-fi.com/A0A616TJHD"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              height="36"
              style={{ border: "0px", height: "36px" }}
              src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
              alt="Buy Me a Coffee at ko-fi.com"
            />
          </a>
        </div>
      </div>

      <div className="w-full flex justify-between items-center mb-4">
        <FolderSelector
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={(folder) => {
            console.log(`Selected folder: ${folder.name}`);
            setSelectedFolder(folder);
            updateEnvironments(folder.id);
          }}
          onAddFolder={handleAddFolder}
          onEditFolder={handleEditFolder}
          onDeleteFolder={handleDeleteFolder}
        />
        <div className="flex items-center space-x-2 pr-4">
          <span className="font-medium">Websocket</span>
          <span
            className={`h-3 w-3 rounded-full ${
              connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {environments.map((env: Environment) => (
          <EnvironmentCard
            key={env.id}
            environment={env}
            environments={environments}
            folders={folders}
            activatingEnvironment={activatingEnvironment}
            deletingEnvironment={deletingEnvironment}
            updateEnvironmentHandler={updateEnvironmentHandler}
            duplicateEnvironmentHandler={duplicateEnvironmentHandler}
            deleteEnvironmentHandler={deleteEnvironmentHandler}
            activateEnvironmentHandler={activateEnvironmentHandler}
            deactivateEnvironmentHandler={deactivateEnvironmentHandler}
          />
        ))}
      </div>
      {/* Footer at absolute bottom left */}
      <div className="absolute bottom-4 left-4 flex flex-col items-center justify-center">
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Made with 💜 by{" "}
          <a
            href="https://akatz.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-teal-600"
          >
            Akatz
          </a>
        </p>
      </div>
    </div>
  );
}
