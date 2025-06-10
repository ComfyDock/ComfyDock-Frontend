// import { EnvironmentTypeEnum, MountActionEnum, CombinedEnvironmentTypeEnum } from "@/components/utils/MountConfigUtils";
// import { z } from "zod";

// /**
//  * Type of environment for which we build a mount config
//  */
// export enum EnvironmentTypeEnum {
//   Auto = "Auto",
//   Default = "Default",
//   DefaultPlusWorkflows = "Default+Workflows",
//   DefaultPlusCustomNodes = "Default+CustomNodes",
//   DefaultPlusBoth = "Default+Both",
//   Isolated = "Isolated",
//   Custom = "Custom"
// }

// export const EnvironmentTypeDescriptions = {
//   [EnvironmentTypeEnum.Auto]: 'Keeps the same mount configuration as the original environment, excluding copied directories.',
//   [EnvironmentTypeEnum.Default]: 'Mounts models, output, and input directories from your local ComfyUI installation.',
//   [EnvironmentTypeEnum.DefaultPlusWorkflows]: 'Same as default, but also mounts workflows from your local ComfyUI installation.',
//   [EnvironmentTypeEnum.DefaultPlusCustomNodes]: 'Same as default, but also copies and installs custom nodes from your local ComfyUI installation.',
//   [EnvironmentTypeEnum.DefaultPlusBoth]: 'Same as default, but also mounts workflows and copies custom nodes from your local ComfyUI installation.',
//   [EnvironmentTypeEnum.Isolated]: 'Creates an isolated environment with no mounts.',
//   [EnvironmentTypeEnum.Custom]: 'Allows for advanced configuration options.',
// }

// /**
//  * The kind of mount/copy action we're supporting
//  */
// export enum MountActionEnum {
//   Mount = "mount",
//   Copy = "copy"
// }

// export const mountSchema = z.object({
//   container_path: z.string(),
//   host_path: z.string(),
//   type: z.nativeEnum(MountActionEnum),
//   read_only: z.boolean().default(false),
//   override: z.boolean().default(false)
// });

// export type Mount = z.infer<typeof mountSchema>;

// export type MountConfig = {
//   mounts: Mount[];
// };

// // Define default values for options
// export const DEFAULT_OPTIONS = {
//   port: "8188",
//   runtime: "nvidia",
//   url: "http://localhost:8188",
// } as const;

// // First, define the shared options fields schema
// const optionsSchema = z.object({
//   mountConfig: z.object({
//     mounts: z.array(mountSchema)
//   }).optional(),
//   port: z.string().optional().default(DEFAULT_OPTIONS.port),
//   runtime: z.string().optional().default(DEFAULT_OPTIONS.runtime),
//   url: z.string().optional().default(DEFAULT_OPTIONS.url),
//   entrypoint: z.string().optional(),
//   environmentVariables: z.string().optional(),
// });

// // Base form schema that matches EnvironmentInput structure
// export const baseFormSchema = z.object({
//   // Direct fields that map to EnvironmentInput
//   name: z.string()
//     .min(1, { message: "Environment name is required" })
//     .max(128, { message: "Environment name must be less than 128 characters" }),
//   image: z.string()
//     .min(1, { message: "Docker image is required" })
//     .nullable()
//     .superRefine((val, ctx) => {
//       if (val === null) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: "Docker image is required"
//         });
//       }
//     }),
//   command: z.string().optional(),
//   comfyUIPath: z.string().min(1, { message: "ComfyUI path is required" }),
//   folderIds: z.array(z.string()).optional(),

//   // Fields that will be transformed into options
//   ...optionsSchema.shape,
//   environmentType: z.nativeEnum(EnvironmentTypeEnum),
// });

// export type EnvironmentFormValues = z.infer<typeof baseFormSchema>;

// // Helper function to transform form values to EnvironmentInput
// export const transformFormToEnvironmentInput = (values: EnvironmentFormValues): EnvironmentInput => {
//   const { 
//     name, 
//     image, 
//     command, 
//     comfyUIPath,
//     folderIds,
//     // Extract fields that should go into options
//     port,
//     runtime,
//     mountConfig,
//     url,
//     entrypoint,
//     environmentVariables,
//     // Remove fields that shouldn't be in the final input
//     environmentType,
//     ...rest 
//   } = values;

//   return {
//     name,
//     image: image || "",
//     command,
//     comfyui_path: comfyUIPath,
//     folderIds,
//     options: {
//       port,
//       runtime,
//       mountConfig,
//       url,
//       entrypoint,
//       environmentVariables,
//     },
//   };
// };

