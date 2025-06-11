import { z } from "zod";

/* ------------------------------------------------------------------ *
 *  BASE TYPES
 * ------------------------------------------------------------------ */
export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional().nullable(),
});

export type Folder = z.infer<typeof folderSchema>;
export type FolderInput = Omit<Folder, "id">;

/* ------------------------------------------------------------------ *
 *  USER SETTINGS SCHEMA
 * ------------------------------------------------------------------ */
export const userSettingsSchema = z.object({
  comfyui_path: z.string().optional(),
  port: z.string().optional(),
  runtime: z.string().optional(),
  command: z.string().optional(),
  max_deleted_environments: z.number().int().min(1).max(100).default(10),
  folders: z.array(folderSchema).optional(),
  last_used_image: z.string().optional(),
  environment_variables: z.string().optional(),
  entrypoint: z.string().optional(),
  url: z.string().optional(),
  allow_multiple: z.boolean().default(false),
});

/* ------------------------------------------------------------------ *
 *  DERIVED TYPES
 * ------------------------------------------------------------------ */
// Base type with all fields
export type UserSettings = z.infer<typeof userSettingsSchema>;

// Input type for updates (all fields optional)
export type UserSettingsInput = Partial<UserSettings>;

/* ------------------------------------------------------------------ *
 *  DEFAULT VALUES
 * ------------------------------------------------------------------ */
export const DEFAULT_USER_SETTINGS = {
  comfyui_path: "",
  port: "8188",
  runtime: "nvidia",
  command: "",
  folders: [],
  max_deleted_environments: 10,
  last_used_image: "",
  environment_variables: "",
  entrypoint: "",
  url: "http://localhost:8188",
  allow_multiple: false,
};
