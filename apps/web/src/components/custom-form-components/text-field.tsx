import { InfoIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FieldDescription } from "../ui/field";
import { FormLabel } from "../ui/form";

interface TextFieldProps
  extends React.HTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  name: string;
  maxLength?: number;
  placeholder: string;
  value: string;
  helperText?: string;
  className?: string;
  infoTooltip?: string;
  inputType: "input" | "textarea";
  required?: boolean;
}

export function TextField({
  label,
  name,
  maxLength,
  placeholder,
  helperText,
  className = "",
  infoTooltip,
  value,
  required = true,
  inputType = "input",
  ...props
}: TextFieldProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-px">
          <FormLabel className="text-foreground text-xs capitalize sm:text-sm">
            {label}
            {/* {required ? <span className="text-destructive">*</span> : null} */}
          </FormLabel>

          {infoTooltip && (
            <Tooltip>
              <TooltipTrigger className="size-fit [&>svg]:size-3">
                <InfoIcon />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {infoTooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-1">
          {maxLength != null && (
            <span className="text-muted-foreground text-xs">
              {value?.length ?? 0}/{maxLength}
            </span>
          )}
        </div>
      </div>

      {inputType === "input" && (
        <Input
          className="w-full rounded border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1"
          id={name}
          inputMode="text"
          maxLength={maxLength}
          name={name}
          placeholder={placeholder}
          value={value}
          {...props}
        />
      )}

      {inputType === "textarea" && (
        <Textarea
          className="w-full rounded border border-border px-3 py-2 text-sm"
          id={name}
          inputMode="text"
          maxLength={maxLength}
          name={name}
          placeholder={placeholder}
          value={value}
          {...props}
        />
      )}
      {helperText && (
        <FieldDescription className="mt-1 text-xs">
          {helperText}
        </FieldDescription>
      )}
    </div>
  );
}
