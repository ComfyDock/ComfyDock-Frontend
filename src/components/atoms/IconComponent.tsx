import * as Icons from "lucide-react";
import React from 'react';

// Define a type for valid icon names
type IconName = keyof typeof Icons;

export const IconComponent = (icon: string) => {
  return React.createElement(Icons[icon as IconName] as React.ElementType, { className: "mr-2 h-4 w-4" });
}   