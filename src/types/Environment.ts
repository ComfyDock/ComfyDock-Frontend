export type Mount = {
  container_path: string;
  host_path: string;
  type: string;
  read_only: boolean;
};

export type MountConfig = {
  mounts: Mount[];
};

export type Options = {
  mount_config?: MountConfig;
  [key: string]: string | Options | MountConfig | undefined; // Include MountConfig in the index signature
};

export type EnvironmentInput = {
  name: string;
  image: string;
  command?: string;
  comfyui_path?: string;
  options?: Options;
  folderIds?: string[];
};

export type Environment = {
  name: string;
  image: string;
  container_name?: string;
  id?: string;
  status?: string;
  command?: string;
  duplicate?: boolean;
  comfyui_path?: string;
  options?: Options;
  metadata?: Options;
  folderIds?: string[];
};

export type EnvironmentUpdate = {
  name?: string;
  options?: Options;
  folderIds?: string[];
};

// name: str
// image: str
// id: str = ""
// status: str = ""
// command: str = ""
// comfyui_path: str = ""
// options: dict = {}
// metadata: dict = {}
