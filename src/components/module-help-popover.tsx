import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ModuleHelpPopoverProps {
  title: string;
  description: string;
  iconClassName?: string;
}

export function ModuleHelpPopover({ title, description, iconClassName = "text-blue-600" }: ModuleHelpPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="ml-auto" title={title}>
          <HelpCircle className={`h-5 w-5 ${iconClassName}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
