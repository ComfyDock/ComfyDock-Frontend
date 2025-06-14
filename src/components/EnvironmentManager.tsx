import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { WS_CONFIG } from "@/config";
import packageJson from "../../package.json";

import { useEnvironmentManager } from "@/hooks/useEnvironmentManager";
import { useUserSettingsManager } from "@/hooks/useUserSettings";
import { useWebSocketConnection } from "@/hooks/useWebSocketConnection";

import CreateEnvironmentDialog from "./dialogs/CreateEnvironmentDialog";
import UserSettingsDialog from "./dialogs/UserSettingsDialog";
import { FolderSelector } from "./FolderSelector";
import EnvironmentCard from "./EnvironmentCard";
import { ThemeToggle } from "./ThemeToggle";

export function EnvironmentManagerComponent() {
  const { environments,
          activatingEnvironment,
          deletingEnvironment,
          updateEnvironments,
          createEnvironmentHandler,
          duplicateEnvironmentHandler,
          activateEnvironmentHandler,
          deactivateEnvironmentHandler,
          deleteEnvironmentHandler,
          updateEnvironmentHandler,
          selectedFolderRef } = useEnvironmentManager();

  const { userSettings,
          folders,
          selectedFolder,
          setSelectedFolder,
          handleAddFolder,
          handleEditFolder,
          handleDeleteFolder,
          updateUserSettingsHandler } = useUserSettingsManager();

  // WebSocket connection
  const { connectionStatus } = useWebSocketConnection({
    url: WS_CONFIG.url,
    onMessage: (event) => {
      // Debounce or call updateEnvironments directly
      // Or use your existing approach with timeouts
      console.log("WebSocket message: ", event.data);
      // We can directly use the environment manager's method
      setTimeout(() => updateEnvironments(selectedFolderRef.current), 500);
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // When this component mounts, load the environments for the first time
    (async () => {
      try {
        await updateEnvironments(selectedFolder?.id);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to update environments: ${error}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedFolder?.id]);

  // If you need to keep selectedFolderRef in sync:
  useEffect(() => {
    selectedFolderRef.current = selectedFolder?.id;
  }, [selectedFolder]);

  return (
    <div className="container min-w-[100vw] min-h-screen mx-auto p-4 relative">
      {isLoading && (
        <div className="fixed inset-0 bg-zinc-200/50 dark:bg-zinc-800/50 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          {/* Loading UI */}
        </div>
      )}

      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-teal-600 text-transparent bg-clip-text title">
        ComfyDock
      </h1>

      {/* Top Buttons */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <div className="flex flex-wrap gap-4 mb-4 md:mb-0">
          <CreateEnvironmentDialog
            userSettings={userSettings || undefined}
            selectedFolderRef={selectedFolderRef}
            createEnvironmentHandler={createEnvironmentHandler}
            updateUserSettingsHandler={updateUserSettingsHandler}
          >
            <Button className="bg-blue-600 hover:bg-blue-700">
              Create Environment
            </Button>
          </CreateEnvironmentDialog>

          <UserSettingsDialog 
            userSettings={userSettings || undefined}
            updateUserSettingsHandler={updateUserSettingsHandler}
          >
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </UserSettingsDialog>
        </div>

        <div className="flex flex-wrap gap-4 mb-4 md:mb-0">
          <a
            href={`https://comfydock.com`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-slate-600 hover:bg-slate-700">
              <ExternalLink className="w-4 h-4" />
              Documentation
            </Button>
          </a>

          <a
            href="https://discord.gg/2h5rSTeh6Y"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-[#5865F2] hover:bg-[#4752C4]">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord
            </Button>
          </a>

          {/* Ko-Fi link */}
          <a href="https://ko-fi.com/A0A616TJHD" target="_blank" rel="noopener noreferrer">
            <img
              height="36"
              style={{ border: "0px", height: "36px" }}
              src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
              alt="Buy Me a Coffee at ko-fi.com"
            />
          </a>

          <ThemeToggle />
        </div>
      </div>

      {/* Folder Selector + Connection Status */}
      <div className="w-full flex flex-col-reverse md:flex-row justify-between items-center mb-4 gap-4">
        <div className="w-full">  {/* Wrapper for FolderSelector */}
          <FolderSelector
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={(folder) => {
              setSelectedFolder(folder);
            }}
            onAddFolder={handleAddFolder}
            onEditFolder={handleEditFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        </div>
        <div className="flex items-center space-x-2 pr-4">
          <span className="font-medium">Connection</span>
          <span
            className={`h-3 w-3 rounded-full ${
              connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"
            }`}
          />
        </div>
      </div>

      {/* Environment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {environments.map((env) => (
          <EnvironmentCard
            key={env.id}
            environment={env}
            userSettings={userSettings}
            folders={folders}
            selectedFolderRef={selectedFolderRef}
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

      {/* Footer */}
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

      {/* Version */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center justify-center">
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          v{packageJson.version}
        </p>
      </div>
      <Toaster />
    </div>
  );
}