// export type Options = {
//   mount_config?: MountConfig;
//   [key: string]: string | Options | MountConfig | undefined; // Include MountConfig in the index signature
// };

// export type EnvironmentInput = {
//   name: string;
//   image: string;
//   command?: string;
//   comfyui_path?: string;
//   options?: Options;
//   folderIds?: string[];
// };

// export type Environment = {
//   name: string;
//   image: string;
//   container_name?: string;
//   id?: string;
//   status?: string;
//   command?: string;
//   duplicate?: boolean;
//   comfyui_path?: string;
//   options?: Options;
//   metadata?: Options;
//   folderIds?: string[];
// };

// export type EnvironmentUpdate = {
//   name?: string;
//   options?: Options;
//   folderIds?: string[];
// };


// Environment.ts
import { z } from "zod";
import { DEFAULT_USER_SETTINGS, UserSettings } from "@/types/UserSettings";
import { getDefaultMountConfigsForEnvType, parseExistingMountConfig } from "@/components/utils/MountConfigUtils";

const DEFAULT_COMFYUI_PATH = import.meta.env.VITE_DEFAULT_COMFYUI_PATH;

/* ------------------------------------------------------------------ *
 *  ENUMS & CONSTANTS
 * ------------------------------------------------------------------ */
export enum EnvironmentTypeEnum {
  Auto                = "Auto",
  Default             = "Default",
  DefaultPlusWorkflows= "Default+Workflows",
  DefaultPlusCustom   = "Default+CustomNodes",
  DefaultPlusBoth     = "Default+Both",
  Isolated            = "Isolated",
  Custom              = "Custom",
}

export const EnvironmentTypeDescriptions: Record<EnvironmentTypeEnum, string> = {
  [EnvironmentTypeEnum.Auto]               : "Keeps the same mount configuration as the original environment, excluding copied directories.",
  [EnvironmentTypeEnum.Default]            : "Mounts models, output, and input directories from your local ComfyUI installation.",
  [EnvironmentTypeEnum.DefaultPlusWorkflows]: "Same as default, but also mounts workflows from your local ComfyUI installation.",
  [EnvironmentTypeEnum.DefaultPlusCustom]  : "Same as default, but also copies and installs custom nodes from your local ComfyUI installation.",
  [EnvironmentTypeEnum.DefaultPlusBoth]    : "Same as default, but also mounts workflows and copies custom nodes from your local ComfyUI installation.",
  [EnvironmentTypeEnum.Isolated]           : "Creates an isolated environment with no mounts.",
  [EnvironmentTypeEnum.Custom]             : "Allows for advanced configuration options.",
};

export enum MountActionEnum { Mount = "mount", Copy = "copy" }

/* ------------------------------------------------------------------ *
 *  MOUNT(S)  (schema + type)
 * ------------------------------------------------------------------ */
export const mountSchema = z.object({
  container_path: z.string(),
  host_path     : z.string(),
  type          : z.nativeEnum(MountActionEnum),
  read_only     : z.boolean().default(false),
  override      : z.boolean().default(false),
});
export type Mount       = z.infer<typeof mountSchema>;
export type MountConfig = { mounts: Mount[] };

const mountConfigSchema = z.object({ mounts: z.array(mountSchema) });

/* ------------------------------------------------------------------ *
 *  SHARED OPTION FIELDS
 * ------------------------------------------------------------------ */
export const DEFAULT_OPTIONS = {
  ...DEFAULT_USER_SETTINGS,
  port   : String(DEFAULT_USER_SETTINGS.port),
} as const;

const optionsSchema = z.object({
  mount_config         : mountConfigSchema.optional(),
  port                : z.string().default(DEFAULT_OPTIONS.port).optional(),
  runtime             : z.string().default(DEFAULT_OPTIONS.runtime).optional(),
  url                 : z.string().default(DEFAULT_OPTIONS.url).optional(),
  entrypoint          : z.string().optional(),
  environment_variables: z.string().optional(),
});
export type Options = z.infer<typeof optionsSchema>;   // <- DRY: no manual interface

/* ------------------------------------------------------------------ *
 *  METADATA
 * ------------------------------------------------------------------ */
export const metadataSchema = z.object({
  base_image: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional(),
});
export type Metadata = z.infer<typeof metadataSchema>;

/* ------------------------------------------------------------------ *
 *  BASE ENV  (everything everyone shares)
 * ------------------------------------------------------------------ */
