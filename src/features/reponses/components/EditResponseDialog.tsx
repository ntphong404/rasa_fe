import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { FileCode, FileText, Edit, Eye, EyeOff, Plus, X } from "lucide-react";
import { responseService } from "../api/service";
import { IMyResponse } from "@/interfaces/response.interface";
import { ModuleHelpPopover } from "@/components/module-help-popover";
import { useChatbotStore } from "@/store/chatbot";
import { toast } from "sonner";

interface EditResponseDialogProps {
  response: IMyResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResponseUpdated: () => void;
}

export default function EditResponseDialog({
  response,
  open,
  onOpenChange,
  onResponseUpdated,
}: EditResponseDialogProps) {
  const { t } = useTranslation();
  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  
  // Common fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [label, setLabel] = useState("");
  
  // Validation errors
  const [nameError, setNameError] = useState("");
  
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
  interface TextVariant {
    id: string;
    text: string;
    hasCondition: boolean;
    conditionSlotName: string;
    conditionValue: string;
  }

  const makeVariant = (): TextVariant => ({
    id: Math.random().toString(36).slice(2),
    text: "",
    hasCondition: false,
    conditionSlotName: "",
    conditionValue: "",
  });

  const parseDefineToVariants = (define: string): TextVariant[] => {
    const variants: TextVariant[] = [];
    const lines = define.split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line === "- condition:") {
        const v = makeVariant();
        v.hasCondition = true;
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("- ")) {
          const inner = lines[i].trim();
          if (inner.startsWith("name:")) v.conditionSlotName = inner.replace("name:", "").trim();
          if (inner.startsWith("value:")) v.conditionValue = inner.replace("value:", "").replace(/"/g, "").trim();
          if (inner.startsWith("text:")) v.text = inner.replace("text:", "").replace(/"/g, "").trim();
          i++;
        }
        variants.push(v);
      } else if (line.startsWith("- text:")) {
        const v = makeVariant();
        v.text = line.replace("- text:", "").replace(/"/g, "").trim();
        variants.push(v);
        i++;
      } else {
        i++;
      }
    }
    return variants;
  };

  const [textVariants, setTextVariants] = useState<TextVariant[]>([makeVariant()]);
  const [variantErrors, setVariantErrors] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load response data when dialog opens
  useEffect(() => {
    if (response && open) {
      setName(response.name);
      setDescription(response.description || "");
      setLabel(response.label || "");
      setYamlDefine(response.define || "");
      
      // Try to extract text from YAML for normal mode
      if (response.define) {
        const parsed = parseDefineToVariants(response.define);
        if (parsed.length > 0) {
          setTextVariants(parsed);
        } else {
          setExpertMode(true);
        }
      }

      // Reset errors
      setNameError("");
      setVariantErrors([]);
      setYamlError("");
    }
  }, [response, open]);

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

  const validateVariants = (): boolean => {
    const errs: string[] = [];
    textVariants.forEach((v, i) => {
      if (!v.text.trim()) errs.push(`Variant ${i + 1}: text is required`);
      if (v.hasCondition && !v.conditionSlotName.trim()) errs.push(`Variant ${i + 1}: slot name required when condition is set`);
    });
    setVariantErrors(errs);
    return errs.length === 0;
  };

  const generateTemplate = () => {
    const utterName = name ? toUtterFormat(name) : "utter_default";
    const template = `${utterName}:\n- text: "Nhập phản hồi của bạn ở đây"`;
    setYamlDefine(template);
    setYamlError("");
  };

  const validateYAML = (yaml: string): boolean => {
    if (!yaml.trim()) {
      setYamlError(t("YAML definition is required"));
      return false;
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
    const lines: string[] = [`${utterName}:`];
    textVariants.forEach((v) => {
      const text = v.text.trim() || "...";
      if (v.hasCondition && v.conditionSlotName.trim()) {
        lines.push(`- condition:`);
        lines.push(`  - type: slot`);
        lines.push(`    name: ${v.conditionSlotName.trim()}`);
        if (v.conditionValue.trim()) {
          lines.push(`    value: "${v.conditionValue.trim()}"`);
        }
        lines.push(`  text: "${text}"`);
      } else {
        lines.push(`- text: "${text}"`);
      }
    });
    return lines.join("\n");
  };

  const handleSubmit = async () => {
    if (!response) return;
    
    // Validate name first
    if (!validateName(name)) {
      return;
    }
    
    const sanitizedName = toUtterFormat(name);

    let finalDefine = "";
    
    if (expertMode) {
      if (!validateYAML(yamlDefine)) {
        return;
      }
      finalDefine = yamlDefine;
    } else {
      // Validate response text in normal mode
      if (!validateVariants()) {
        return;
      }
      finalDefine = generateYAMLFromForm();
    }

    try {
      setIsSubmitting(true);
      await responseService.updateResponse(response._id, {
        _id: response._id,
        name: sanitizedName,
        botId: selectedBotId || response.botId || "global",
        label: label.trim() || undefined,
        description: description.trim(),
        define: finalDefine,
        roles: response.roles || [],
        likeCount: response.likeCount ?? 0,
        dislikeCount: response.dislikeCount ?? 0,
        deleted: !!response.deleted,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      });
      
      onResponseUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating response:", error);
      toast.error(t("Failed to update response"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!response) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Edit className="h-6 w-6" />
            {t("Edit Response")}
            <ModuleHelpPopover
              title={t("What is a Response?")}
              description={t("Responses are predefined messages that the bot sends to users. Each response must have a name starting with 'utter_' prefix.")}
              iconClassName="text-muted-foreground"
            />
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

            <div className="space-y-2">
              <Label htmlFor="response-label">{t("Label")}</Label>
              <Input
                id="response-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t("Organize by label/category (e.g., sheet name)")}
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
                    if (yamlError) validateYAML(e.target.value);
                  }}
                  onBlur={(e) => validateYAML(e.target.value)}
                  placeholder={t("Enter YAML definition")}
                  className={`font-mono text-sm ${yamlError ? "border-destructive" : ""}`}
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
              <div className="flex items-center justify-between">
                <Label>{t("Response Texts")} *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTextVariants((prev) => [...prev, makeVariant()])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("Add Variant")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("Rasa will randomly pick one variant to reply. Add a condition to reply based on slot value.")}
              </p>
              <div className="space-y-3">
                {textVariants.map((variant, idx) => (
                  <div key={variant.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {t("Variant")} {idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                          <Checkbox
                            checked={variant.hasCondition}
                            onCheckedChange={(c) =>
                              setTextVariants((prev) =>
                                prev.map((v) => v.id === variant.id ? { ...v, hasCondition: !!c } : v)
                              )
                            }
                          />
                          {t("Condition")}
                        </label>
                        {textVariants.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive"
                            onClick={() => setTextVariants((prev) => prev.filter((v) => v.id !== variant.id))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {variant.hasCondition && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("Slot name")}</Label>
                          <Input
                            value={variant.conditionSlotName}
                            onChange={(e) =>
                              setTextVariants((prev) =>
                                prev.map((v) => v.id === variant.id ? { ...v, conditionSlotName: e.target.value } : v)
                              )
                            }
                            placeholder="city_slot"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("Slot value")}</Label>
                          <Input
                            value={variant.conditionValue}
                            onChange={(e) =>
                              setTextVariants((prev) =>
                                prev.map((v) => v.id === variant.id ? { ...v, conditionValue: e.target.value } : v)
                              )
                            }
                            placeholder="Hà Nội"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    )}
                    <Textarea
                      value={variant.text}
                      onChange={(e) =>
                        setTextVariants((prev) =>
                          prev.map((v) => v.id === variant.id ? { ...v, text: e.target.value } : v)
                        )
                      }
                      placeholder={t("Response text for this variant")}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
              {variantErrors.length > 0 && (
                <div className="space-y-1">
                  {variantErrors.map((e, i) => (
                    <p key={i} className="text-sm text-destructive">{e}</p>
                  ))}
                </div>
              )}
              {showPreview && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">{t("YAML Preview")}</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-xs font-mono whitespace-pre-wrap">{generateYAMLFromForm()}</pre>
                  </div>
                </div>
              )}
              {!showPreview && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-1" />{t("Show YAML Preview")}
                </Button>
              )}
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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? t("Updating...") : t("Update Response")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}