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
  port?: string
  runtime?: string
  command?: string
  folders?: Folder[]
  max_deleted_environments?: number
  last_used_image?: string
}


export type UserSettingsInput = {
  comfyui_path?: string
  runtime?: string
  port?: string
  command?: string
  folders?: Folder[]
  max_deleted_environments?: number 
  last_used_image?: string
}
