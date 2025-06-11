
import {
  SelectItem,
} from "@/components/ui/select";
import React from "react";

// Custom styled SelectItem component
const StyledSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectItem>,
  React.ComponentPropsWithoutRef<typeof SelectItem>
>(({ className, ...props }, ref) => (
  <SelectItem
    ref={ref}
    className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
    {...props}
  />
));
StyledSelectItem.displayName = "StyledSelectItem";

export default StyledSelectItem;