export const envCoreSchema = z.object({
  name        : z.string().min(1).max(128),
  image       : z.string().min(1),
  command     : z.string().optional(),
  comfyui_path: z.string().min(1),
  folderIds   : z.array(z.string()).optional(),
  ...optionsSchema.shape,
  environment_type: z.nativeEnum(EnvironmentTypeEnum),
});
export type EnvironmentCore = z.infer<typeof envCoreSchema>;

/* ------------------------------------------------------------------ *
 *  SPECIFIC USE-CASES  (input, stored, update)
 * ------------------------------------------------------------------ */
// 1. form values (1-1 with fields the UI knows about)
export type EnvironmentFormValues = EnvironmentCore;

// 2. what the backend expects – snake_case keys, options nested
export type EnvironmentInput = Omit<
  EnvironmentCore,
  keyof typeof optionsSchema.shape | "environment_type"
> & {
  options?: Options;
};

// Transform helper UI --> API shape
export const formToInput = (v: EnvironmentFormValues): EnvironmentInput => {
  const {
    port, runtime, mount_config, url, entrypoint, environment_variables,
    environment_type: _discard,  // not sent to backend
    ...rest
  } = v;

  return {
    ...rest,
    comfyui_path: v.comfyui_path,
    options: { port, runtime, mount_config, url, entrypoint, environment_variables },
  };  
};

// 3. what the API returns / you list in the UI
export type Environment = EnvironmentInput & {
  id?           : string;
  status?       : string;
  container_name?: string;
  duplicate?    : boolean;
  metadata?     : Metadata;
};

// 4. PATCH / update payload
export type EnvironmentUpdate = Partial<EnvironmentInput>;

/* ------------------------------------------------------------------ *
 *  FORM DEFAULTS GENERATOR
 * ------------------------------------------------------------------ */
export const createFormDefaults = (
  options: {
    userSettings?: UserSettings;
    environment?: Environment;
  } = {}
): EnvironmentFormValues => {
  const { userSettings, environment } = options;

  // Helper to get default value with priority
  const getDefaultValue = <T>(
    field: keyof UserSettings,
    defaultOptions: Record<string, T>,
    defaultOptionsField?: string
  ): T | undefined => {
    // Try environment first if available
    if (environment) {
      // Check direct fields
      if (field in environment) {
        const value = environment[field as keyof Environment];
        if (value !== undefined && value !== "") {
          return value as T;
        }
      }
      // Check in environment.options
      if (environment.options?.[field as keyof typeof environment.options]) {
        const value = environment.options[field as keyof typeof environment.options];
        if (value !== undefined && value !== "") {
          return value as T;
        }
      }
    }

    // Then try userSettings
    if (userSettings && field in userSettings) {
      const value = userSettings[field];
      if (value !== undefined && value !== "") {
        return value as T;
      }
    }
    
    // Then try DEFAULT_OPTIONS
    const optionsField = defaultOptionsField || field;
    if (optionsField in defaultOptions) {
      return defaultOptions[optionsField];
    }
    
    // Finally return undefined
    return undefined;
  };

  // Get existing mounts if environment is provided
  const existingMounts = environment 
    ? parseExistingMountConfig(
        environment.options?.["mount_config"],
        environment.comfyui_path || "",
      )
    : undefined;

  return {
    // Core fields
    name: environment ? `${environment.name}-copy` : "",
    image: environment 
      ? (environment.metadata?.["base_image"] as string) ?? environment.image ?? ""
      : "",
    comfyui_path: getDefaultValue("comfyui_path", DEFAULT_OPTIONS) as string || DEFAULT_COMFYUI_PATH || "",
    environment_type: environment ? EnvironmentTypeEnum.Auto : EnvironmentTypeEnum.Default,
    command: getDefaultValue("command", DEFAULT_OPTIONS) as string || "",
    folderIds: [],

    // Options fields
    port: String(getDefaultValue("port", DEFAULT_OPTIONS) || DEFAULT_OPTIONS.port),
    runtime: getDefaultValue("runtime", DEFAULT_OPTIONS) as string || "",
    url: getDefaultValue("url", DEFAULT_OPTIONS) as string || 
         "http://localhost:" + String(getDefaultValue("port", DEFAULT_OPTIONS) || DEFAULT_OPTIONS.port),
    mount_config: {
      mounts: existingMounts || getDefaultMountConfigsForEnvType(
        EnvironmentTypeEnum.Default,
        getDefaultValue("comfyui_path", DEFAULT_OPTIONS) as string || DEFAULT_COMFYUI_PATH || "",
      ) as Mount[],
    },
    entrypoint: getDefaultValue("entrypoint", DEFAULT_OPTIONS) as string || "",
    environment_variables: getDefaultValue("environment_variables", DEFAULT_OPTIONS) as string || "",
  };
};