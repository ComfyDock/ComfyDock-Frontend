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

interface SelectFormFieldProps {
  name: string;
  label: string;
  options: string[];
  placeholder: string;
  className?: string;
  onSelect?: () => void;
}

export const SelectFormField = ({
  name,
  label,
  options,
  placeholder,
  className = "grid grid-cols-4 items-center gap-4",
  onSelect,
}: SelectFormFieldProps) => {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-right">{label}</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            onOpenChange={onSelect}
          >
            <FormControl className="col-span-3">
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage className="col-start-2 col-span-3" />
        </FormItem>
      )}
    />
  );
};