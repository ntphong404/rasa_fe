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
import { ruleService } from "../api/service";
import { intentService } from "@/features/intents/api/service";
import { actionService } from "@/features/action/api/service";
import { responseService } from "@/features/reponses/api/service";
import { IIntent } from "@/interfaces/intent.interface";
import { IAction } from "@/interfaces/action.interface";
import { IMyResponse } from "@/interfaces/response.interface";
import { IRule } from "@/interfaces/rule.interface";

interface RuleStep {
  id: string;
  type: 'intent' | 'action' | 'response';
  data: IIntent | IAction | IMyResponse;
}

interface RuleFormProps {
  initialRule?: IRule;
  onSubmit: (ruleData: any) => Promise<void>;
  onCancel: () => void;
  submitButtonText: string;
  isSubmitting: boolean;
}

export function RuleForm({
  initialRule,
  onSubmit,
  onCancel,
  submitButtonText,
  isSubmitting
}: RuleFormProps) {
  const { t } = useTranslation();

  // Form fields
  const [name, setName] = useState(initialRule?.name || "");
  const [description, setDescription] = useState(initialRule?.description || "");
  const [yamlDefine, setYamlDefine] = useState("");

  // Mode selection
  const [isExpertMode, setIsExpertMode] = useState(false);

  // Step management
  const [ruleSteps, setRuleSteps] = useState<RuleStep[]>([]);

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
  const fetchNameForId = async (id: string, type: 'intent' | 'action' | 'response'): Promise<string> => {
    try {
      switch (type) {
        case 'intent':
          const intent = await intentService.getIntentById(id);
          return intent?.name || `Intent ...${id.slice(-6)}`;

        case 'action':
          const action = await actionService.getActionById(id);
          return action?.name || `Action ...${id.slice(-6)}`;

        case 'response':
          const response = await responseService.getResponseById(id);
          return response?.name || `Response ...${id.slice(-6)}`;

        default:
          return `${type} ...${id.slice(-6)}`;
      }
    } catch (error) {
      console.error(`Error fetching name for ${type} ${id}:`, error);
      return `${type} ...${id.slice(-6)}`;
    }
  };

  // Parse steps from YAML define
  const parseStepsFromDefine = async (yamlDefine: string): Promise<RuleStep[]> => {
    const steps: RuleStep[] = [];
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
            // Fetch real name for intent ID
            const intentName = await fetchNameForId(id, 'intent');
            const stepData: IIntent = {
              _id: id,
              name: intentName
            } as IIntent;

            steps.push({
              id: `intent_${id}_${i}`,
              type: 'intent',
              data: stepData
            });
          } else if (line.includes('- action:')) {
            // Could be action or response, check both arrays
            // Check if ID is in actions array  
            const isInActions = initialRule?.action?.some((item: IAction | string) =>
              (typeof item === 'string' ? item : item._id) === id
            );

            if (isInActions) {
              // Fetch real name for action ID
              const actionName = await fetchNameForId(id, 'action');
              const stepData: IAction = {
                _id: id,
                name: actionName
              } as IAction;

              steps.push({
                id: `action_${id}_${i}`,
                type: 'action',
                data: stepData
              });
            } else {
              // Check if ID is in responses array
              const isInResponses = initialRule?.responses?.some((item: IMyResponse | string) =>
                (typeof item === 'string' ? item : item._id) === id
              );

              if (isInResponses) {
                // Fetch real name for response ID
                const responseName = await fetchNameForId(id, 'response');
                const stepData: IMyResponse = {
                  _id: id,
                  name: responseName
                } as IMyResponse;

                steps.push({
                  id: `response_${id}_${i}`,
                  type: 'response',
                  data: stepData
                });
              }
            }
          }
        }
      }
    }

    return steps;
  };

  // Generate template YAML
  const generateTemplate = () => {
    const sanitizedName = toSnakeCase(name) || "rule_name";
    const template = `- rule: ${sanitizedName}
  steps:
    - intent: user_intent
    - action: utter_response`;
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

  // Insert response at cursor position (Expert Mode)
  const insertResponseAtCursor = (response: IMyResponse) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const textBefore = yamlDefine.substring(0, cursorPos);
      const textAfter = yamlDefine.substring(cursorPos);
      const pattern = `[${response._id}]`;

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

  // Handle adding intent (for both modes)
  const handleAddIntentToSelected = (intent: IIntent) => {
    // Check if already selected
    if (selectedIntents.find((i) => i._id === intent._id)) {
      toast.warning(t("Intent already selected"));
      return;
    }

    setSelectedIntents([...selectedIntents, intent]);

    if (isExpertMode) {
      insertIntentAtCursor(intent);
    }

    setIntentDialogOpen(false);
    setIntentSearchQuery("");
  };

  // Handle adding action (for both modes)  
  const handleAddActionToSelected = (action: IAction) => {
    // Check if already selected
    if (selectedActions.find((a) => a._id === action._id)) {
      toast.warning(t("Action already selected"));
      return;
    }

    setSelectedActions([...selectedActions, action]);

    if (isExpertMode) {
      insertActionAtCursor(action);
    }

    setActionDialogOpen(false);
    setActionSearchQuery("");
  };

  // Click on selected items to insert again
  const handleIntentClick = (intent: IIntent) => {
    if (isExpertMode) {
      insertIntentAtCursor(intent);
    }
  };

  const handleActionClick = (action: IAction) => {
    if (isExpertMode) {
      insertActionAtCursor(action);
    }
  };

  const handleResponseClick = (response: IMyResponse) => {
    if (isExpertMode) {
      insertResponseAtCursor(response);
    }
  };

  // Remove from selected
  const handleRemoveIntent = (intentId: string) => {
    setSelectedIntents(selectedIntents.filter((i) => i._id !== intentId));
  };

  const handleRemoveAction = (actionId: string) => {
    setSelectedActions(selectedActions.filter((a) => a._id !== actionId));
  };

  const handleRemoveResponse = (responseId: string) => {
    setSelectedResponses(selectedResponses.filter((r) => r._id !== responseId));
  };

  // Initialize form with existing rule data
  useEffect(() => {
    const initializeSteps = async () => {
      if (initialRule) {
        // Parse steps from YAML define to maintain correct order
        if (initialRule.define) {
          try {
            const steps = await parseStepsFromDefine(initialRule.define);
            setRuleSteps(steps);
            setYamlDefine(initialRule.define);

            // Extract rule name from YAML define if available (only if name field is empty)
            if (!name) {
              const yamlLines = initialRule.define.split('\n');
              const ruleNameLine = yamlLines.find(line => line.trim().startsWith('- rule:'));
              if (ruleNameLine) {
                const yamlRuleName = ruleNameLine.split('- rule:')[1]?.trim();
                if (yamlRuleName) {
                  // Convert snake_case back to readable form for display
                  const displayName = yamlRuleName.replace(/_/g, ' ').toUpperCase();
                  setName(displayName);
                }
              }
            }
          } catch (error) {
            console.error('Error parsing steps from YAML:', error);
            // Fallback to empty steps
            setRuleSteps([]);
            generateYamlDefine([]);
          }
        } else {
          // Fallback: if no define, create from arrays (shouldn't happen in edit mode)
          setRuleSteps([]);
          generateYamlDefine([]);
        }
      }
    };

    initializeSteps();
  }, [initialRule]);

  // Update YAML when name changes
  useEffect(() => {
    generateYamlDefine(ruleSteps);
  }, [name]);

  // Search intents for dialog
  useEffect(() => {
    if (intentSearchQuery.length > 0) {
      const debounce = setTimeout(async () => {
        try {
          setIsSearchingIntents(true);
          const results = await ruleService.searchIntentForRule(intentSearchQuery);
          setIntentSearchResults(results);
        } catch (error) {
          console.error("Error searching intents:", error);
        } finally {
          setIsSearchingIntents(false);
        }
      }, 300);

      return () => clearTimeout(debounce);
    } else {
      setIntentSearchResults([]);
    }
  }, [intentSearchQuery]);

  // Search actions
  useEffect(() => {
    if (actionSearchQuery.length > 0) {
      const debounce = setTimeout(async () => {
        try {
          setIsSearchingActions(true);
          const results = await ruleService.searchActionForRule(actionSearchQuery);
          setActionSearchResults(results);
        } catch (error) {
          console.error("Error searching actions:", error);
        } finally {
          setIsSearchingActions(false);
        }
      }, 300);

      return () => clearTimeout(debounce);
    } else {
      setActionSearchResults([]);
    }
  }, [actionSearchQuery]);

  // Search responses for dialog
  useEffect(() => {
    if (responseSearchQuery.length > 0) {
      const debounce = setTimeout(async () => {
        try {
          setIsSearchingResponses(true);
          const results = await ruleService.searchResponseForRule(responseSearchQuery);
          setResponseSearchResults(results);
        } catch (error) {
          console.error("Error searching responses:", error);
        } finally {
          setIsSearchingResponses(false);
        }
      }, 300);

      return () => clearTimeout(debounce);
    } else {
      setResponseSearchResults([]);
    }
  }, [responseSearchQuery]);

  // Step management functions
  const addIntentStep = () => {
    setIntentDialogOpen(true);
  };

  const addActionStep = () => {
    setActionDialogOpen(true);
  };

  const handleSelectIntent = (intent: IIntent) => {
    if (isExpertMode) {
      handleAddIntentToSelected(intent);
    } else {
      const stepId = `intent_${intent._id}_${Date.now()}`;
      const newStep: RuleStep = {
        id: stepId,
        type: 'intent',
        data: intent
      };
      const updatedSteps = [...ruleSteps, newStep];
      setRuleSteps(updatedSteps);
      setIntentDialogOpen(false);
      setIntentSearchQuery("");
      generateYamlDefine(updatedSteps);

      // Real-time validation feedback
      const sequenceErrors = validateStepSequence(updatedSteps);
      if (sequenceErrors.length > 0) {
        toast.warning(t("Step sequence validation: ") + sequenceErrors[0]);
      }
    }
  };

  const handleSelectAction = (action: IAction) => {
    if (isExpertMode) {
      handleAddActionToSelected(action);
    } else {
      const stepId = `action_${action._id}_${Date.now()}`;
      const newStep: RuleStep = {
        id: stepId,
        type: 'action',
        data: action
      };
      const updatedSteps = [...ruleSteps, newStep];
      setRuleSteps(updatedSteps);
      setActionDialogOpen(false);
      setActionSearchQuery("");
      generateYamlDefine(updatedSteps);

      // Real-time validation feedback
      const sequenceErrors = validateStepSequence(updatedSteps);
      if (sequenceErrors.length === 0) {
        toast.success(t("Action added successfully"));
      } else {
        toast.warning(t("Step sequence validation: ") + sequenceErrors[0]);
      }
    }
  };

  const handleSelectResponse = (response: IMyResponse) => {
    if (isExpertMode) {
      // Check if already selected
      if (selectedResponses.find((r) => r._id === response._id)) {
        toast.warning(t("Response already selected"));
        return;
      }

      setSelectedResponses([...selectedResponses, response]);
      insertResponseAtCursor(response);
      setActionDialogOpen(false);
      setResponseSearchQuery("");
    } else {
      const stepId = `response_${response._id}_${Date.now()}`;
      const newStep: RuleStep = {
        id: stepId,
        type: 'response',
        data: response
      };
      const updatedSteps = [...ruleSteps, newStep];
      setRuleSteps(updatedSteps);
      setActionDialogOpen(false);
      setResponseSearchQuery("");
      generateYamlDefine(updatedSteps);

      // Real-time validation feedback
      const sequenceErrors = validateStepSequence(updatedSteps);
      if (sequenceErrors.length === 0) {
        toast.success(t("Response added successfully"));
      } else {
        toast.warning(t("Step sequence validation: ") + sequenceErrors[0]);
      }
    }
  };

  const removeStep = (stepId: string) => {
    const updatedSteps = ruleSteps.filter(step => step.id !== stepId);
    setRuleSteps(updatedSteps);
    generateYamlDefine(updatedSteps);
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // For compatibility
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex !== null && draggedIndex !== index && dropZoneIndex !== index) {
      setDropZoneIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDropZoneIndex(null);
      return;
    }

    const newSteps = [...ruleSteps];
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

    setRuleSteps(newSteps);
    generateYamlDefine(newSteps);
    setDraggedIndex(null);
    setDropZoneIndex(null);

    // Validate sequence after reordering
    const sequenceErrors = validateStepSequence(newSteps);
    if (sequenceErrors.length === 0) {
      toast.success(t("Step order updated"));
    } else {
      toast.warning(t("Step order updated, but sequence validation: ") + sequenceErrors[0]);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropZoneIndex(null);
  };

  // Validate step sequence logic
  const validateStepSequence = (steps: RuleStep[]): string[] => {
    const errors: string[] = [];

    if (steps.length === 0) {
      errors.push(t("Rule must have at least one step"));
      return errors;
    }

    // Rule must start with an intent
    if (steps[0].type !== 'intent') {
      errors.push(t("Rule must start with an Intent"));
    }

    // Check each step in sequence
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const nextStep = steps[i + 1];
      const prevStep = steps[i - 1];

      // Intent validation
      if (currentStep.type === 'intent') {
        // Intent cannot be the last step (must be followed by action/response)
        if (i === steps.length - 1) {
          errors.push(t("Intent cannot be the last step. It must be followed by an Action or Response") + ` (step ${i + 1})`);
        }
        // Intent cannot be followed by another intent directly
        else if (nextStep && nextStep.type === 'intent') {
          errors.push(t("Intent cannot be followed directly by another Intent. Add an Action or Response between them") + ` (steps ${i + 1} and ${i + 2})`);
        }
      }

      // Action/Response validation
      if (currentStep.type === 'action' || currentStep.type === 'response') {
        // Action/Response must be preceded by an intent (or another action/response in a sequence)
        if (!prevStep) {
          errors.push(t("Action/Response cannot be the first step. It must be preceded by an Intent") + ` (step ${i + 1})`);
        }
        // If preceded by another action/response, ensure there's an intent somewhere before in the current group
        else if (prevStep.type === 'action' || prevStep.type === 'response') {
          // Find the last intent before this action sequence
          let lastIntentIndex = -1;
          for (let j = i - 1; j >= 0; j--) {
            if (steps[j].type === 'intent') {
              lastIntentIndex = j;
              break;
            }
          }

          // Check if there are any intents after the last intent that would break the sequence
          if (lastIntentIndex === -1) {
            errors.push(t("Action/Response group must be preceded by an Intent") + ` (step ${i + 1})`);
          }
        }
      }
    }

    // Additional validation: ensure no orphaned intents
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].type === 'intent') {
        // Find if this intent has any following action/response before the next intent
        let hasFollowingAction = false;
        for (let j = i + 1; j < steps.length; j++) {
          if (steps[j].type === 'intent') {
            break; // Hit another intent, stop looking
          }
          if (steps[j].type === 'action' || steps[j].type === 'response') {
            hasFollowingAction = true;
            break;
          }
        }

        if (!hasFollowingAction && i < steps.length - 1) {
          errors.push(t("Intent must have at least one Action or Response following it") + ` (step ${i + 1})`);
        }
      }
    }

    return errors;
  };

  // Validate YAML (similar to Intent validation)
  const validateYAML = (): boolean => {
    const newErrors: string[] = [];

    if (!yamlDefine.trim()) {
      newErrors.push(t("YAML definition is required"));
      setYamlErrors(newErrors);
      return false;
    }

    const lines = yamlDefine.split("\n");

    // Check if has rule declaration
    const ruleLine = lines.find((line) => line.trim().startsWith("- rule:"));
    if (!ruleLine) {
      newErrors.push(t("YAML must contain '- rule:' declaration"));
    } else {
      // Extract rule name from YAML
      const yamlRuleName = ruleLine.split(":")[1]?.trim();
      const sanitizedName = toSnakeCase(name);

      if (yamlRuleName !== sanitizedName && !isExpertMode) {
        newErrors.push(
          t("Rule name in YAML must match the name field") +
          ` (expected: ${sanitizedName}, found: ${yamlRuleName})`
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

    // Validate step sequence logic (only in visual mode where we have ruleSteps)
    if (!isExpertMode && ruleSteps.length > 0) {
      const sequenceErrors = validateStepSequence(ruleSteps);
      newErrors.push(...sequenceErrors);
    }

    setYamlErrors(newErrors);
    return newErrors.length === 0;
  };

  // Generate YAML define from steps
  const generateYamlDefine = (steps: RuleStep[]) => {
    const sanitizedName = toSnakeCase(name) || "rule_name";
    let yaml = `- rule: ${sanitizedName}\n`;

    if (steps.length > 0) {
      yaml += "  steps:\n";
      steps.forEach(step => {
        const stepId = step.data._id;
        if (step.type === 'intent') {
          yaml += `    - intent: [${stepId}]\n`;
        } else if (step.type === 'action') {
          yaml += `    - action: [${stepId}]\n`;
        } else if (step.type === 'response') {
          yaml += `    - action: [${stepId}]\n`;
        }
      });
    }

    setYamlDefine(yaml);
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!isExpertMode && !name.trim()) {
      newErrors.push(t("Rule name is required"));
    }

    if (isExpertMode) {
      if (!yamlDefine.trim()) {
        newErrors.push(t("YAML definition is required"));
      } else {
        // Basic YAML validation
        if (!yamlDefine.includes('- rule:')) {
          newErrors.push(t("YAML must contain a rule definition"));
        }
      }
    } else {
      if (ruleSteps.length === 0) {
        newErrors.push(t("At least one step is required"));
      } else {
        // Validate step sequence in visual mode
        const sequenceErrors = validateStepSequence(ruleSteps);
        newErrors.push(...sequenceErrors);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Validate YAML before submitting
    if (!validateYAML()) {
      toast.error(t("Please fix YAML errors before submitting"));
      return;
    }

    try {
      let ruleData;

      if (isExpertMode) {
        // In expert mode, use selected items from Expert Mode
        const yamlLines = yamlDefine.split('\n');
        const ruleNameLine = yamlLines.find(line => line.trim().startsWith('- rule:'));
        const yamlRuleName = ruleNameLine ? ruleNameLine.split('- rule:')[1]?.trim() : toSnakeCase(name);

        ruleData = {
          ...(initialRule?._id && { _id: initialRule._id }), // Include _id for updates
          name: name.trim() || yamlRuleName?.replace(/_/g, ' ').toUpperCase() || "Untitled Rule",
          description: description.trim(),
          define: yamlDefine,
          intents: selectedIntents.map(intent => intent._id),
          action: selectedActions.map(action => action._id),
          responses: selectedResponses.map(response => response._id),
          roles: [],
        };
      } else {
        // Visual mode - extract from ruleSteps
        const usedIntents = ruleSteps
          .filter(step => step.type === 'intent')
          .map(step => step.data._id);
        const usedActions = ruleSteps
          .filter(step => step.type === 'action')
          .map(step => step.data._id);
        const usedResponses = ruleSteps
          .filter(step => step.type === 'response')
          .map(step => step.data._id);

        ruleData = {
          ...(initialRule?._id && { _id: initialRule._id }), // Include _id for updates
          name: name.trim(),
          description: description.trim(),
          define: yamlDefine,
          intents: [...new Set(usedIntents)],
          action: [...new Set(usedActions)],
          responses: [...new Set(usedResponses)],
          roles: [],
        };
      }

      await onSubmit(ruleData);
    } catch (error) {
      console.error("Error submitting rule:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label className="text-sm font-medium">{t("Expert Mode")}</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Enable to edit YAML directly instead of using the visual interface")}
            </p>
          </div>
        </div>
        <Switch
          checked={isExpertMode}
          onCheckedChange={setIsExpertMode}
        />
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">{t("Rule Name")} *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("Enter rule name")}
          />
        </div>
        <div>
          <Label htmlFor="description">{t("Description")}</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("Enter rule description")}
            rows={3}
          />
        </div>
      </div>

      {/* Steps - Visual Mode */}
      {!isExpertMode && (
        <div>
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t("Steps")}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIntentStep}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("Add Intent")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addActionStep}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("Add Action")}
                </Button>
              </div>
            </div>
            {ruleSteps.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t("Drag and drop steps to reorder them. The order matters for rule execution.")}
                </p>
                <p className="text-xs text-blue-600">
                  {t("Rules format: Intent → Action/Response → Intent → Action/Response...")}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {ruleSteps.map((step, index) => {
              // Check if this specific step has validation issues
              const sequenceErrors = validateStepSequence(ruleSteps);
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
                    className={`flex items-center gap-2 p-2 border rounded-md cursor-move transition-all duration-200 ${isBeingDragged
                      ? 'opacity-30 scale-95 shadow-lg border-blue-300'
                      : isDropTarget && draggedIndex !== null
                        ? 'bg-blue-50 border-blue-400 border-2 shadow-md'
                        : hasError
                          ? 'bg-red-50 border-red-200 hover:shadow-sm'
                          : 'bg-muted/50 hover:shadow-sm'
                      }`}
                    draggable={!isBeingDragged}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <GripVertical className={`h-4 w-4 flex-shrink-0 ${isBeingDragged ? 'text-blue-500' : 'text-muted-foreground'
                      }`} />
                    <div className="flex items-center gap-2 flex-1">
                      <Badge variant={
                        step.type === 'intent' ? 'default' :
                          step.type === 'action' ? 'secondary' : 'outline'
                      }>
                        {step.type === 'intent' ? 'Intent' :
                          step.type === 'action' ? 'Action' : 'Response'}
                      </Badge>
                      <span className="flex-1 text-sm">
                        {(step.data as any).name || `${step.type === 'intent' ? 'Intent' : step.type === 'action' ? 'Action' : 'Response'} ...${step.data._id.slice(-6)}`}
                      </span>
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
            })}
            {ruleSteps.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                {t("No steps added yet. Click 'Add Intent' or 'Add Action' to start building your rule.")}
              </div>
            )}

            {/* Drop zone at the end for appending */}
            {draggedIndex !== null && (
              <div
                className="mt-2"
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dropZoneIndex !== ruleSteps.length) {
                    setDropZoneIndex(ruleSteps.length);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIndex !== null) {
                    const newSteps = [...ruleSteps];
                    const draggedStep = newSteps.splice(draggedIndex, 1)[0];
                    newSteps.push(draggedStep);

                    setRuleSteps(newSteps);
                    generateYamlDefine(newSteps);
                    setDraggedIndex(null);
                    setDropZoneIndex(null);

                    toast.success(t("Step moved to end"));
                  }
                }}
              >
                {/* Blue line indicator for end drop */}
                {dropZoneIndex === ruleSteps.length && (
                  <div className="h-0.5 bg-blue-500 rounded-full shadow-sm mb-2"></div>
                )}
                <div className="h-6 border-2 border-dashed border-blue-300 rounded-md bg-blue-50 flex items-center justify-center transition-all duration-200 hover:border-blue-400 hover:bg-blue-100">
                  <span className="text-xs text-blue-600 font-medium">
                    {t("Drop here to move to end")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* YAML Editor - Expert Mode */}
      {isExpertMode && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">{t("YAML Definition")}</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={generateTemplate}
              className="gap-2"
            >
              <FileCode className="h-4 w-4" />
              {t("Generate Template")}
            </Button>
          </div>
          <Textarea
            ref={textareaRef}
            value={yamlDefine}
            onChange={(e) => setYamlDefine(e.target.value)}
            onBlur={validateYAML}
            placeholder={t("Enter YAML rule definition...")}
            rows={12}
            className={`font-mono text-sm ${yamlErrors.length > 0 ? 'border-red-500' : ''}`}
          />
          {yamlErrors.length > 0 && (
            <div className="mt-2 space-y-1">
              {yamlErrors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-red-600 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {t("Edit the YAML definition directly. Make sure to follow RASA rules format.")}
          </p>

          {/* Expert Mode Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIntentDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("Add Intent")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("Add Action")}
            </Button>
          </div>

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
                    onClick={() => handleIntentClick(intent)}
                    title={t("Click to insert ID at cursor position")}
                  >
                    <span>{intent.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveIntent(intent._id);
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
                    onClick={() => handleActionClick(action)}
                    title={t("Click to insert ID at cursor position")}
                  >
                    <span>{action.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAction(action._id);
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
                    onClick={() => handleResponseClick(response)}
                    title={t("Click to insert ID at cursor position")}
                  >
                    <span>{response.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveResponse(response._id);
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
        </div>
      )}

      {/* Preview - Only in Visual Mode */}
      {!isExpertMode && (
        <div>
          <Label className="text-sm font-medium mb-2 block">{t("Preview")}</Label>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {yamlDefine}
            </pre>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="text-red-600 text-sm">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t("Cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || (!isExpertMode && ruleSteps.length === 0) || (isExpertMode && !yamlDefine.trim())}
        >
          {isSubmitting ? t("Saving...") : submitButtonText}
        </Button>
      </div>

      {/* Intent Dialog */}
      <Dialog open={intentDialogOpen} onOpenChange={setIntentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Intent</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search intents..."
                value={intentSearchQuery}
                onChange={(e) => setIntentSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="intent-deleted"
                        checked={intentFilterDeleted}
                        onCheckedChange={(checked) => setIntentFilterDeleted(checked === true)}
                      />
                      <Label htmlFor="intent-deleted" className="text-sm">
                        {t("Include deleted intents")}
                      </Label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {intentSearchResults.map((intent) => (
                <div
                  key={intent._id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSelectIntent(intent)}
                >
                  <p className="font-medium">{intent.name}</p>
                  {intent.description && (
                    <p className="text-sm text-muted-foreground mt-1">{intent.description}</p>
                  )}
                </div>
              ))}
              {intentSearchQuery && intentSearchResults.length === 0 && !isSearchingIntents && (
                <div className="p-4 text-center text-muted-foreground">
                  No intents found
                </div>
              )}
              {isSearchingIntents && (
                <div className="p-4 text-center text-muted-foreground">
                  Searching...
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action/Response Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Action or Response</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Actions Section */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Custom Actions</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search custom actions..."
                  value={actionSearchQuery}
                  onChange={(e) => setActionSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="action-deleted"
                          checked={actionFilterDeleted}
                          onCheckedChange={(checked) => setActionFilterDeleted(checked === true)}
                        />
                        <Label htmlFor="action-deleted" className="text-sm">
                          {t("Include deleted actions")}
                        </Label>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {actionSearchResults.map((action) => (
                  <div
                    key={action._id}
                    className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelectAction(action)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Action</Badge>
                      <p className="font-medium">{action.name}</p>
                    </div>
                    {action.description && (
                      <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                    )}
                  </div>
                ))}
                {actionSearchQuery && actionSearchResults.length === 0 && !isSearchingActions && (
                  <div className="p-4 text-center text-muted-foreground">
                    No custom actions found
                  </div>
                )}
                {isSearchingActions && (
                  <div className="p-4 text-center text-muted-foreground">
                    Searching...
                  </div>
                )}
              </div>
            </div>

            {/* Responses Section */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Response Actions</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search responses..."
                  value={responseSearchQuery}
                  onChange={(e) => setResponseSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="response-deleted"
                          checked={responseFilterDeleted}
                          onCheckedChange={(checked) => setResponseFilterDeleted(checked === true)}
                        />
                        <Label htmlFor="response-deleted" className="text-sm">
                          {t("Include deleted responses")}
                        </Label>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {responseSearchResults.map((response) => (
                  <div
                    key={response._id}
                    className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelectResponse(response)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Response</Badge>
                      <p className="font-medium">{response.name}</p>
                    </div>
                    {response.description && (
                      <p className="text-sm text-muted-foreground mt-1">{response.description}</p>
                    )}
                  </div>
                ))}
                {responseSearchQuery && responseSearchResults.length === 0 && !isSearchingResponses && (
                  <div className="p-4 text-center text-muted-foreground">
                    No responses found
                  </div>
                )}
                {isSearchingResponses && (
                  <div className="p-4 text-center text-muted-foreground">
                    Searching...
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                {t("Rule Guide")}
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
              {/* What is Rule */}
              <section>
                <h3 className="text-lg font-semibold mb-3 text-blue-600">
                  📌 {t("What is a Rule?")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {t("A Rule defines fixed conversation patterns that your bot should always follow. Rules are useful for handling specific conversation flows like greetings, FAQs, or fallback responses.")}
                </p>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-sm font-medium mb-2">{t("Examples")}:</p>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• <code className="bg-white dark:bg-gray-900 px-1 rounded">greeting_rule</code> - {t("Always respond to greetings")}</li>
                    <li>• <code className="bg-white dark:bg-gray-900 px-1 rounded">goodbye_rule</code> - {t("Handle farewell messages")}</li>
                    <li>• <code className="bg-white dark:bg-gray-900 px-1 rounded">fallback_rule</code> - {t("Handle unknown messages")}</li>
                  </ul>
                </div>
              </section>

              {/* Rule Structure */}
              <section>
                <h3 className="text-lg font-semibold mb-3 text-green-600">
                  🏗️ {t("Rule Structure")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
                  {t("Rules consist of steps that define the conversation flow:")}
                </p>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg font-mono text-sm">
                  <pre>{`- rule: greeting_rule
  steps:
    - intent: greet
    - action: utter_greet`}</pre>
                </div>
                <ul className="mt-3 text-sm space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• <strong>Intent:</strong> {t("User's message intent")}</li>
                  <li>• <strong>Action:</strong> {t("Bot's response action")}</li>
                  <li>• <strong>Response:</strong> {t("Direct text response")}</li>
                </ul>
              </section>

              {/* Best Practices */}
              <section>
                <h3 className="text-lg font-semibold mb-3 text-orange-600">
                  💡 {t("Best Practices")}
                </h3>
                <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• {t("Keep rules simple and focused on specific patterns")}</li>
                  <li>• {t("Use clear, descriptive names for rules")}</li>
                  <li>• {t("Test rules with different user inputs")}</li>
                  <li>• {t("Avoid overly complex rule chains")}</li>
                  <li>• {t("Use stories for complex conversation flows")}</li>
                </ul>
              </section>

              {/* Expert Mode */}
              <section>
                <h3 className="text-lg font-semibold mb-3 text-purple-600">
                  ⚡ {t("Expert Mode")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {t("In Expert Mode, you can write YAML directly. Use the Generate Template button to get started with proper YAML structure.")}
                </p>
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <p className="text-sm font-medium mb-2">{t("Tips")}:</p>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• {t("Use consistent indentation (2 spaces)")}</li>
                    <li>• {t("Follow RASA YAML syntax")}</li>
                    <li>• {t("Validate your YAML before saving")}</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
