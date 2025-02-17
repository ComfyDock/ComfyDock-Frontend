import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EnvironmentForm } from "@/components/form/EnvironmentForm";
import { useToast } from "@/hooks/use-toast";
import { Environment, EnvironmentInput, EnvironmentTypeEnum, EnvironmentTypeDescriptions } from "@/types/Environment";
import { UserSettings } from "@/types/UserSettings";
import { 
  useDuplicateFormDefaults,
  useEnvironmentDuplication
} from "@/hooks/environment-hooks";

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
    handleEnvironmentTypeChange
  } = useEnvironmentDuplication(formDefaults, environment, duplicateEnvironmentHandler, onOpenChange, toast);

  useEffect(() => {
    if (open) {
      console.log(`resetting form with defaults: ${JSON.stringify(formDefaults)}`)
      form.reset(formDefaults)
      console.log(form.getValues())
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
          environmentTypeOptions={EnvironmentTypeEnum}
          environmentTypeDescriptions={EnvironmentTypeDescriptions}
          handleEnvironmentTypeChange={handleEnvironmentTypeChange}
        />
      </DialogContent>
    </Dialog>
  );
}