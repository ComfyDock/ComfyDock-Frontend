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
  type?: "text" | "select";
  children?: React.ReactNode;
  onChange?: (value: string) => void;
  tooltip?: string;
  options?: SelectOption[];
  defaultValue?: string;
  className?: string;
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
}: FormFieldComponentProps) => {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormItem className="grid grid-cols-4 items-center gap-4">
          <FormLabel className="text-right">
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
          <FormControl className="col-span-3">
            {children || (
              type === "select" ? (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    onChange?.(value);
                  }}
                  defaultValue={defaultValue || field.value}
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
              ) : (
                <Input
                  {...field}
                  type={type}
                  placeholder={placeholder}
                  defaultValue={defaultValue}
                  className={className}
                  onChange={(e) => {
                    field.onChange(e);
                    onChange?.(e.target.value);
                  }}
                  autoComplete="off"
                />
              )
            )}
          </FormControl>
          <FormMessage className="col-start-2 col-span-3" />
        </FormItem>
      )}
    />
  );
};

export default FormFieldComponent;
