import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, FileCode, Search, X, AlertCircle, Eye, Plus, Code2, FormInput } from "lucide-react";
import { intentService } from "../api/service";
import { IEntity } from "@/interfaces/entity.interface";
import { toast } from "sonner";

export function EditIntentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get intent data from navigation state
  const intentData = location.state?.intent;

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [yamlDefine, setYamlDefine] = useState("");
  const [selectedEntities, setSelectedEntities] = useState<IEntity[]>([]);

  // Entity search
  const [entitySearchOpen, setEntitySearchOpen] = useState(false);
  const [entitySearchQuery, setEntitySearchQuery] = useState("");
  const [entitySearchResults, setEntitySearchResults] = useState<IEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Validation
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mode toggle
  const [isExpertMode, setIsExpertMode] = useState(false);
  
  // Normal mode examples
  const [examples, setExamples] = useState<string[]>(["", ""]);

  // Helper function to convert to snake_case
  const toSnakeCase = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  // Parse YAML to extract examples
  const parseYAMLExamples = (yaml: string): string[] => {
    try {
      const lines = yaml.split("\n");
      const exampleLines: string[] = [];
      let inExamples = false;

      for (const line of lines) {
        if (line.includes("examples:")) {
          inExamples = true;
          continue;
        }
        if (inExamples && line.trim().startsWith("-")) {
          const example = line.trim().substring(1).trim();
          if (example) {
            exampleLines.push(example);
          }
        } else if (inExamples && !line.startsWith(" ") && line.trim()) {
          break;
        }
      }

      return exampleLines.length > 0 ? exampleLines : ["", ""];
    } catch (error) {
      console.error("Error parsing YAML examples:", error);
      return ["", ""];
    }
  };

  // Load intent data from state
  useEffect(() => {
    if (!intentData) {
      toast.error(t("No intent data found"));
      navigate("/intents");
      return;
    }

    setName(intentData.name || "");
    setDescription(intentData.description || "");
    setYamlDefine(intentData.define || "");
    setSelectedEntities(intentData.entities || []);
    
    // Parse examples from YAML for normal mode
    if (intentData.define) {
      const parsedExamples = parseYAMLExamples(intentData.define);
      setExamples(parsedExamples);
    }
  }, [intentData, navigate, t]);

  // Search entities
  useEffect(() => {
    if (entitySearchQuery.length > 0) {
      const debounce = setTimeout(async () => {
        try {
          setIsSearching(true);
          const results = await intentService.searchEntityForIntent(entitySearchQuery);
          setEntitySearchResults(results);
        } catch (error) {
          console.error("Error searching entities:", error);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(debounce);
    } else {
      setEntitySearchResults([]);
    }
  }, [entitySearchQuery]);

  // Generate template
  const generateTemplate = () => {
    const sanitizedName = toSnakeCase(name) || "intent_name";
    const template = `- intent: ${sanitizedName}
  examples: |
    - example1
    - example2`;
    setYamlDefine(template);
    setErrors([]);
  };

  // Normal mode: Add example
  const handleAddExample = () => {
    setExamples([...examples, ""]);
  };

  // Normal mode: Remove example
  const handleRemoveExample = (index: number) => {
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index));
    }
  };

  // Normal mode: Update example
  const handleUpdateExample = (index: number, value: string) => {
    const newExamples = [...examples];
    newExamples[index] = value;
    setExamples(newExamples);
  };

  // Generate YAML from normal mode
  const generateYAMLFromNormalMode = (): string => {
    const sanitizedName = toSnakeCase(name) || "intent_name";
    const exampleLines = examples
      .filter(ex => ex.trim())
      .map(ex => `    - ${ex}`)
      .join("\n");
    
    return `- intent: ${sanitizedName}
  examples: |
${exampleLines || "    - example1"}`;
  };

  // Sync YAML when switching from normal to expert mode
  const handleModeSwitch = (toExpertMode: boolean) => {
    if (toExpertMode && !isExpertMode) {
      // Switching to expert mode - generate YAML from examples
      setYamlDefine(generateYAMLFromNormalMode());
    }
    setIsExpertMode(toExpertMode);
  };

  // Insert entity pattern at cursor position
  const insertEntityPattern = (entity: IEntity) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const textBefore = yamlDefine.substring(0, cursorPos);
      const textAfter = yamlDefine.substring(cursorPos);
      const pattern = `[enter_value]([${entity._id}])`;

      setYamlDefine(textBefore + pattern + textAfter);

      // Set cursor after inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          cursorPos + pattern.length,
          cursorPos + pattern.length
        );
      }, 0);
    }
  };

  // Add entity
  const handleAddEntity = (entity: IEntity) => {
    // Check if already selected
    if (selectedEntities.find((e) => e._id === entity._id)) {
      toast.warning(t("Entity already selected"));
      return;
    }

    setSelectedEntities([...selectedEntities, entity]);
    insertEntityPattern(entity);

    setEntitySearchOpen(false);
    setEntitySearchQuery("");
  };

  // Click on selected entity to insert pattern again
  const handleEntityClick = (entity: IEntity) => {
    insertEntityPattern(entity);
  };

  // Remove entity
  const handleRemoveEntity = (entityId: string) => {
    setSelectedEntities(selectedEntities.filter((e) => e._id !== entityId));
  };

  // Validate YAML
  const validateYAML = (): boolean => {
    const newErrors: string[] = [];

    if (!yamlDefine.trim()) {
      newErrors.push(t("YAML definition is required"));
      setErrors(newErrors);
      return false;
    }

    const lines = yamlDefine.split("\n");

    // Check if has intent declaration
    const intentLine = lines.find((line) => line.trim().startsWith("- intent:"));
    if (!intentLine) {
      newErrors.push(t("YAML must contain '- intent:' declaration"));
    } else {
      // Extract intent name from YAML
      const yamlIntentName = intentLine.split(":")[1]?.trim();
      const sanitizedName = toSnakeCase(name);

      if (yamlIntentName !== sanitizedName) {
        newErrors.push(
          t("Intent name in YAML must match the name field") +
            ` (expected: ${sanitizedName}, found: ${yamlIntentName})`
        );
      }
    }

    // Check if has examples
    const hasExamples = lines.some((line) => line.includes("examples:"));
    if (!hasExamples) {
      newErrors.push(t("YAML must contain 'examples:' field"));
    }

    // Validate entity IDs in YAML
    const entityPattern = /\[([^\]]+)\]\(\[([^\]]+)\]\)/g;
    const matches = [...yamlDefine.matchAll(entityPattern)];
    const selectedEntityIds = new Set(selectedEntities.map((e) => e._id));

    matches.forEach((match) => {
      const entityId = match[2];
      if (!selectedEntityIds.has(entityId)) {
        newErrors.push(
          t("Entity ID in YAML is not in selected entities list") +
            `: [${entityId}]`
        );
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Generate preview with entity names
  const generatePreview = (): string => {
    if (!yamlDefine) return "";

    let preview = yamlDefine;
    const entityMap = new Map(selectedEntities.map((e) => [e._id, e.name]));

    // Replace [anything]([entity_id]) with [anything](entity_name)
    const entityPattern = /\[([^\]]+)\]\(\[([^\]]+)\]\)/g;
    preview = preview.replace(entityPattern, (match, value, entityId) => {
      const entityName = entityMap.get(entityId);
      return entityName ? `[${value}](${entityName})` : match;
    });

    return preview;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!intentData?._id) {
      toast.error(t("Intent ID not found"));
      return;
    }

    const sanitizedName = toSnakeCase(name);

    if (!sanitizedName) {
      toast.error(t("Please enter intent name"));
      return;
    }

    // Generate YAML from normal mode if needed
    let finalYaml = yamlDefine;
    if (!isExpertMode) {
      finalYaml = generateYAMLFromNormalMode();
      setYamlDefine(finalYaml);
    }

    if (!validateYAML()) {
      toast.error(t("Please fix YAML errors"));
      return;
    }

    try {
      setIsSubmitting(true);
      await intentService.updateIntent(intentData._id, {
        ...intentData,
        name: sanitizedName,
        description: description.trim(),
        define: finalYaml,
        entities: selectedEntities.map((e) => e._id),
      });

      toast.success(t("Intent updated successfully"));
      navigate("/intents");
    } catch (error) {
      console.error("Error updating intent:", error);
      toast.error(t("Failed to update intent"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/intents")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("Back")}
        </Button>
        <h1 className="text-3xl font-bold">{t("Edit Intent")}</h1>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 mb-6 p-4 bg-muted rounded-lg">
        {/* Mode Toggle */}
        <div className="flex gap-1 mr-auto">
          <Button
            variant={!isExpertMode ? "default" : "outline"}
            onClick={() => handleModeSwitch(false)}
            className="gap-2"
            size="sm"
          >
            <FormInput className="h-4 w-4" />
            {t("Normal Mode")}
          </Button>
          <Button
            variant={isExpertMode ? "default" : "outline"}
            onClick={() => handleModeSwitch(true)}
            className="gap-2"
            size="sm"
          >
            <Code2 className="h-4 w-4" />
            {t("Expert Mode")}
          </Button>
        </div>

        {isExpertMode && (
          <Button
            variant="outline"
            onClick={generateTemplate}
            className="gap-2"
          >
            <FileCode className="h-4 w-4" />
            {t("Generate Template")}
          </Button>
        )}

        <Popover open={entitySearchOpen} onOpenChange={setEntitySearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              {t("Add Entity")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={t("Search entities...")}
                value={entitySearchQuery}
                onValueChange={setEntitySearchQuery}
              />
              <CommandList className="max-h-[200px] overflow-y-auto">
                <CommandEmpty>
                  {isSearching
                    ? t("Searching...")
                    : t("No entities found")}
                </CommandEmpty>
                {entitySearchResults.length > 0 && (
                  <CommandGroup>
                    {entitySearchResults.map((entity) => (
                      <CommandItem
                        key={entity._id}
                        value={entity._id}
                        onSelect={() => handleAddEntity(entity)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{entity.name}</span>
                          {entity.description && (
                            <span className="text-xs text-muted-foreground">
                              {entity.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="intent-name">{t("Intent Name")} *</Label>
          <Input
            id="intent-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={(e) => setName(toSnakeCase(e.target.value))}
            placeholder={t("e.g., greet, ask_weather")}
          />
          <p className="text-xs text-muted-foreground">
            {t("Use lowercase and underscores (e.g., my_intent_name)")}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="intent-desc">{t("Description")}</Label>
          <Textarea
            id="intent-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("Describe what this intent is for")}
            rows={3}
          />
        </div>

        {/* Selected Entities - NOW CLICKABLE */}
        {selectedEntities.length > 0 && (
          <div className="space-y-2">
            <Label>{t("Selected Entities")}</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
              {selectedEntities.map((entity) => (
                <Badge
                  key={entity._id}
                  variant="secondary"
                  className="gap-2 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleEntityClick(entity)}
                  title={t("Click to insert entity pattern at cursor")}
                >
                  <span>{entity.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveEntity(entity._id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              💡 {t("Click on an entity to insert its pattern at cursor position")}
            </p>
          </div>
        )}

        {/* Examples Section - Normal Mode or Expert Mode */}
        {!isExpertMode ? (
          // NORMAL MODE - Form with add/remove buttons
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("Examples")} *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddExample}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                {t("Add Example")}
              </Button>
            </div>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={example}
                    onChange={(e) => handleUpdateExample(index, e.target.value)}
                    placeholder={t("Enter example phrase")}
                    className="flex-1"
                  />
                  {examples.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExample(index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Add training examples for this intent")}
            </p>
          </div>
        ) : (
          // EXPERT MODE - YAML textarea
          <div className="space-y-2">
            <Label htmlFor="yaml-define">{t("YAML Definition")} *</Label>
            <Textarea
              id="yaml-define"
              ref={textareaRef}
              value={yamlDefine}
              onChange={(e) => setYamlDefine(e.target.value)}
              onBlur={validateYAML}
              placeholder={t("Enter YAML definition or generate template")}
              className="font-mono text-sm min-h-[300px]"
            />
          </div>
        )}

        {/* PREVIEW BOX */}
        {yamlDefine && selectedEntities.length > 0 && isExpertMode && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <Label>{t("Preview (Entity IDs → Names)")}</Label>
            </div>
            <div className="relative">
              <Textarea
                value={generatePreview()}
                readOnly
                className="font-mono text-sm min-h-[200px] bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              />
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700">
                  {t("Preview Only")}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("This shows how your YAML will look with entity names instead of IDs")}
            </p>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="space-y-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <AlertCircle className="h-4 w-4" />
              {t("Validation Errors")}
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => navigate("/intents")}
            disabled={isSubmitting}
          >
            {t("Cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? t("Updating...") : t("Update Intent")}
          </Button>
        </div>
      </div>
    </div>
  );
}