import { useEffect, useState, useRef } from "react";
import {
  fetchEnvironments,
  createEnvironment,
  activateEnvironment,
  deactivateEnvironment,
  duplicateEnvironment,
  deleteEnvironment,
  updateEnvironment,
} from "@/api/environmentApi";
import { Environment, EnvironmentInput } from "@/types/Environment";
import { useToast } from "@/hooks/use-toast";

export function useEnvironmentManager() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activatingEnvironment, setActivatingEnvironment] = useState<string | null>(null);
  const [deletingEnvironment, setDeletingEnvironment] = useState<string | null>(null);
  const { toast } = useToast();

  // We can have a 'selectedFolderRef' if needed (as in your existing code):
  const selectedFolderRef = useRef<string | undefined>(undefined);

  async function updateEnvironments(folderId?: string) {
    try {
      const fetchedEnvironments = await fetchEnvironments(folderId);
      setEnvironments(fetchedEnvironments);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch environments: ${error}`,
        variant: "destructive",
      });
      throw Error(`Failed to fetch environments: ${error}`);
    }
  }

  const createEnvironmentHandler = async (environment: EnvironmentInput) => {
    try {
      await createEnvironment(environment);
      await updateEnvironments(selectedFolderRef.current);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const duplicateEnvironmentHandler = async (id: string, environment: EnvironmentInput) => {
    try {
      const response = await duplicateEnvironment(id, environment);
      await updateEnvironments(selectedFolderRef.current);
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const activateEnvironmentHandler = async (id: string, allow_multiple: boolean = false) => {
    try {
      setActivatingEnvironment(id);
      await activateEnvironment(id, allow_multiple);
      await updateEnvironments(selectedFolderRef.current);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: `Failed to activate environment: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      await updateEnvironments(selectedFolderRef.current);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: `Failed to deactivate environment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setActivatingEnvironment(null);
    }
  };

  const deleteEnvironmentHandler = async (id: string) => {
    try {
      setDeletingEnvironment(id);
      await deleteEnvironment(id);
      await updateEnvironments(selectedFolderRef.current);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: `Failed to delete environment: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    try {
      await updateEnvironment(id, { name, folderIds });
      await updateEnvironments(selectedFolderRef.current);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Return the environment state and CRUD functions
  return {
    environments,
    setEnvironments,
    activatingEnvironment,
    deletingEnvironment,
    updateEnvironments,
    createEnvironmentHandler,
    duplicateEnvironmentHandler,
    activateEnvironmentHandler,
    deactivateEnvironmentHandler,
    deleteEnvironmentHandler,
    updateEnvironmentHandler,
    selectedFolderRef, // if you need to set it from outside
  };
}
