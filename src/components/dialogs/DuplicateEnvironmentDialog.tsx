import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EnvironmentForm } from "@/components/form/EnvironmentForm";
import { useToast } from "@/hooks/use-toast";
import { Environment, EnvironmentInput } from "@/types/Environment";
import { UserSettings } from "@/types/UserSettings";
import { SelectFormField } from "../form/SelectFormField";
import FormFieldComponent from "../form/FormFieldComponent";
import { 
  useDuplicateFormDefaults,
  useEnvironmentDuplication
} from "@/hooks/environment-hooks";
import { CombinedEnvironmentTypeEnum, EnvironmentTypeDescriptions } from "@/types/Environment";
import { parseExistingMountConfig } from "@/components/utils/MountConfigUtils";

interface DuplicateEnvironmentDialogProps {
  environment: Environment;
  userSettings?: UserSettings;
  duplicateEnvironmentHandler: (id: string, environment: EnvironmentInput) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DuplicateEnvironmentDialog({
  environment,
  userSettings,
  duplicateEnvironmentHandler,
  open,
  onOpenChange,
}: DuplicateEnvironmentDialogProps) {
  const { toast } = useToast();
  const formDefaults = useDuplicateFormDefaults(environment, userSettings);
  
  const {
    form,
    isLoading,
    handleSubmit,
    createEnvironment,
    handleEnvironmentTypeChange
  } = useEnvironmentDuplication(formDefaults, environment, duplicateEnvironmentHandler, toast);

  useEffect(() => {
    if (open) {
      form.reset(formDefaults)
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] min-w-[600px] overflow-y-auto dialog-content">
        <DialogHeader>
          <DialogTitle>Duplicate Environment</DialogTitle>
        </DialogHeader>
        <EnvironmentForm
          form={form}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitButtonText="Duplicate"
          environmentTypeOptions={CombinedEnvironmentTypeEnum}
          environmentTypeDescriptions={EnvironmentTypeDescriptions}
          handleEnvironmentTypeChange={handleEnvironmentTypeChange}
        />
      </DialogContent>
    </Dialog>
  );
}