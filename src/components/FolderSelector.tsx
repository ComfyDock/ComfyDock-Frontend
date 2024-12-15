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
import { ChevronDown, FolderIcon, Plus, Trash2, Edit2 } from "lucide-react";
import { Folder, FolderInput } from "@/types/UserSettings";
import { CreateFolderDialog } from "./dialogs/CreateFolderDialog";
import { CustomAlertDialog } from "./dialogs/CustomAlertDialog";
import { IconComponent } from "./utils/IconComponent";

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
  onAddFolder?: (folder: FolderInput) => void;
  onEditFolder?: (folder: Folder) => void;
  onDeleteFolder?: (folder: Folder | null) => void;
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
  const [folderDeleteOpen, setFolderDeleteOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  return (
    <div className="flex items-center space-x-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between w-[200px]">
            {selectedFolder?.icon && IconComponent(selectedFolder.icon) || IconComponent('FolderIcon')}
            {selectedFolder?.name}
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
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
                    {folder.name}
                    {folder.id !== "all" && folder.id !== "deleted" && showFolderButtons && (
                      <div className="ml-auto flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditFolder?.(folder);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFolderToDelete(folder);
                            setFolderDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
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
      {onDeleteFolder && (
        <CustomAlertDialog
          open={folderDeleteOpen}
          onOpenChange={setFolderDeleteOpen}
          title="Delete Folder"
          description={`Are you sure you want to delete ${folderToDelete?.name}? This cannot be undone.`}
          onAction={() => onDeleteFolder(folderToDelete)}
          onCancel={() => setFolderDeleteOpen(false)}
          cancelText="Cancel"
          actionText="Delete"
          variant="destructive"
        />
      )}
    </div>
  );
}
