import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormContext } from "react-hook-form";
import React from "react";
import StyledSelectItem from "@/components/atoms/StyledSelectItem";

interface SelectOption {
  value: string;
  label: string;
}

interface FormFieldComponentProps {
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "select" | "number" | "checkbox";
  children?: React.ReactNode;
  onChange?: (value: string | number | boolean) => void;
  tooltip?: string;
  options?: SelectOption[];
  defaultValue?: string | number | boolean;
  className?: string;
  layout?: "grid" | "stack";
}

const FormFieldComponent = ({
  name,
  label,
  placeholder,
  type = "text",
  onChange,
  children,
  tooltip,
  options = [],
  defaultValue,
  className,
  layout = "grid",
}: FormFieldComponentProps) => {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormItem className={layout === "grid" ? "grid grid-cols-4 items-center gap-4" : ""}>
          <FormLabel className={layout === "grid" ? "text-right" : ""}>
            {tooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{label}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              label
            )}
          </FormLabel>
          <FormControl className={layout === "grid" ? "col-span-3" : ""}>
            {children || (
              type === "select" ? (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    onChange?.(value);
                  }}
                >
                  <SelectTrigger className={className}>
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <StyledSelectItem key={option.value} value={option.value}>
                        {option.label}
                      </StyledSelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : type === "checkbox" ? (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked: boolean) => {
                    field.onChange(checked);
                    onChange?.(checked);
                  }}
                  className={className}
                />
              ) : (
                <Input
                  {...field}
                  type={type}
                  placeholder={placeholder}
                  className={className}
                  onChange={(e) => {
                    const value = type === "number" ? Number(e.target.value) : e.target.value;
                    field.onChange(value);
                    onChange?.(value);
                  }}
                  autoComplete="off"
                />
              )
            )}
          </FormControl>
          <FormMessage className={layout === "grid" ? "col-start-2 col-span-3" : ""} />
        </FormItem>
      )}
    />
  );
};

export default FormFieldComponent;
