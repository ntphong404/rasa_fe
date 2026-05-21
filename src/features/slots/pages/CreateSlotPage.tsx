import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useChatbotStore } from "@/store/chatbot";
import { useChatbots } from "@/hooks/useChatbots";
import { useAuthStore } from "@/store/auth";
import { slotService } from "../api/service";
import { intentService } from "@/features/intents/api/service";
import { entityService } from "@/features/entity/api/service";
import { actionService } from "@/features/action/api/service";
import { IIntent } from "@/interfaces/intent.interface";
import { IEntity } from "@/interfaces/entity.interface";
import { IAction } from "@/interfaces/action.interface";

const normalizeIds = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toSnakeCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const SLOT_TYPES = ["text", "bool", "categorical", "float", "list", "any"] as const;

const buildSlotDefine = (
  name: string,
  slotType: string,
  influenceConversation: boolean,
  entityId: string,
  intentId: string,
  intentValue: string,
  actionId: string,
  categoricalValues: string,
) => {
  const slotName = toSnakeCase(name) || "slot_name";
  const lines = [`${slotName}:`];
  lines.push(`  type: ${slotType}`);

  if (slotType === "categorical" && categoricalValues.trim()) {
    const vals = categoricalValues.split(",").map((v) => v.trim()).filter(Boolean);
    if (vals.length > 0) {
      lines.push(`  values:`);
      vals.forEach((v) => lines.push(`  - ${v}`));
    }
  }

  lines.push(`  influence_conversation: ${influenceConversation}`);

  const mappings: string[] = [];
  if (entityId) {
    mappings.push(`  - type: from_entity\n    entity: [${entityId}]`);
  }
  if (intentId) {
    const valPart = intentValue.trim() ? `\n    value: "${intentValue.trim()}"` : "";
    mappings.push(`  - type: from_intent\n    intent: [${intentId}]${valPart}`);
  }
  if (actionId) {
    mappings.push(`  - type: custom`);
  }

  if (mappings.length > 0) {
    lines.push(`  mappings:`);
    lines.push(mappings.join("\n"));
  } else {
    lines.push(`  mappings: []`);
  }

  return lines.join("\n");
};

