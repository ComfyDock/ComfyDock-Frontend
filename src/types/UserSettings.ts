export interface Folder {
  id: string;
  name: string;
  icon?: string; // icon optional
}

export type FolderInput = {
  name: string;
  icon?: string; // icon optional
}

export type UserSettings = {
  comfyui_path?: string
  port?: number
  runtime?: string
  command?: string
  folders?: Folder[]
  max_deleted_environments?: number
}


export type UserSettingsInput = {
  comfyui_path?: string
  runtime?: string
  port?: number
  command?: string
  folders?: Folder[]
  max_deleted_environments?: number
}
