import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ChevronDown, Plus, Settings } from "lucide-react";
import { Folder, FolderInput } from "@/types/UserSettings";
import { CreateFolderDialog } from "./dialogs/CreateFolderDialog";
import { IconComponent } from "./atoms/IconComponent";
import { truncateText } from "@/utils/stringUtils";
import { FolderEditDialog } from "./dialogs/FolderEditDialog";

export const DEFAULT_FOLDERS: Folder[] = [
  {
    id: "all",
    name: "All Environments",
    icon: "FolderIcon",
  },
  {
    id: "deleted",
    name: "Recently Deleted",
    icon: "Trash2",
  },
];

interface FolderSelectorProps {
  folders: Folder[];
  selectedFolder: Folder | null;
  searchEnabled?: boolean;
  showDefaultFolders?: boolean;
  showFolderButtons?: boolean;
  onSelectFolder: (folder: Folder) => void | null;
  onAddFolder?: (folder: FolderInput) => Promise<void>;
  onEditFolder?: (folder: Folder) => Promise<void>;
  onDeleteFolder?: (folder: Folder | null) => Promise<void>;
}

export function FolderSelector({
  folders,
  selectedFolder,
  searchEnabled = true,
  showDefaultFolders = true,
  showFolderButtons = true,
  onSelectFolder,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
}: FolderSelectorProps) {
  const [open, setOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  const [folderEditOpen, setFolderEditOpen] = useState(false);

  return (
    <div className="flex items-center space-x-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between w-[250px] ">
            {(selectedFolder?.icon && IconComponent(selectedFolder.icon)) ||
              IconComponent("FolderIcon")}
            {truncateText(selectedFolder?.name || "", 20)}
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="min-w-[200px] p-0">
          <Command>
            {searchEnabled && <CommandInput placeholder="Search folders..." />}
            <CommandEmpty>No folder found.</CommandEmpty>
            <CommandList>
              {showDefaultFolders && (
                <CommandGroup>
                  {DEFAULT_FOLDERS.map((folder) => (
                    <CommandItem
                      key={folder.id}
                      onSelect={() => {
                        onSelectFolder(folder);
                        setOpen(false);
                      }}
                    >
                      {folder.icon && IconComponent(folder.icon)
                        ? IconComponent(folder.icon)
                        : IconComponent("FolderIcon")}
                      {folder.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {folders.length > 0 && showDefaultFolders && <CommandSeparator />}
              <CommandGroup>
                {folders.map((folder) => (
                  <CommandItem
                    key={folder.id}
                    onSelect={() => {
                      onSelectFolder(folder);
                      setOpen(false);
                    }}
                  >
                    {folder.icon && IconComponent(folder.icon)
                      ? IconComponent(folder.icon)
                      : IconComponent("FolderIcon")}
                    <span style={{ wordWrap: "break-word", maxWidth: "165px" }}>
                      {folder.name}
                    </span>
                    {folder.id !== "all" &&
                      folder.id !== "deleted" &&
                      showFolderButtons && (
                        <div className="ml-auto flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderToEdit(folder);
                              setFolderEditOpen(true);
                            }}
                            className="h-5"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {onAddFolder && (
        <CreateFolderDialog onConfirm={onAddFolder}>
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </CreateFolderDialog>
      )}
      {showFolderButtons && folderToEdit && (
        <FolderEditDialog
          folder={folderToEdit}
          open={folderEditOpen}
          onOpenChange={setFolderEditOpen}
          onUpdate={onEditFolder}
          onDelete={onDeleteFolder}
        />
      )}
    </div>
  );
}
