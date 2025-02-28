// import { EnvironmentTypeEnum, MountActionEnum, CombinedEnvironmentTypeEnum } from "@/components/utils/MountConfigUtils";
import { z } from "zod";

/**
 * Type of environment for which we build a mount config
 */
export enum EnvironmentTypeEnum {
  Auto = "Auto",
  Default = "Default",
  DefaultPlusWorkflows = "Default+Workflows",
  DefaultPlusCustomNodes = "Default+CustomNodes",
  DefaultPlusBoth = "Default+Both",
  Isolated = "Isolated",
  Custom = "Custom"
}

export const EnvironmentTypeDescriptions = {
  [EnvironmentTypeEnum.Auto]: 'Keeps the same mount configuration as the original environment, excluding copied directories.',
  [EnvironmentTypeEnum.Default]: 'Mounts models, output, and input directories from your local ComfyUI installation.',
  [EnvironmentTypeEnum.DefaultPlusWorkflows]: 'Same as default, but also mounts workflows from your local ComfyUI installation.',
  [EnvironmentTypeEnum.DefaultPlusCustomNodes]: 'Same as default, but also copies and installs custom nodes from your local ComfyUI installation.',
  [EnvironmentTypeEnum.DefaultPlusBoth]: 'Same as default, but also mounts workflows and copies custom nodes from your local ComfyUI installation.',
  [EnvironmentTypeEnum.Isolated]: 'Creates an isolated environment with no mounts.',
  [EnvironmentTypeEnum.Custom]: 'Allows for advanced configuration options.',
}

/**
 * The kind of mount/copy action we're supporting
 */
export enum MountActionEnum {
  Mount = "mount",
  Copy = "copy"
}

export const mountSchema = z.object({
  container_path: z.string(),
  host_path: z.string(),
  type: z.nativeEnum(MountActionEnum),
  read_only: z.boolean().default(false),
  override: z.boolean().default(false)
});

export type Mount = z.infer<typeof mountSchema>;

export type MountConfig = {
  mounts: Mount[];
};

// Base form schema that can be extended
export const baseFormSchema = z.object({
  name: z.string().min(1, { message: "Environment name is required" }).max(128, { message: "Environment name must be less than 128 characters" }),
  comfyUIPath: z.string().min(1, { message: "ComfyUI path is required" }),
  image: z.string()
    .min(1, { message: "Docker image is required" })
    .nullable()
    .superRefine((val, ctx) => {
      if (val === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Docker image is required"
        });
      }
    }),
  command: z.string().optional(),
  port: z.string().optional(),
  runtime: z.string().optional(),
  environmentType: z.nativeEnum(EnvironmentTypeEnum),
  mountConfig: z.array(mountSchema)
});

export type EnvironmentFormValues = z.infer<typeof baseFormSchema>;

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