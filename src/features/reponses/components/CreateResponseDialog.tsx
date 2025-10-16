import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "react-i18next";
import { FileCode, FileText, Plus, Eye, EyeOff, HelpCircle } from "lucide-react";
import { responseService } from "../api/service";

interface CreateResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResponseCreated: () => void;
}

export default function CreateResponseDialog({
  open,
  onOpenChange,
  onResponseCreated,
}: CreateResponseDialogProps) {
  const { t } = useTranslation();
  
  // Common fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  // Validation errors
  const [nameError, setNameError] = useState("");
  const [responseTextError, setResponseTextError] = useState("");
  
  // Helper function to convert to utter_ format
  const toUtterFormat = (str: string): string => {
    const snakeCase = str
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    
    // Add utter_ prefix if not present
    return snakeCase.startsWith('utter_') ? snakeCase : `utter_${snakeCase}`;
  };
  
  // Mode
  const [expertMode, setExpertMode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  // Expert mode
  const [yamlDefine, setYamlDefine] = useState("");
  const [yamlError, setYamlError] = useState("");
  
  // Normal mode
  const [responseText, setResponseText] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateName = (value: string): boolean => {
    if (!value.trim()) {
      setNameError(t("Response name is required"));
      return false;
    }
    
    const formatted = toUtterFormat(value);
    if (formatted === "utter_") {
      setNameError(t("Please enter a valid response name"));
      return false;
    }
    
    if (formatted.length < 8) { // "utter_" + at least 1 char
      setNameError(t("Response name is too short"));
      return false;
    }
    
    setNameError("");
    return true;
  };

  const validateResponseText = (value: string): boolean => {
    if (!value.trim()) {
      setResponseTextError(t("Response text is required"));
      return false;
    }
    
    if (value.trim().length < 3) {
      setResponseTextError(t("Response text is too short (minimum 3 characters)"));
      return false;
    }
    
    setResponseTextError("");
    return true;
  };

  const generateTemplate = () => {
    const utterName = name ? toUtterFormat(name) : "utter_default";
    const template = `  ${utterName}:\n    - text: "Nhập phản hồi của bạn ở đây"`;
    setYamlDefine(template);
    setYamlError("");
  };

  const validateYAML = (yaml: string): boolean => {
    if (!yaml.trim()) {
      setYamlError("");
      return true;
    }

    try {
      const lines = yaml.split("\n");
      
      // Check if has utter_ name
      const hasUtter = lines.some(line => line.trim().match(/^utter_\w+:/));
      if (!hasUtter) {
        setYamlError(t("YAML must contain utter name (e.g., utter_default:)"));
        return false;
      }

      // Check if has text field
      const hasText = lines.some(line => line.includes("- text:") || line.includes("-text:"));
      if (!hasText) {
        setYamlError(t("YAML must contain '- text:' field"));
        return false;
      }

      setYamlError("");
      return true;
    } catch (error) {
      console.error("YAML validation error:", error);
      setYamlError(t("Invalid YAML syntax"));
      return false;
    }
  };

  const generateYAMLFromForm = (): string => {
    const utterName = name ? toUtterFormat(name) : "utter_default";
    const text = responseText.trim() || "Nhập phản hồi của bạn ở đây";
    
    return `  ${utterName}:\n    - text: "${text}"`;
  };

  const handleSubmit = async (emptyDefine: boolean = false) => {
    // Validate name first
    if (!validateName(name)) {
      return;
    }
    
    const sanitizedName = toUtterFormat(name);

    let finalDefine = "";
    
    if (!emptyDefine) {
      if (expertMode) {
        if (!validateYAML(yamlDefine)) {
          return;
        }
        finalDefine = yamlDefine;
      } else {
        // Validate response text in normal mode
        if (!validateResponseText(responseText)) {
          return;
        }
        finalDefine = generateYAMLFromForm();
      }
    }

    try {
      setIsSubmitting(true);
      await responseService.createResponse({
        name: sanitizedName,
        description: description.trim(),
        define: finalDefine,
      });
      
      // Reset form
      setName("");
      setDescription("");
      setYamlDefine("");
      setResponseText("");
      setExpertMode(false);
      setNameError("");
      setResponseTextError("");
      
      onResponseCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating response:", error);
      alert(t("Failed to create response"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Plus className="h-6 w-6" />
            {t("Create New Response")}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-auto">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium">{t("What is a Response?")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("Responses are predefined messages that the bot sends to users. Each response must have a name starting with 'utter_' prefix.")}
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <strong>{t("Format:")}</strong>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs">
{`  utter_default:
    - text: "Your message"`}
                    </pre>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Common Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response-name">{t("Response Name")} *</Label>
              <Input
                id="response-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) validateName(e.target.value);
                }}
                onBlur={(e) => {
                  const formatted = toUtterFormat(e.target.value);
                  setName(formatted);
                  validateName(formatted);
                }}
                placeholder={t("e.g., greet, goodbye, default")}
                className={nameError ? "border-destructive" : ""}
              />
              {nameError ? (
                <p className="text-sm text-destructive">{nameError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("Will be converted to format: utter_name (e.g., utter_greet)")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="response-desc">{t("Description")}</Label>
              <Textarea
                id="response-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("Describe what this response is for")}
                rows={2}
              />
            </div>
          </div>

          {/* Mode Switch */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {expertMode ? (
                <FileCode className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              <Label htmlFor="mode-switch" className="cursor-pointer">
                {expertMode ? t("Expert Mode") : t("Normal Mode")}
              </Label>
            </div>
            <Switch
              id="mode-switch"
              checked={expertMode}
              onCheckedChange={setExpertMode}
            />
          </div>

          {/* Expert Mode */}
          {expertMode && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateTemplate}
                  className="justify-start"
                >
                  {t("Generate Template")}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yaml-define">{t("YAML Definition")}</Label>
                <Textarea
                  id="yaml-define"
                  value={yamlDefine}
                  onChange={(e) => {
                    setYamlDefine(e.target.value);
                    validateYAML(e.target.value);
                  }}
                  placeholder={t("Enter YAML definition")}
                  className="font-mono text-sm"
                  rows={12}
                />
                {yamlError && (
                  <p className="text-sm text-destructive">{yamlError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("Format: utter_name:\\n    - text: \"Your message\"")}
                </p>
              </div>
            </div>
          )}

          {/* Normal Mode */}
          {!expertMode && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="response-text">{t("Response Text")} *</Label>
                <Textarea
                  id="response-text"
                  value={responseText}
                  onChange={(e) => {
                    setResponseText(e.target.value);
                    if (responseTextError) validateResponseText(e.target.value);
                  }}
                  onBlur={(e) => validateResponseText(e.target.value)}
                  placeholder={t("Enter the response message that bot will send")}
                  rows={6}
                  className={responseTextError ? "border-destructive" : ""}
                />
                {responseTextError ? (
                  <p className="text-sm text-destructive">{responseTextError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("This is the message that will be sent to users")}
                  </p>
                )}
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("Preview")}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {showPreview && (
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {generateYAMLFromForm()}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("Cancel")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            {t("Empty Define")}
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? t("Creating...") : t("Create Response")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}