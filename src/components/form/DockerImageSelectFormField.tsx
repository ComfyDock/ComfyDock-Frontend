import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";

interface DockerImageSelectFormFieldProps {
  name: string;
  label: string;
  placeholder: string;
  className?: string;
  /** Called when the user clicks the field and wants to open the custom dialog */
  onOpenDialog: () => void;
}

/**
 * This field looks like a Select but never actually shows a dropdown.
 * Instead, on click it opens a DockerImageSelector dialog. 
 * Once the user selects an image, you can set the form value from the parent component,
 * causing the trigger to show the selected tag.
 */
export function DockerImageSelectFormField({
  name,
  label,
  placeholder,
  className = "grid grid-cols-4 items-center gap-4",
  onOpenDialog,
}: DockerImageSelectFormFieldProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-right">{label}</FormLabel>
          <Select
            defaultValue={field.value}
            onValueChange={field.onChange}
            open={false}
            onOpenChange={(open) => {
              if (open) {
                onOpenDialog();
              }
            }}
          >
            <FormControl className="col-span-3">
              <SelectTrigger>
                <SelectValue defaultValue={field.value}>
                  {field.value || placeholder}
                </SelectValue>
              </SelectTrigger>
            </FormControl>

            {/* We don't actually need items, but you can 
                provide a single fallback item if you'd like */}
            <SelectContent>
              <SelectItem value={field.value || "placeholder"}>
                {field.value || "placeholder"}
              </SelectItem>
            </SelectContent>
          </Select>
          <FormMessage className="col-start-2 col-span-3" />
        </FormItem>
      )}
    />
  );
}
