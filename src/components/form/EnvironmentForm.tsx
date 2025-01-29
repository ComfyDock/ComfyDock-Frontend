import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { baseFormSchema, EnvironmentFormValues } from "@/types/Environment";
import {
  EnvironmentTypeDescriptions,
  EnvironmentTypeEnum,
  MountActionEnum,
} from "@/types/Environment";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FormFieldComponent from "@/components/form/FormFieldComponent";
import MountConfigRow from "@/components/form/MountConfigRow";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, FormLabel } from "@/components/ui/form";


interface EnvironmentFormProps {
  defaultValues: Partial<EnvironmentFormValues>;
  environmentTypeOptions: Record<string, string>;
  environmentTypeDescriptions: typeof EnvironmentTypeDescriptions;
  onSubmit: (values: EnvironmentFormValues) => Promise<void>;
  onCancel?: () => void;
  isLoading: boolean;
  title: string;
  submitButtonText?: string;
  children?: React.ReactNode;
}

export function EnvironmentForm({
  defaultValues,
  environmentTypeOptions,
  environmentTypeDescriptions,
  onSubmit,
  onCancel,
  isLoading,
  title,
  submitButtonText = "Create",
  children,
}: EnvironmentFormProps) {
  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(baseFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "mountConfig",
  });

  const handleMountConfigChange = () => {
    form.setValue("environmentType", EnvironmentTypeEnum.Custom);
  };

  return (
    <FormProvider {...form}>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            {isLoading ? "Processing..." : "Loading..."}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="text-lg font-semibold">{title}</h2>

          {/* Common Form Fields */}
          <FormFieldComponent name="name" label="Name" placeholder="" />
          <FormFieldComponent
            name="comfyUIPath"
            label="Path to ComfyUI"
            placeholder="/path/to/ComfyUI"
          />

          {/* Environment Type Selector */}
          <FormField
            control={form.control}
            name="environmentType"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select environment type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(environmentTypeOptions).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={label}>
                        <div className="flex flex-col">
                          <span className="font-medium">{label}</span>
                          <span className="text-xs text-muted-foreground">
                            {
                              environmentTypeDescriptions[
                                label as keyof typeof environmentTypeDescriptions
                              ]
                            }
                          </span>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            )}
          />

          {/* Custom Children */}
          {children}

          {/* Advanced Options */}
          <Accordion type="single" collapsible>
            <AccordionItem value="advanced-options">
              <AccordionTrigger>Advanced Options</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <FormFieldComponent
                  name="command"
                  label="Command"
                  placeholder="Additional command"
                />
                <FormFieldComponent
                  name="port"
                  label="Port"
                  placeholder="Port number"
                  type="number"
                />

                {/* Mount Config */}
                <div>
                  <FormLabel>Mount Config</FormLabel>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-40">Override</div>
                      <div className="w-full">Host Path</div>
                      <div className="w-full">Container Path</div>
                      <div className="w-full">Action</div>
                    </div>
                    {fields.map((field, index) => (
                      <MountConfigRow
                        key={field.id}
                        index={index}
                        remove={remove}
                        onActionChange={handleMountConfigChange}
                      />
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        append({
                          type: MountActionEnum.Mount,
                          container_path: "",
                          host_path: "",
                          read_only: false,
                          override: false,
                        });
                        handleMountConfigChange();
                      }}
                    >
                      Add Directory
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {submitButtonText}...
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
