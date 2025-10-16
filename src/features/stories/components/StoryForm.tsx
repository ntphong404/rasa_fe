import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X, Settings, GripVertical, AlertCircle, SlidersHorizontal, FileCode, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { storyService } from "../api/service";
import { intentService } from "@/features/intents/api/service";
import { actionService } from "@/features/action/api/service";
import { responseService } from "@/features/reponses/api/service";
import { IIntent } from "@/interfaces/intent.interface";
import { IAction } from "@/interfaces/action.interface";
import { IMyResponse } from "@/interfaces/response.interface";
import { IStory } from "@/interfaces/story.interface";

interface StoryStep {
  id: string;
  type: 'intent' | 'action' | 'response';
  data: IIntent | IAction | IMyResponse;
}

interface StoryFormProps {
  initialStory?: IStory;
  onSubmit: (storyData: any) => Promise<void>;
  onCancel: () => void;
  submitButtonText: string;
  isSubmitting: boolean;
}

export function StoryForm({
  initialStory,
  onSubmit,
  onCancel,
  submitButtonText,
  isSubmitting
}: StoryFormProps) {
  const { t } = useTranslation();

  // Form fields
  const [name, setName] = useState(initialStory?.name || "");
  const [description, setDescription] = useState(initialStory?.description || "");
  const [yamlDefine, setYamlDefine] = useState("");

  // Mode selection
  const [isExpertMode, setIsExpertMode] = useState(false);

  // Step management
  const [storySteps, setStorySteps] = useState<StoryStep[]>([]);

  // Drag & drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropZoneIndex, setDropZoneIndex] = useState<number | null>(null);

  // Validation errors
  const [yamlErrors, setYamlErrors] = useState<string[]>([]);

  // Intent dialog state
  const [intentDialogOpen, setIntentDialogOpen] = useState(false);
  const [intentSearchQuery, setIntentSearchQuery] = useState("");
  const [intentSearchResults, setIntentSearchResults] = useState<IIntent[]>([]);
  const [isSearchingIntents, setIsSearchingIntents] = useState(false);
  const [intentFilterDeleted, setIntentFilterDeleted] = useState(false);

  // Action/Response dialog state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionSearchQuery, setActionSearchQuery] = useState("");
  const [actionSearchResults, setActionSearchResults] = useState<IAction[]>([]);
  const [responseSearchQuery, setResponseSearchQuery] = useState("");
  const [responseSearchResults, setResponseSearchResults] = useState<IMyResponse[]>([]);
  const [isSearchingActions, setIsSearchingActions] = useState(false);
  const [isSearchingResponses, setIsSearchingResponses] = useState(false);
  const [actionFilterDeleted, setActionFilterDeleted] = useState(false);
  const [responseFilterDeleted, setResponseFilterDeleted] = useState(false);

  // Validation
  const [errors, setErrors] = useState<string[]>([]);

  // Help dialog state
  const [showHelp, setShowHelp] = useState(false);

  // Selected items for expert mode
  const [selectedIntents, setSelectedIntents] = useState<IIntent[]>([]);
  const [selectedActions, setSelectedActions] = useState<IAction[]>([]);
  const [selectedResponses, setSelectedResponses] = useState<IMyResponse[]>([]);

  // Textarea ref for expert mode
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper function to convert to snake_case
  const toSnakeCase = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  // Fetch names for IDs
  const fetchNameForId = async (id: string, type: 'intent' | 'action' | 'response'): Promise<any> => {
    try {
      switch (type) {
        case 'intent':
          const intent = await intentService.getIntentById(id);
          return intent || null;

        case 'action':
          const action = await actionService.getActionById(id);
          return action || null;

        case 'response':
          const response = await responseService.getResponseById(id);
          return response || null;

        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching ${type} ${id}:`, error);
      return null;
    }
  };

  // Parse steps from YAML define
  const parseStepsFromDefine = async (yamlDefine: string): Promise<StoryStep[]> => {
    const steps: StoryStep[] = [];
    const lines = yamlDefine.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for step lines with intent or action
      if (line.includes('- intent:') || line.includes('- action:')) {
        // Extract ID from brackets [id]
        const match = line.match(/\[([^\]]+)\]/);
        if (match) {
          const id = match[1];

          if (line.includes('- intent:')) {
            // Fetch real data for intent ID
            const intent = await fetchNameForId(id, 'intent');
            if (intent) {
              steps.push({
                id: `intent_${id}_${i}`,
                type: 'intent',
                data: intent
              });
            }
          } else if (line.includes('- action:')) {
            // Could be action or response - try both
            let stepData = await fetchNameForId(id, 'action');
            let stepType: 'action' | 'response' = 'action';

            if (!stepData) {
              // Try as response
              stepData = await fetchNameForId(id, 'response');
              stepType = 'response';
            }

            if (stepData) {
              steps.push({
                id: `${stepType}_${id}_${i}`,
                type: stepType,
                data: stepData
              });
            }
          }
        }
      }
    }

    return steps;
  };

  // Load selected items from initialStory
  const loadSelectedItems = async (story: IStory) => {
    try {
      // Load intents
      if (story.intents && story.intents.length > 0) {
        const intents = await Promise.all(
          story.intents.map(id => fetchNameForId(id, 'intent'))
        );
        setSelectedIntents(intents.filter(Boolean));
      }

      // Load actions  
      if (story.action && story.action.length > 0) {
        const actions = await Promise.all(
          story.action.map(id => fetchNameForId(id, 'action'))
        );
        setSelectedActions(actions.filter(Boolean));
      }

      // Load responses
      if (story.responses && story.responses.length > 0) {
        const responses = await Promise.all(
          story.responses.map(id => fetchNameForId(id, 'response'))
        );
        setSelectedResponses(responses.filter(Boolean));
      }
    } catch (error) {
      console.error('Error loading selected items:', error);
    }
  };

  // Initialize form with existing story data
  useEffect(() => {
    const initializeSteps = async () => {
      if (initialStory) {
        setName(initialStory.name || "");
        setDescription(initialStory.description || "");

        // Parse steps from YAML define to maintain correct order
        if (initialStory.define) {
          try {
            const steps = await parseStepsFromDefine(initialStory.define);
            setStorySteps(steps);
            setYamlDefine(initialStory.define);

            // Don't force expert mode - let user choose
            // setIsExpertMode(true);
          } catch (error) {
            console.error('Error parsing steps from YAML:', error);
            // Fallback to empty steps
            setStorySteps([]);
          }
        }

        // Load selected items for expert mode
        loadSelectedItems(initialStory);
      }
    };

    initializeSteps();
  }, [initialStory]);

  // Update YAML when name changes (both visual and expert mode)
  useEffect(() => {
    if (!isExpertMode) {
      // Visual mode - regenerate YAML from steps
      const newYaml = generateYamlFromSteps();
      if (newYaml) {
        setYamlDefine(newYaml);
      }
    } else {
      // Expert mode - update story name in existing YAML
      updateStoryNameInYaml();
    }
  }, [name, isExpertMode]);

  // Function to update story name in YAML without affecting other content
  const updateStoryNameInYaml = () => {
    if (!yamlDefine.trim() || !name.trim()) return;

    const sanitizedName = toSnakeCase(name);
    const lines = yamlDefine.split('\n');

    // Find and update the story name line
    const updatedLines = lines.map(line => {
      if (line.trim().startsWith('- story:')) {
        return `- story: ${sanitizedName}`;
      }
      return line;
    });

    const updatedYaml = updatedLines.join('\n');
    if (updatedYaml !== yamlDefine) {
      setYamlDefine(updatedYaml);
    }
  };

  // Generate YAML from visual steps
  const generateYamlFromSteps = (): string => {
    if (storySteps.length === 0) {
      return "";
    }

    const storyName = toSnakeCase(name) || "story";
    let yaml = `- story: ${storyName}\n`;
    yaml += `  steps:\n`;

    storySteps.forEach((step) => {
      switch (step.type) {
        case 'intent':
          yaml += `  - intent: [${step.data._id}]\n`;
          break;
        case 'action':
          yaml += `  - action: [${step.data._id}]\n`;
          break;
        case 'response':
          yaml += `  - action: [${step.data._id}]\n`;
          break;
      }
    });

    return yaml;
  };

  // Generate template YAML
  const generateTemplate = () => {
    const sanitizedName = toSnakeCase(name) || "story_name";
    const template = `- story: ${sanitizedName}
  steps:
    - intent: [intent_id]
    - action: [action_id]`;
    setYamlDefine(template);
    setYamlErrors([]);
  };

  // Insert intent at cursor position (Expert Mode)
  const insertIntentAtCursor = (intent: IIntent) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const textBefore = yamlDefine.substring(0, cursorPos);
      const textAfter = yamlDefine.substring(cursorPos);
      const pattern = `[${intent._id}]`;

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

  // Insert action at cursor position (Expert Mode)
  const insertActionAtCursor = (action: IAction) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const textBefore = yamlDefine.substring(0, cursorPos);
      const textAfter = yamlDefine.substring(cursorPos);
      const pattern = `[${action._id}]`;

      setYamlDefine(textBefore + pattern + textAfter);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          cursorPos + pattern.length,
          cursorPos + pattern.length
        );
      }, 0);
    }
  };

  // Insert response at cursor position (Expert Mode)
  const insertResponseAtCursor = (response: IMyResponse) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const textBefore = yamlDefine.substring(0, cursorPos);
      const textAfter = yamlDefine.substring(cursorPos);
      const pattern = `[${response._id}]`;

      setYamlDefine(textBefore + pattern + textAfter);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          cursorPos + pattern.length,
          cursorPos + pattern.length
        );
      }, 0);
    }
  };

  // Search functions
  const searchIntents = async (query: string) => {
    if (!query.trim()) {
      setIntentSearchResults([]);
      return;
    }

    try {
      setIsSearchingIntents(true);
      const results = await storyService.searchIntentForStory(query);
      setIntentSearchResults(results);
    } catch (error) {
      console.error("Error searching intents:", error);
      toast.error(t("Failed to search intents"));
    } finally {
      setIsSearchingIntents(false);
    }
  };

  const searchActions = async (query: string) => {
    if (!query.trim()) {
      setActionSearchResults([]);
      return;
    }

    try {
      setIsSearchingActions(true);
      const results = await storyService.searchActionForStory(query);
      setActionSearchResults(results);
    } catch (error) {
      console.error("Error searching actions:", error);
      toast.error(t("Failed to search actions"));
    } finally {
      setIsSearchingActions(false);
    }
  };

  const searchResponses = async (query: string) => {
    if (!query.trim()) {
      setResponseSearchResults([]);
      return;
    }

    try {
      setIsSearchingResponses(true);
      const results = await storyService.searchResponseForStory(query);
      setResponseSearchResults(results);
    } catch (error) {
      console.error("Error searching responses:", error);
      toast.error(t("Failed to search responses"));
    } finally {
      setIsSearchingResponses(false);
    }
  };

  // Add steps
  const addIntentStep = (intent: IIntent) => {
    // Check if already selected
    if (storySteps.find(step => step.type === 'intent' && step.data._id === intent._id)) {
      toast.warning(t("Intent already added to this story"));
      return;
    }

    const newStep: StoryStep = {
      id: `intent_${intent._id}_${Date.now()}`,
      type: 'intent',
      data: intent
    };
    const updatedSteps = [...storySteps, newStep];
    setStorySteps(updatedSteps);

    // Also add to selected intents if not already present
    if (!selectedIntents.find(i => i._id === intent._id)) {
      setSelectedIntents([...selectedIntents, intent]);
    }

    setIntentDialogOpen(false);
    setIntentSearchQuery("");
    setIntentSearchResults([]);

    // Real-time validation feedback
    const sequenceErrors = validateStepSequence(updatedSteps);
    const sequenceWarnings = getStepSequenceWarnings(updatedSteps);

    if (sequenceErrors.length === 0) {
      toast.success(t("Intent added successfully"));
      if (sequenceWarnings.length > 0) {
        toast.info(t("Suggestion: ") + sequenceWarnings[0]);
      }
    } else {
      toast.error(t("Error: ") + sequenceErrors[0]);
    }
  };

  const addActionStep = (action: IAction) => {
    // Check if already selected
    if (storySteps.find(step => step.type === 'action' && step.data._id === action._id)) {
      toast.warning(t("Action already added to this story"));
      return;
    }

    const newStep: StoryStep = {
      id: `action_${action._id}_${Date.now()}`,
      type: 'action',
      data: action
    };
    const updatedSteps = [...storySteps, newStep];
    setStorySteps(updatedSteps);

    // Also add to selected actions if not already present
    if (!selectedActions.find(a => a._id === action._id)) {
      setSelectedActions([...selectedActions, action]);
    }

    setActionDialogOpen(false);
    setActionSearchQuery("");
    setActionSearchResults([]);

    // Real-time validation feedback
    const sequenceErrors = validateStepSequence(updatedSteps);
    const sequenceWarnings = getStepSequenceWarnings(updatedSteps);

    if (sequenceErrors.length === 0) {
      toast.success(t("Action added successfully"));
      if (sequenceWarnings.length > 0) {
        toast.info(t("Suggestion: ") + sequenceWarnings[0]);
      }
    } else {
      toast.error(t("Error: ") + sequenceErrors[0]);
    }
  };

  const addResponseStep = (response: IMyResponse) => {
    // Check if already selected
    if (storySteps.find(step => step.type === 'response' && step.data._id === response._id)) {
      toast.warning(t("Response already added to this story"));
      return;
    }

    const newStep: StoryStep = {
      id: `response_${response._id}_${Date.now()}`,
      type: 'response',
      data: response
    };
    const updatedSteps = [...storySteps, newStep];
    setStorySteps(updatedSteps);

    // Also add to selected responses if not already present
    if (!selectedResponses.find(r => r._id === response._id)) {
      setSelectedResponses([...selectedResponses, response]);
    }

    setActionDialogOpen(false);
    setResponseSearchQuery("");
    setResponseSearchResults([]);

    // Real-time validation feedback
    const sequenceErrors = validateStepSequence(updatedSteps);
    const sequenceWarnings = getStepSequenceWarnings(updatedSteps);

    if (sequenceErrors.length === 0) {
      toast.success(t("Response added successfully"));
      if (sequenceWarnings.length > 0) {
        toast.info(t("Suggestion: ") + sequenceWarnings[0]);
      }
    } else {
      toast.error(t("Error: ") + sequenceErrors[0]);
    }
  };

  // Remove step
  const removeStep = (stepId: string) => {
    const updatedSteps = storySteps.filter(step => step.id !== stepId);
    setStorySteps(updatedSteps);

    // Re-validate after removal
    if (updatedSteps.length > 0) {
      const sequenceErrors = validateStepSequence(updatedSteps);
      if (sequenceErrors.length === 0) {
        toast.success(t("Step removed successfully"));
      } else {
        toast.error(t("Error after removal: ") + sequenceErrors[0]);
      }
    } else {
      toast.success(t("Step removed successfully"));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index && dropZoneIndex !== index) {
      setDropZoneIndex(index);
    }
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropZoneIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only clear if we're really leaving the element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropZoneIndex(null);
    }
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDropZoneIndex(null);
      return;
    }

    const newSteps = [...storySteps];
    const draggedStep = newSteps[draggedIndex];

    // Remove the dragged item
    newSteps.splice(draggedIndex, 1);

    // Insert before the target item by default
    let finalIndex = dropIndex;

    // If dragging from before the target, adjust index
    if (draggedIndex < dropIndex) {
      finalIndex = dropIndex - 1;
    }

    // Ensure index is within bounds
    finalIndex = Math.max(0, Math.min(finalIndex, newSteps.length));

    // Insert at new position
    newSteps.splice(finalIndex, 0, draggedStep);

    setStorySteps(newSteps);
    setDraggedIndex(null);
    setDropZoneIndex(null);

    // Validate sequence after reordering
    const sequenceErrors = validateStepSequence(newSteps);
    if (sequenceErrors.length === 0) {
      toast.success(t("Step order updated"));
    } else {
      toast.error(t("Error after reordering: ") + sequenceErrors[0]);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropZoneIndex(null);
  };

  // Validate step sequence logic (Stories are more flexible than Rules)
  const validateStepSequence = (steps: StoryStep[]): string[] => {
    const errors: string[] = [];

    if (steps.length === 0) {
      errors.push(t("Story must have at least one step"));
      return errors;
    }

    // For stories, we're much more permissive than rules
    // Only flag truly problematic patterns, not just recommendations

    // Check for completely empty or invalid steps
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];

      if (!currentStep.data || !currentStep.data._id) {
        errors.push(t("Invalid step data") + ` (step ${i + 1})`);
      }
    }

    // Stories are flexible - Intent→Response, Intent→Action→Response, etc. are all valid
    // We don't need to enforce strict sequencing like Rules do

    return errors;
  };

  // Get sequence warnings (non-blocking suggestions)
  const getStepSequenceWarnings = (steps: StoryStep[]): string[] => {
    const warnings: string[] = [];

    if (steps.length === 0) return warnings;

    // Suggest starting with intent
    if (steps[0].type !== 'intent') {
      warnings.push(t("Stories typically start with an Intent for better conversation flow"));
    }

    // Suggest following intents with responses/actions
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];

      if (currentStep.type === 'intent' && i === steps.length - 1) {
        warnings.push(t("Consider adding a Response or Action after this Intent") + ` (step ${i + 1})`);
      }
    }

    return warnings;
  };

  // Validate YAML (similar to Rule validation but adapted for stories)
  const validateYAML = (): boolean => {
    const newErrors: string[] = [];

    // Only validate YAML if in expert mode or if yamlDefine has content
    if (!yamlDefine.trim()) {
      if (isExpertMode) {
        newErrors.push(t("YAML definition is required"));
      }
      setYamlErrors(newErrors);
      return !isExpertMode; // Return true if not in expert mode
    }

    const lines = yamlDefine.split("\n");

    // Check if has story declaration
    const storyLine = lines.find((line) => line.trim().startsWith("- story:"));
    if (!storyLine) {
      newErrors.push(t("YAML must contain '- story:' declaration"));
    } else {
      // Extract story name from YAML
      const yamlStoryName = storyLine.split(":")[1]?.trim();
      const sanitizedName = toSnakeCase(name);

      if (yamlStoryName !== sanitizedName && !isExpertMode) {
        newErrors.push(
          t("Story name in YAML must match the name field") +
          ` (expected: ${sanitizedName}, found: ${yamlStoryName})`
        );
      }
    }

    // Check if has steps
    const hasSteps = lines.some((line) => line.includes("steps:"));
    if (!hasSteps) {
      newErrors.push(t("YAML must contain 'steps:' field"));
    }

    // Validate step format
    const stepLines = lines.filter(line =>
      line.trim().startsWith("- intent:") || line.trim().startsWith("- action:")
    );

    stepLines.forEach((line, index) => {
      if (!line.match(/\[([^\]]+)\]/)) {
        newErrors.push(
          t("Step must contain ID in brackets") + ` (line ${index + 1}): ${line.trim()}`
        );
      }
    });

    // Validate step sequence logic (only in visual mode where we have storySteps)
    if (!isExpertMode && storySteps.length > 0) {
      const sequenceErrors = validateStepSequence(storySteps);
      newErrors.push(...sequenceErrors);
    }

    setYamlErrors(newErrors);
    return newErrors.length === 0;
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!isExpertMode && !name.trim()) {
      newErrors.push(t("Story name is required"));
    }

    if (isExpertMode) {
      if (!yamlDefine.trim()) {
        newErrors.push(t("YAML definition is required"));
      } else {
        // Basic YAML validation
        if (!yamlDefine.includes('- story:')) {
          newErrors.push(t("YAML must contain a story definition"));
        }
      }
    } else {
      if (storySteps.length === 0) {
        newErrors.push(t("At least one step is required"));
      } else {
        // Validate step sequence in visual mode
        const sequenceErrors = validateStepSequence(storySteps);
        newErrors.push(...sequenceErrors);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Validate YAML before submitting (only in expert mode)
    if (isExpertMode && !validateYAML()) {
      toast.error(t("Please fix YAML errors before submitting"));
      return;
    }

    try {
      const finalYaml = isExpertMode ? yamlDefine : generateYamlFromSteps();

      // Extract IDs from steps or YAML
      const intentIds: string[] = [];
      const actionIds: string[] = [];
      const responseIds: string[] = [];

      if (isExpertMode) {
        // Parse YAML to extract IDs
        const lines = finalYaml.split('\n');
        lines.forEach(line => {
          const match = line.match(/\[([^\]]+)\]/);
          if (match) {
            const id = match[1];
            if (line.includes('- intent:')) {
              intentIds.push(id);
            } else if (line.includes('- action:')) {
              // For expert mode, we'll put all actions in actionIds
              actionIds.push(id);
            }
          }
        });
      } else {
        // Extract from visual steps
        storySteps.forEach(step => {
          switch (step.type) {
            case 'intent':
              intentIds.push(step.data._id);
              break;
            case 'action':
              actionIds.push(step.data._id);
              break;
            case 'response':
              responseIds.push(step.data._id);
              break;
          }
        });
      }

      const storyData = {
        name: name.trim(),
        description: description.trim(),
        define: finalYaml,
        intents: intentIds,
        action: actionIds, // Note: interface uses 'action' not 'actions'
        responses: responseIds,
        entities: [], // Pass empty array as user specified
        slots: [], // Pass empty array as user specified
        roles: []
      };

      await onSubmit(storyData);
    } catch (error) {
      console.error("Error submitting story:", error);
      toast.error(t("Failed to save story"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <Switch
          id="expert-mode"
          checked={isExpertMode}
          onCheckedChange={setIsExpertMode}
        />
        <Label htmlFor="expert-mode" className="flex items-center gap-2">
          <FileCode className="h-4 w-4" />
          {t("Expert Mode (YAML)")}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowHelp(true)}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="story-name">{t("Story Name")} *</Label>
          <Input
            id="story-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("Enter story name")}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="story-description">{t("Description")}</Label>
          <Textarea
            id="story-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("Enter story description")}
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      {/* Expert Mode - YAML Editor */}
      {isExpertMode ? (
        <div className="space-y-4">
          <Label htmlFor="yaml-define">{t("YAML Definition")} *</Label>
          <Textarea
            ref={textareaRef}
            id="yaml-define"
            value={yamlDefine}
            onChange={(e) => setYamlDefine(e.target.value)}
            onBlur={validateYAML}
            placeholder={t("Enter YAML definition for the story")}
            className="font-mono text-sm"
            rows={15}
          />

          {/* Expert Mode Helper Tools */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateTemplate}
            >
              {t("Generate Template")}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  {t("Add Intent")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <Input
                    placeholder={t("Search intents...")}
                    value={intentSearchQuery}
                    onChange={(e) => {
                      setIntentSearchQuery(e.target.value);
                      searchIntents(e.target.value);
                    }}
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {isSearchingIntents ? (
                      <div className="text-center py-2 text-sm">{t("Searching...")}</div>
                    ) : intentSearchResults.length > 0 ? (
                      intentSearchResults.map((intent) => (
                        <div
                          key={intent._id}
                          className="p-2 text-sm border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => insertIntentAtCursor(intent)}
                        >
                          {intent.name}
                        </div>
                      ))
                    ) : intentSearchQuery ? (
                      <div className="text-center py-2 text-sm text-gray-500">{t("No intents found")}</div>
                    ) : (
                      <div className="text-center py-2 text-sm text-gray-500">{t("Start typing to search")}</div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  {t("Add Action")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <Input
                    placeholder={t("Search actions...")}
                    value={actionSearchQuery}
                    onChange={(e) => {
                      setActionSearchQuery(e.target.value);
                      searchActions(e.target.value);
                    }}
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {isSearchingActions ? (
                      <div className="text-center py-2 text-sm">{t("Searching...")}</div>
                    ) : actionSearchResults.length > 0 ? (
                      actionSearchResults.map((action) => (
                        <div
                          key={action._id}
                          className="p-2 text-sm border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => insertActionAtCursor(action)}
                        >
                          {action.name}
                        </div>
                      ))
                    ) : actionSearchQuery ? (
                      <div className="text-center py-2 text-sm text-gray-500">{t("No actions found")}</div>
                    ) : (
                      <div className="text-center py-2 text-sm text-gray-500">{t("Start typing to search")}</div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  {t("Add Response")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <Input
                    placeholder={t("Search responses...")}
                    value={responseSearchQuery}
                    onChange={(e) => {
                      setResponseSearchQuery(e.target.value);
                      searchResponses(e.target.value);
                    }}
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {isSearchingResponses ? (
                      <div className="text-center py-2 text-sm">{t("Searching...")}</div>
                    ) : responseSearchResults.length > 0 ? (
                      responseSearchResults.map((response) => (
                        <div
                          key={response._id}
                          className="p-2 text-sm border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => insertResponseAtCursor(response)}
                        >
                          {response.name}
                        </div>
                      ))
                    ) : responseSearchQuery ? (
                      <div className="text-center py-2 text-sm text-gray-500">{t("No responses found")}</div>
                    ) : (
                      <div className="text-center py-2 text-sm text-gray-500">{t("Start typing to search")}</div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Selected Items in Expert Mode */}
          {/* Selected Intents */}
          {selectedIntents.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">{t("Selected Intents")}</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                {selectedIntents.map((intent) => (
                  <Badge
                    key={intent._id}
                    variant="secondary"
                    className="gap-2 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => insertIntentAtCursor(intent)}
                    title={t("Click to insert ID at cursor position")}
                  >
                    <span>{intent.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIntents(selectedIntents.filter(i => i._id !== intent._id));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("Click on intent badges to insert their ID at cursor position")}
              </p>
            </div>
          )}

          {/* Selected Actions */}
          {selectedActions.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">{t("Selected Actions")}</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                {selectedActions.map((action) => (
                  <Badge
                    key={action._id}
                    variant="secondary"
                    className="gap-2 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => insertActionAtCursor(action)}
                    title={t("Click to insert ID at cursor position")}
                  >
                    <span>{action.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedActions(selectedActions.filter(a => a._id !== action._id));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("Click on action badges to insert their ID at cursor position")}
              </p>
            </div>
          )}

          {/* Selected Responses */}
          {selectedResponses.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">{t("Selected Responses")}</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                {selectedResponses.map((response) => (
                  <Badge
                    key={response._id}
                    variant="secondary"
                    className="gap-2 pr-1 cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => insertResponseAtCursor(response)}
                    title={t("Click to insert ID at cursor position")}
                  >
                    <span>{response.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedResponses(selectedResponses.filter(r => r._id !== response._id));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("Click on response badges to insert their ID at cursor position")}
              </p>
            </div>
          )}

          {yamlErrors.length > 0 && (
            <div className="space-y-1">
              {yamlErrors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Visual Mode - Step Builder */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t("Story Steps")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIntentDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("Intent")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActionDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("Action/Response")}
              </Button>
            </div>
          </div>

          {/* Validation Guidelines for Stories */}
          {storySteps.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {t("Drag and drop steps to reorder them. Stories represent typical conversation flows.")}
              </p>
              <p className="text-xs text-blue-600">
                {t("Stories are flexible: Intent → Response, Intent → Action → Response, etc. are all valid patterns.")}
              </p>
            </div>
          )}

          {/* Steps List */}
          <div className="space-y-2 min-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
            {storySteps.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {t("No steps added yet. Click the buttons above to add intents or actions.")}
              </div>
            ) : (
              storySteps.map((step, index) => {
                // Check if this specific step has validation issues
                const sequenceErrors = validateStepSequence(storySteps);
                const hasError = sequenceErrors.some(error => error.includes(`step ${index + 1}`));
                const isBeingDragged = draggedIndex === index;
                const isDropTarget = dropZoneIndex === index;

                return (
                  <div key={step.id}>
                    {/* Drop line indicator above current item */}
                    {draggedIndex !== null && draggedIndex !== index && isDropTarget && (
                      <div className="h-0.5 bg-blue-500 rounded-full mb-2 shadow-sm"></div>
                    )}

                    {/* Step item */}
                    <div
                      draggable={!isBeingDragged}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        handleDragOver(index);
                      }}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={handleDragEnd}
                      className={`
                        flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all duration-200
                        ${isBeingDragged
                          ? 'opacity-30 scale-95 shadow-lg border-blue-300 bg-white dark:bg-gray-800'
                          : isDropTarget && draggedIndex !== null
                            ? 'bg-blue-50 border-blue-400 border-2 shadow-md dark:bg-blue-900/20'
                            : hasError
                              ? 'bg-red-50 border-red-200 hover:shadow-sm dark:bg-red-900/20 dark:border-red-800'
                              : 'bg-white dark:bg-gray-800 hover:shadow-sm'
                        }
                      `}
                    >
                      <GripVertical className={`h-4 w-4 ${isBeingDragged ? 'text-blue-500' : 'text-gray-400'}`} />
                      <div className="flex-1 flex items-center gap-2">
                        <Badge variant={
                          step.type === 'intent' ? 'default' :
                            step.type === 'action' ? 'secondary' : 'outline'
                        }>
                          {step.type}
                        </Badge>
                        <span className="font-medium">{step.data.name}</span>
                        {hasError && (
                          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        disabled={isBeingDragged}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Drop zone at the end for appending */}
            {draggedIndex !== null && storySteps.length > 0 && (
              <div
                className="mt-2"
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dropZoneIndex !== storySteps.length) {
                    setDropZoneIndex(storySteps.length);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIndex !== null) {
                    const newSteps = [...storySteps];
                    const draggedStep = newSteps.splice(draggedIndex, 1)[0];
                    newSteps.push(draggedStep);

                    setStorySteps(newSteps);
                    setDraggedIndex(null);
                    setDropZoneIndex(null);
                  }
                }}
              >
                {/* Blue line indicator for end drop */}
                {dropZoneIndex === storySteps.length && (
                  <div className="h-0.5 bg-blue-500 rounded-full shadow-sm mb-2"></div>
                )}

                <div className="h-6 border-2 border-dashed border-blue-300 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                  <span className="text-xs text-blue-600 font-medium">
                    {t("Drop here to move to end")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* YAML Preview for Visual Mode */}
          {storySteps.length > 0 && (
            <div className="space-y-2">
              <Label>{t("YAML Preview")}</Label>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                <pre className="font-mono text-sm whitespace-pre-wrap">
                  {generateYamlFromSteps()}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-red-600">{t("Validation Errors")}</Label>
          {errors.map((error, index) => (
            <div key={index} className="text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* YAML Errors */}
      {yamlErrors.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-red-600">{t("YAML Errors")}</Label>
          {yamlErrors.map((error, index) => (
            <div key={index} className="text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Cancel")}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("Saving...") : submitButtonText}
        </Button>
      </div>

      {/* Intent Selection Dialog */}
      <Dialog open={intentDialogOpen} onOpenChange={setIntentDialogOpen}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t("Select Intent")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("Search intents...")}
              value={intentSearchQuery}
              onChange={(e) => {
                setIntentSearchQuery(e.target.value);
                searchIntents(e.target.value);
              }}
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {isSearchingIntents ? (
                <div className="text-center py-4">{t("Searching...")}</div>
              ) : intentSearchResults.length > 0 ? (
                intentSearchResults.map((intent) => (
                  <div
                    key={intent._id}
                    className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => addIntentStep(intent)}
                  >
                    <div>
                      <div className="font-medium">{intent.name}</div>
                      {intent.description && (
                        <div className="text-sm text-gray-500">{intent.description}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : intentSearchQuery ? (
                <div className="text-center py-4 text-gray-500">
                  {t("No intents found")}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {t("Start typing to search intents")}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action/Response Selection Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t("Select Action or Response")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Actions */}
            <div className="space-y-4">
              <h3 className="font-medium">{t("Actions")}</h3>
              <Input
                placeholder={t("Search actions...")}
                value={actionSearchQuery}
                onChange={(e) => {
                  setActionSearchQuery(e.target.value);
                  searchActions(e.target.value);
                }}
              />
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isSearchingActions ? (
                  <div className="text-center py-4">{t("Searching...")}</div>
                ) : actionSearchResults.length > 0 ? (
                  actionSearchResults.map((action) => (
                    <div
                      key={action._id}
                      className="p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => addActionStep(action)}
                    >
                      <div className="font-medium">{action.name}</div>
                      {action.description && (
                        <div className="text-sm text-gray-500">{action.description}</div>
                      )}
                    </div>
                  ))
                ) : actionSearchQuery ? (
                  <div className="text-center py-4 text-gray-500">
                    {t("No actions found")}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {t("Start typing to search actions")}
                  </div>
                )}
              </div>
            </div>

            {/* Responses */}
            <div className="space-y-4">
              <h3 className="font-medium">{t("Responses")}</h3>
              <Input
                placeholder={t("Search responses...")}
                value={responseSearchQuery}
                onChange={(e) => {
                  setResponseSearchQuery(e.target.value);
                  searchResponses(e.target.value);
                }}
              />
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isSearchingResponses ? (
                  <div className="text-center py-4">{t("Searching...")}</div>
                ) : responseSearchResults.length > 0 ? (
                  responseSearchResults.map((response) => (
                    <div
                      key={response._id}
                      className="p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => addResponseStep(response)}
                    >
                      <div className="font-medium">{response.name}</div>
                      {response.description && (
                        <div className="text-sm text-gray-500">{response.description}</div>
                      )}
                    </div>
                  ))
                ) : responseSearchQuery ? (
                  <div className="text-center py-4 text-gray-500">
                    {t("No responses found")}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {t("Start typing to search responses")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("Story Form Help")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">{t("Visual Mode")}</h4>
              <p className="text-gray-600 dark:text-gray-400">
                {t("Build your story step by step by adding intents and actions. Drag and drop to reorder steps.")}
              </p>
            </div>
            <div>
              <h4 className="font-medium">{t("Expert Mode")}</h4>
              <p className="text-gray-600 dark:text-gray-400">
                {t("Write YAML directly. Use [ID] format for referencing intents, actions, and responses.")}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
