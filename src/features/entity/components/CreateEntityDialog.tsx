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
import { FileCode, FileText, Plus, Trash2, Eye, EyeOff, HelpCircle } from "lucide-react";
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Plus className="h-6 w-6" />
            {t("Create New Entity")}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-auto">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium">{t("What is an Entity?")}</h4>
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
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Common Fields */}
          <div className="space-y-4">
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
              </div>
            </div>
          )}

          {/* Normal Mode */}
          {!expertMode && (
            <div className="space-y-4">
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
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
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
            {isSubmitting ? t("Creating...") : t("Create Entity")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}