export function CreateSlotPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  const user = useAuthStore((state) => state.user);
  const { chatbots } = useChatbots();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [define, setDefine] = useState("");
  const [slotType, setSlotType] = useState<string>("text");
  const [influenceConversation, setInfluenceConversation] = useState(true);
  const [intentValue, setIntentValue] = useState("");
  const [categoricalValues, setCategoricalValues] = useState("");
  const [botIds, setBotIds] = useState<string[]>([]);
  const [entityId, setEntityId] = useState("");
  const [intentId, setIntentId] = useState("");
  const [actionId, setActionId] = useState("");
  const [entityName, setEntityName] = useState("");
  const [intentName, setIntentName] = useState("");
  const [actionName, setActionName] = useState("");
  const [rolesText, setRolesText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entitySearch, setEntitySearch] = useState("");
  const [intentSearch, setIntentSearch] = useState("");
  const [actionSearch, setActionSearch] = useState("");
  const [entityResults, setEntityResults] = useState<IEntity[]>([]);
  const [intentResults, setIntentResults] = useState<IIntent[]>([]);
  const [actionResults, setActionResults] = useState<IAction[]>([]);
  const [isEntitySearching, setIsEntitySearching] = useState(false);
  const [isIntentSearching, setIsIntentSearching] = useState(false);
  const [isActionSearching, setIsActionSearching] = useState(false);
  const [entityOpen, setEntityOpen] = useState(false);
  const [intentOpen, setIntentOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);

  const isManager = useMemo(
    () => Boolean(user?.roles?.some((role) => role.name?.toUpperCase() === "MANAGER")),
    [user?.roles]
  );
  const managerAssignedBotId = useMemo(() => user?.managedBotIds?.[0] || null, [user?.managedBotIds]);

  useEffect(() => {
    if (!entitySearch.trim()) {
      setEntityResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      try {
        setIsEntitySearching(true);
        const response = await entityService.fetchEntities({ search: entitySearch, page: 1, limit: 10 });
        setEntityResults(response.data || []);
      } catch (error) {
        console.error("Error searching entities:", error);
      } finally {
        setIsEntitySearching(false);
      }
    }, 250);

    return () => clearTimeout(debounce);
  }, [entitySearch]);

  useEffect(() => {
    if (!intentSearch.trim()) {
      setIntentResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      try {
        setIsIntentSearching(true);
        const response = await intentService.fetchIntents({ search: intentSearch, page: 1, limit: 10 });
        setIntentResults(response.data || []);
      } catch (error) {
        console.error("Error searching intents:", error);
      } finally {
        setIsIntentSearching(false);
      }
    }, 250);

    return () => clearTimeout(debounce);
  }, [intentSearch]);

  useEffect(() => {
    if (!actionSearch.trim()) {
      setActionResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      try {
        setIsActionSearching(true);
        const response = await actionService.fetchActions({ search: actionSearch, page: 1, limit: 10 });
        setActionResults(response.data || []);
      } catch (error) {
        console.error("Error searching actions:", error);
      } finally {
        setIsActionSearching(false);
      }
    }, 250);

    return () => clearTimeout(debounce);
  }, [actionSearch]);

  useEffect(() => {
    setDefine(buildSlotDefine(name, slotType, influenceConversation, entityId, intentId, intentValue, actionId, categoricalValues));
  }, [name, slotType, influenceConversation, entityId, intentId, intentValue, actionId, categoricalValues]);

  useEffect(() => {
    if (isManager) {
      setBotIds(managerAssignedBotId ? [managerAssignedBotId] : []);
      return;
    }

    if (selectedBotId && selectedBotId !== "global") {
      setBotIds((prev) => (prev.includes(selectedBotId) ? prev : [selectedBotId]));
      return;
    }

    if (chatbots.length > 0) {
      setBotIds((prev) => (prev.length > 0 ? prev : [chatbots[0].botId]));
    }
  }, [chatbots, isManager, managerAssignedBotId, selectedBotId]);

  const handleToggleBot = (botId: string) => {
    setBotIds((prev) =>
      prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]
    );
  };

  const selectEntity = (entity: IEntity) => {
    setEntityId(entity._id);
    setEntityName(entity.name);
    setEntitySearch("");
    setEntityOpen(false);
  };

  const selectIntent = (intent: IIntent) => {
    setIntentId(intent._id);
    setIntentName(intent.name);
    setIntentSearch("");
    setIntentOpen(false);
  };

  const selectAction = (action: IAction) => {
    setActionId(action._id);
    setActionName(action.name);
    setActionSearch("");
    setActionOpen(false);
  };

  const clearEntity = () => {
    setEntityId("");
    setEntityName("");
    setEntitySearch("");
    setEntityOpen(false);
  };

  const clearIntent = () => {
    setIntentId("");
    setIntentName("");
    setIntentSearch("");
    setIntentOpen(false);
  };

  const clearAction = () => {
    setActionId("");
    setActionName("");
    setActionSearch("");
    setActionOpen(false);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedDefine = define.trim();

    if (!trimmedName) {
      toast.error(t("slotpage-validation-name-required"));
      return;
    }

    if (!trimmedDefine) {
      toast.error(t("slotpage-validation-define-required"));
      return;
    }

    if (botIds.length === 0) {
      toast.error(t("slotpage-validation-chatbot-required"));
      return;
    }

    try {
      setIsSubmitting(true);
      await slotService.createSlot({
        name: trimmedName,
        description: description.trim(),
        define: trimmedDefine,
        botIds,
        entity: entityId.trim() || null,
        intent: intentId.trim() || null,
        action: actionId.trim() || null,
        roles: normalizeIds(rolesText),
      });
      toast.success(t("slotpage-create-success"));
      navigate("/slots");
    } catch (error) {
      console.error("Error creating slot:", error);
      toast.error(t("slotpage-create-error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-page container mx-auto max-w-4xl py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/slots")}> <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}</Button>
        <h1 className="text-3xl font-bold">{t("slotpage-create-page-title")}</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="slot-name">{t("slotpage-slot-name-label")} *</Label>
          <Input id="slot-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("slotpage-slot-name-placeholder")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slot-description">{t("Description")}</Label>
          <Textarea id="slot-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t("slotpage-description-placeholder")} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("Slot Type")} *</Label>
            <Select value={slotType} onValueChange={setSlotType}>
              <SelectTrigger>
                <SelectValue placeholder={t("Select slot type")} />
              </SelectTrigger>
              <SelectContent>
                {SLOT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex items-center gap-3 pt-6">
            <Checkbox
              id="influence-conversation"
              checked={influenceConversation}
              onCheckedChange={(checked) => setInfluenceConversation(checked === true)}
            />
            <Label htmlFor="influence-conversation">{t("Influence conversation")}</Label>
          </div>
        </div>

        {slotType === "categorical" && (
          <div className="space-y-2">
            <Label>{t("Categorical Values")}</Label>
            <Input
              value={categoricalValues}
              onChange={(e) => setCategoricalValues(e.target.value)}
              placeholder={t("e.g. high, medium, low")}
            />
            <p className="text-xs text-muted-foreground">{t("Comma-separated values")}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="slot-define">{t("slotpage-define-label")} *</Label>
          <Textarea id="slot-define" value={define} onChange={(e) => setDefine(e.target.value)} rows={10} className="font-mono text-sm" placeholder={t("slotpage-define-placeholder")} />
          <p className="text-xs text-muted-foreground">{t("Auto-generated. Edit manually if needed.")}</p>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-1">
            <Label>{t("slotpage-chatbots-label")} *</Label>
            <p className="text-xs text-muted-foreground">{t("slotpage-chatbots-help")}</p>
          </div>

          {isManager ? (
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              {managerAssignedBotId ? (
                <Badge variant="secondary">{chatbots.find((bot) => bot.botId === managerAssignedBotId)?.name || managerAssignedBotId}</Badge>
              ) : (
                t("slotpage-no-chatbot-assigned")
              )}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {chatbots.filter((bot) => bot.botId !== "global").map((bot) => (
                <label key={bot._id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <Checkbox checked={botIds.includes(bot.botId)} onCheckedChange={() => handleToggleBot(bot.botId)} />
                  <span>{bot.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("slotpage-entity-id-label")}</Label>
            <Popover open={entityOpen} onOpenChange={setEntityOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {entityName || t("slotpage-entity-id-placeholder")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder={t("Search entities")} value={entitySearch} onValueChange={setEntitySearch} />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem value="clear-entity" onSelect={clearEntity}>
                        {t("Clear selection")}
                      </CommandItem>
                    </CommandGroup>
                    <CommandEmpty>{isEntitySearching ? t("Loading...") : t("No entities found")}</CommandEmpty>
                    <CommandGroup>
                      {entityResults.map((entity) => (
                        <CommandItem key={entity._id} value={entity.name} onSelect={() => selectEntity(entity)}>
                          {entity.name}
                          <Check className={cn("ml-auto", entity._id === entityId ? "opacity-100" : "opacity-0")} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>{t("slotpage-intent-id-label")}</Label>
            <Popover open={intentOpen} onOpenChange={setIntentOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {intentName || t("slotpage-intent-id-placeholder")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder={t("Search intents")} value={intentSearch} onValueChange={setIntentSearch} />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem value="clear-intent" onSelect={clearIntent}>
                        {t("Clear selection")}
                      </CommandItem>
                    </CommandGroup>
                    <CommandEmpty>{isIntentSearching ? t("Loading...") : t("No intents found")}</CommandEmpty>
                    <CommandGroup>
                      {intentResults.map((intent) => (
                        <CommandItem key={intent._id} value={intent.name} onSelect={() => selectIntent(intent)}>
                          {intent.name}
                          <Check className={cn("ml-auto", intent._id === intentId ? "opacity-100" : "opacity-0")} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {intentId && (
            <div className="space-y-2">
              <Label>{t("Intent Value")}</Label>
              <Input
                value={intentValue}
                onChange={(e) => setIntentValue(e.target.value)}
                placeholder={t("Value to set when intent matched")}
              />
              <p className="text-xs text-muted-foreground">{t("Required for from_intent mapping")}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label>{t("slotpage-action-id-label")}</Label>
            <Popover open={actionOpen} onOpenChange={setActionOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {actionName || t("slotpage-action-id-placeholder")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder={t("Search actions")} value={actionSearch} onValueChange={setActionSearch} />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem value="clear-action" onSelect={clearAction}>
                        {t("Clear selection")}
                      </CommandItem>
                    </CommandGroup>
                    <CommandEmpty>{isActionSearching ? t("Loading...") : t("No actions found")}</CommandEmpty>
                    <CommandGroup>
                      {actionResults.map((action) => (
                        <CommandItem key={action._id} value={action.name} onSelect={() => selectAction(action)}>
                          {action.name}
                          <Check className={cn("ml-auto", action._id === actionId ? "opacity-100" : "opacity-0")} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slot-roles">{t("slotpage-role-ids-label")}</Label>
          <Input id="slot-roles" value={rolesText} onChange={(e) => setRolesText(e.target.value)} placeholder={t("slotpage-role-ids-placeholder")} />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => navigate("/slots")} disabled={isSubmitting}>{t("Cancel")}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? t("Creating...") : <><Plus className="mr-2 h-4 w-4" />{t("slotpage-create-submit-button")}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}