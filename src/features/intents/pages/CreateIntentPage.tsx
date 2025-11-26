import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, FileCode, Search, X, AlertCircle, Eye, Plus, Code2, FormInput, HelpCircle } from "lucide-react";
import { intentService } from "../api/service";
import { IEntity } from "@/interfaces/entity.interface";
import { toast } from "sonner";

export function CreateIntentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  
  // Track focused input in Normal Mode
  const [focusedExampleIndex, setFocusedExampleIndex] = useState<number | null>(null);
  const exampleInputRefs = useRef<(HTMLInputElement | undefined)[]>([]);

  // Help dialog state
  const [showHelp, setShowHelp] = useState(false);

  // Helper function to convert to snake_case
  const toSnakeCase = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

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

  // Insert entity pattern at cursor position (Expert Mode)
  const insertEntityPatternExpert = (entity: IEntity) => {
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

  // Insert entity pattern into focused input (Normal Mode)
  const insertEntityPatternNormal = (entity: IEntity) => {
    // Determine which input to insert into
    let targetIndex = focusedExampleIndex;
    
    // If no input is focused, use the last non-empty input, or the last input
    if (targetIndex === null) {
      let lastNonEmptyIndex = -1;
      for (let i = examples.length - 1; i >= 0; i--) {
        if (examples[i].trim()) {
          lastNonEmptyIndex = i;
          break;
        }
      }
      targetIndex = lastNonEmptyIndex >= 0 ? lastNonEmptyIndex : examples.length - 1;
    }

    if (targetIndex === null) return;
    
    const input = exampleInputRefs.current[targetIndex];
    if (!input) return;

    const pattern = `[enter_value]([${entity._id}])`;
    const cursorPos = input.selectionStart || 0;
    const textBefore = examples[targetIndex]?.substring(0, cursorPos) || '';
    const textAfter = examples[targetIndex]?.substring(cursorPos) || '';
    
    const newValue = textBefore + pattern + textAfter;
    handleUpdateExample(targetIndex, newValue);

    // Focus and set cursor position
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(
        cursorPos + pattern.length,
        cursorPos + pattern.length
      );
    }, 0);
  };

  // Add entity
  const handleAddEntity = (entity: IEntity) => {
    // Check if already selected
    if (selectedEntities.find((e) => e._id === entity._id)) {
      toast.warning(t("Entity already selected"));
      return;
    }

    setSelectedEntities([...selectedEntities, entity]);
    
    // Insert pattern based on current mode
    if (isExpertMode) {
      insertEntityPatternExpert(entity);
    } else {
      insertEntityPatternNormal(entity);
    }

    setEntitySearchOpen(false);
    setEntitySearchQuery("");
  };

  // Click on selected entity to insert pattern again
  const handleEntityClick = (entity: IEntity) => {
    if (isExpertMode) {
      insertEntityPatternExpert(entity);
    } else {
      insertEntityPatternNormal(entity);
    }
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

    // Replace [anything]([entity_id]) with [anything]({entity_name})
    const entityPattern = /\[([^\]]+)\]\(\[([^\]]+)\]\)/g;
    preview = preview.replace(entityPattern, (match, value, entityId) => {
      const entityName = entityMap.get(entityId);
      return entityName ? `[${value}](${entityName})` : match;
    });

    return preview;
  };

  // Handle submit
  const handleSubmit = async () => {
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
      await intentService.createIntent({
        name: sanitizedName,
        description: description.trim(),
        define: finalYaml,
        entities: selectedEntities.map((e) => e._id),
      });

      toast.success(t("Intent created successfully"));
      navigate("/intents");
    } catch (error) {
      console.error("Error creating intent:", error);
      toast.error(t("Failed to create intent"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl p-3">
      {/* Help Button - Fixed position */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 hover:text-white z-50"
        onClick={() => setShowHelp(true)}
        title={t("Help & Guide")}
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      {/* Help Dialog/Modal */}
      {showHelp && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHelp(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                {t("Intent Guide")}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHelp(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* What is Intent */}
              <section>
                <h3 className="text-lg font-semibold mb-3 text-blue-600">
                  📌 {t("What is an Intent?")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {t("An Intent represents the user's intention or goal in a conversation. It's what the user wants to achieve when they send a message to the chatbot.")}
                </p>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-sm font-medium mb-2">{t("Examples")}:</p>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• <code className="bg-white dark:bg-gray-900 px-1 rounded">greet</code> - {t("User wants to greet")}</li>
                    <li>• <code className="bg-white dark:bg-gray-900 px-1 rounded">ask_weather</code> - {t("User wants to know the weather")}</li>
                    <li>• <code className="bg-white dark:bg-gray-900 px-1 rounded">book_flight</code> - {t("User wants to book a flight")}</li>
                  </ul>
                </div>
              </section>

              {/* Relationship with Entity */}
              <section>
                <h3 className="text-lg font-semibold mb-3 text-green-600">
                  🔗 {t("Relationship between Intent and Entity")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                  {t("Intent identifies WHAT the user wants, while Entity identifies specific INFORMATION within that intention.")}
                </p>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <p className="text-sm font-medium mb-2">{t("Example")}:</p>
                  <div className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                    <p className="font-mono bg-white dark:bg-gray-900 p-2 rounded">
                      "{t("Book a flight to Hanoi tomorrow")}"
                    </p>
                    <ul className="space-y-1 ml-4">
                      <li>• <strong>{t("Intent")}</strong>: <code className="bg-white dark:bg-gray-900 px-1 rounded">book_flight</code></li>
                      <li>• <strong>{t("Entities")}</strong>: 
                        <ul className="ml-4 mt-1">
                          <li>- <code className="bg-white dark:bg-gray-900 px-1 rounded">city</code>: "Hanoi"</li>
                          <li>- <code className="bg-white dark:bg-gray-900 px-1 rounded">time</code>: "tomorrow"</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Important Notes */}
              <section>
                <h3 className="text-lg font-semibold mb-3 text-orange-600">
                  ⚠️ {t("Important Notes")}
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                    <p className="text-sm font-medium mb-2">1. {t("Intent Naming")}:</p>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• {t("Use snake_case (lowercase with underscores)")}</li>
                      <li>• {t("Be descriptive and clear: ask_weather, not weather")}</li>
                      <li>• {t("Avoid special characters and spaces")}</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                    <p className="text-sm font-medium mb-2">2. {t("Training Examples")}:</p>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• {t("Provide at least 10-15 diverse examples")}</li>
                      <li>• {t("Include variations in wording and phrasing")}</li>
                      <li>• {t("Cover different ways users might express the same intent")}</li>
                      <li>• {t("Use entity patterns when values can vary")}</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                    <p className="text-sm font-medium mb-2">3. {t("Entity Integration")}:</p>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• {t("Format")}: <code className="bg-white dark:bg-gray-900 px-1 rounded">[value]([entity_id])</code></li>
                      <li>• {t("Example")}: <code className="bg-white dark:bg-gray-900 px-1 rounded">[Hanoi]([city_entity_id])</code></li>
                      <li>• {t("Click on selected entities to insert patterns easily")}</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                    <p className="text-sm font-medium mb-2">4. {t("Best Practices")}:</p>
                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                      <li>• {t("Keep intents focused on one goal")}</li>
                      <li>• {t("Avoid overlapping intents")}</li>
                      <li>• {t("Use Expert Mode for complex YAML structures")}</li>
                      <li>• {t("Test your intent with real user phrases")}</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Quick Tips */}
              <section className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">
                  💡 {t("Quick Tips")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-sm font-medium mb-1">🎯 {t("Normal Mode")}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("Perfect for beginners. Add examples easily with forms.")}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-sm font-medium mb-1">⚙️ {t("Expert Mode")}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("Full YAML control for advanced users.")}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

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
        <h1 className="text-3xl font-bold">{t("Create New Intent")}</h1>
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

        {/* Selected Entities - CLICKABLE */}
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
                  title={t("Click to insert entity pattern")}
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
              💡 {isExpertMode 
                ? t("Click on an entity to insert its pattern at cursor position")
                : t("Click on an entity to insert into the focused example (or last example)")}
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
                    ref={(el) => {
                      if (el) {
                        exampleInputRefs.current[index] = el;
                      }
                    }}
                    value={example}
                    onChange={(e) => handleUpdateExample(index, e.target.value)}
                    onFocus={() => setFocusedExampleIndex(index)}
                    onBlur={() => setFocusedExampleIndex(null)}
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
              {t("Add training examples for this intent. Click inside an example field, then click an entity to insert it.")}
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
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? t("Creating...") : t("Create Intent")}
          </Button>
        </div>
      </div>
    </div>
  );
}