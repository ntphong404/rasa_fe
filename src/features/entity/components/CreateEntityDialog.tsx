import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "react-i18next";
import { FileCode, FileText, Plus, Trash2, Eye, EyeOff, HelpCircle, Tag, Info } from "lucide-react";
import { entityService } from "../api/service";
import { Badge } from "@/components/ui/badge";

interface CreateEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntityCreated: () => void;
}

type EntityType = "regex" | "lookup" | "synonym";

export default function CreateEntityDialog({
  open,
  onOpenChange,
  onEntityCreated,
}: CreateEntityDialogProps) {
  const { t } = useTranslation();
  
  // Common fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  // Helper function to convert to lowercase and snake_case
  const toSnakeCase = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  };
  
  // Mode
  const [expertMode, setExpertMode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  // Expert mode
  const [yamlDefine, setYamlDefine] = useState("");
  const [yamlError, setYamlError] = useState("");
  
  // Normal mode
  const [entityType, setEntityType] = useState<EntityType>("regex");
  const [examples, setExamples] = useState<string[]>([""]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateTemplate = (type: EntityType) => {
    const template = `nlu:
  - ${type}: ${name || "entity_name"}
    examples: |
      - example1
      - example2`;
    setYamlDefine(template);
    setYamlError("");
  };

  const validateYAML = (yaml: string): boolean => {
    if (!yaml.trim()) {
      setYamlError("");
      return true;
    }

    try {
      // Basic YAML structure validation
      const lines = yaml.split("\n");
      
      // Check if starts with "nlu:"
      if (!lines[0].trim().startsWith("nlu:")) {
        setYamlError(t("YAML must start with 'nlu:'"));
        return false;
      }

      // Check if has entity type (regex, lookup, or synonym)
      const hasType = lines.some(line => 
        line.includes("regex:") || 
        line.includes("lookup:") || 
        line.includes("synonym:")
      );
      
      if (!hasType) {
        setYamlError(t("YAML must contain entity type (regex, lookup, or synonym)"));
        return false;
      }

      // Check if has examples
      const hasExamples = lines.some(line => line.includes("examples:"));
      if (!hasExamples) {
        setYamlError(t("YAML must contain 'examples:' field"));
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
    const examplesList = examples
      .filter(ex => ex.trim())
      .map(ex => `      - ${ex}`)
      .join("\n");
    
    return `nlu:
  - ${entityType}: ${name || "entity_name"}
    examples: |
${examplesList || "      - example1"}`;
  };

  const addExample = () => {
    setExamples([...examples, ""]);
  };

  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const updateExample = (index: number, value: string) => {
    const newExamples = [...examples];
    newExamples[index] = value;
    setExamples(newExamples);
  };

  const handleSubmit = async (emptyDefine: boolean = false) => {
    const sanitizedName = toSnakeCase(name);
    
    if (!sanitizedName) {
      alert(t("Please enter entity name"));
      return;
    }

    let finalDefine = "";
    
    if (!emptyDefine) {
      if (expertMode) {
        if (!validateYAML(yamlDefine)) {
          return;
        }
        finalDefine = yamlDefine;
      } else {
        finalDefine = generateYAMLFromForm();
      }
    }

    try {
      setIsSubmitting(true);
      await entityService.createEntity({
        name: sanitizedName,
        description: description.trim(),
        define: finalDefine,
      });
      
      // Reset form
      setName("");
      setDescription("");
      setYamlDefine("");
      setExamples([""]);
      setEntityType("regex");
      setExpertMode(false);
      
      onEntityCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating entity:", error);
      alert(t("Failed to create entity"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-3 pt-4 pb-3 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6 text-emerald-600" />
              {t("Create New Entity")}
            </DialogTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="mr-8">
                  <HelpCircle className="h-5 w-5 text-emerald-600" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Info className="h-4 w-4 text-emerald-600" />
                    {t("What is an Entity?")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("Entities are structured data that can be extracted from user input. There are three types:")}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                    <li><strong>regex:</strong> {t("Pattern-based matching (e.g., email, phone)")}</li>
                    <li><strong>lookup:</strong> {t("List-based matching (e.g., countries, cities)")}</li>
                    <li><strong>synonym:</strong> {t("Value mapping (e.g., 'credit card' → 'credit')")}</li>
                  </ul>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-3 py-3 pt-0">
          <div className="space-y-2">
            {/* Common Fields Card */}
            <div className="bg-white border rounded-lg p-3 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                <Tag className="h-4 w-4 text-emerald-600" />
                {t("Basic Information")}
              </h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="entity-name">{t("Entity Name")} *</Label>
                  <Input
                    id="entity-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={(e) => setName(toSnakeCase(e.target.value))}
                    placeholder={t("e.g., help, country, credit")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("Use lowercase and underscores (e.g., my_entity_name)")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity-desc">{t("Description")}</Label>
                  <Textarea
                    id="entity-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("Describe what this entity is for")}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Mode Switch */}
            <div className="bg-white border rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expertMode ? (
                    <FileCode className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-teal-600" />
                  )}
                  <Label htmlFor="mode-switch" className="cursor-pointer font-medium">
                    {expertMode ? t("Expert Mode") : t("Normal Mode")}
                  </Label>
                  <Badge variant="secondary" className="ml-2">
                    {expertMode ? "YAML" : "Form"}
                  </Badge>
                </div>
                <Switch
                  id="mode-switch"
                  checked={expertMode}
                  onCheckedChange={setExpertMode}
                />
              </div>
            </div>

            {/* Expert Mode */}
            {expertMode && (
              <div className="bg-white border rounded-lg p-3 shadow-sm space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FileCode className="h-4 w-4 text-emerald-600" />
                  {t("YAML Definition")}
                </h3>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateTemplate("regex")}
                    className="justify-start"
                  >
                    <Badge variant="secondary" className="mr-2">regex</Badge>
                    {t("Generate Template")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateTemplate("lookup")}
                    className="justify-start"
                  >
                    <Badge variant="secondary" className="mr-2">lookup</Badge>
                    {t("Generate Template")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateTemplate("synonym")}
                    className="justify-start"
                  >
                    <Badge variant="secondary" className="mr-2">synonym</Badge>
                    {t("Generate Template")}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yaml-define">{t("YAML Code")}</Label>
                  <Textarea
                    id="yaml-define"
                    value={yamlDefine}
                    onChange={(e) => {
                      setYamlDefine(e.target.value);
                      validateYAML(e.target.value);
                    }}
                    placeholder={t("Enter YAML definition")}
                    className="font-mono text-sm bg-slate-900 text-slate-100 border-slate-700"
                    rows={12}
                  />
                  {yamlError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      {yamlError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Normal Mode */}
            {!expertMode && (
              <div className="space-y-2">
                <div className="bg-white border rounded-lg p-3 shadow-sm space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FileText className="h-4 w-4 text-teal-600" />
                    {t("Entity Configuration")}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="entity-type">{t("Entity Type")} *</Label>
                    <Select value={entityType} onValueChange={(value) => setEntityType(value as EntityType)}>
                      <SelectTrigger id="entity-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regex">regex</SelectItem>
                        <SelectItem value="lookup">lookup</SelectItem>
                        <SelectItem value="synonym">synonym</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t("Examples")}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addExample}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("Add Example")}
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                      {examples.map((example, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={example}
                            onChange={(e) => updateExample(index, e.target.value)}
                            placeholder={`${t("Example")} ${index + 1}`}
                          />
                          {examples.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeExample(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white border rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold text-gray-700">{t("Preview")}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? (
                        <><EyeOff className="h-4 w-4 mr-1" /> {t("Hide")}</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-1" /> {t("Show")}</>
                      )}
                    </Button>
                  </div>
                  {showPreview && (
                    <div className="bg-slate-900 text-slate-100 rounded-lg p-4">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {generateYAMLFromForm()}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-3 py-3 border-t bg-gray-50">
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
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? t("Creating...") : t("Create Entity")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}