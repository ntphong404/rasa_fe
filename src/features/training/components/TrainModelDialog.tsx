import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Train } from "lucide-react";
import { toast } from "sonner";
import { trainingService } from "../api/service";
import { IRule } from "@/interfaces/rule.interface";
import { IStory } from "@/interfaces/story.interface";
import { IChatbot } from "@/interfaces/chatbot.interface";
import { useTranslation } from "react-i18next";

interface TrainModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTrainSuccess: () => void;
}

export function TrainModelDialog({
  open,
  onOpenChange,
  onTrainSuccess,
}: TrainModelDialogProps) {
  const { t } = useTranslation();
  // Form state
  const [selectedChatbot, setSelectedChatbot] = useState<string>("");
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [selectedStories, setSelectedStories] = useState<string[]>([]);

  // Data
  const [chatbots, setChatbots] = useState<IChatbot[]>([]);
  const [rules, setRules] = useState<IRule[]>([]);
  const [stories, setStories] = useState<IStory[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (open) {
      loadChatbots();
    }
  }, [open]);

  const loadChatbots = async () => {
    try {
      setIsLoading(true);
      const chatbotsRes = await trainingService.getAllChatbots();

      setChatbots(chatbotsRes.data || []);

      // Auto select first chatbot if available
      if (chatbotsRes.data && chatbotsRes.data.length > 0) {
        setSelectedChatbot(chatbotsRes.data[0]._id);
      } else {
        setSelectedChatbot("");
        setRules([]);
        setStories([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("Failed to load data"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !selectedChatbot) {
      return;
    }

    const loadTrainItemsByChatbot = async () => {
      try {
        setIsLoading(true);
        const chatbot = chatbots.find((item) => item._id === selectedChatbot);
        const botId = chatbot?.botId;

        const [rulesRes, storiesRes] = await Promise.all([
          trainingService.getAllRules(botId),
          trainingService.getAllStories(botId),
        ]);

        setRules(rulesRes.data || []);
        setStories(storiesRes.data || []);
        setSelectedRules([]);
        setSelectedStories([]);
      } catch (error) {
        console.error("Error loading train items by chatbot:", error);
        toast.error(t("Failed to load rules and stories by chatbot"));
      } finally {
        setIsLoading(false);
      }
    };

    loadTrainItemsByChatbot();
  }, [open, selectedChatbot, chatbots]);

  const handleRuleToggle = (ruleId: string) => {
    setSelectedRules((prev) =>
      prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleStoryToggle = (storyId: string) => {
    setSelectedStories((prev) =>
      prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId]
    );
  };

  const handleTrain = async () => {
    if (!selectedChatbot) {
      toast.error(t("Please select a chatbot"));
      return;
    }

    if (selectedRules.length === 0 && selectedStories.length === 0) {
      toast.error(t("Please select at least one rule or one story"));
      return;
    }

    try {
      setIsTraining(true);
      await trainingService.trainModel(selectedChatbot, {
        ruleIds: selectedRules,
        storyIds: selectedStories,
        firetune: false,
      });

      toast.success(t("Training started successfully"));
      onTrainSuccess();
      onOpenChange(false);

      // Reset form
      setSelectedRules([]);
      setSelectedStories([]);
    } catch (error) {
      console.error("Error training model:", error);
      toast.error(t("Failed to start training"));
    } finally {
      setIsTraining(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setSelectedRules([]);
    setSelectedStories([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[88vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-cyan-900">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Train className="h-6 w-6 text-cyan-600" />
            </div>
            {t("Train model")}
          </DialogTitle>
          <DialogDescription className="text-cyan-700 text-base mt-1">
            {t("Select rules, stories, and configure training options")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{t("Loading data...")}</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden px-6 py-5 bg-slate-50/40">
            {/* Chatbot Selection */}
            <div className="bg-white border rounded-lg p-4 shadow-sm space-y-2">
              <Label htmlFor="chatbot" className="text-base font-semibold text-slate-800">{t("Select chatbot")}</Label>
              <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
                <SelectTrigger className="h-auto py-3">
                  <SelectValue placeholder={t("Select a chatbot")} />
                </SelectTrigger>
                <SelectContent>
                  {chatbots.map((chatbot) => (
                    <SelectItem key={chatbot._id} value={chatbot._id}>
                      <div className="flex flex-col py-1">
                        <span className="font-medium text-sm">{chatbot.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {chatbot.ip}:{chatbot.rasaPort}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
              {/* Rules Selection */}
              <div className="flex-1 flex flex-col bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
                  <Label className="text-base font-semibold text-blue-900">
                    {t("Select rules")}
                    <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {selectedRules.length}
                    </span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedRules.length === rules.length) {
                        setSelectedRules([]);
                      } else {
                        setSelectedRules(rules.map(r => r._id));
                      }
                    }}
                    className="text-xs h-8 px-3 border-blue-200 text-blue-700 hover:text-blue-900"
                  >
                    {selectedRules.length === rules.length ? t("Unselect all") : t("Select all")}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {rules.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      {t("No rules available")}
                    </p>
                  ) : (
                    <div>
                      {rules.map((rule) => (
                        <div key={rule._id} className="flex items-start space-x-3 px-4 py-2 hover:bg-blue-50/70 transition-colors border-b border-slate-100 last:border-0">
                          <Checkbox
                            id={`rule-${rule._id}`}
                            checked={selectedRules.includes(rule._id)}
                            onCheckedChange={() => handleRuleToggle(rule._id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`rule-${rule._id}`}
                              className="text-sm font-medium cursor-pointer block hover:text-blue-700"
                            >
                              {rule.name}
                            </label>
                            {rule.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {rule.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stories Selection */}
              <div className="flex-1 flex flex-col bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b bg-gradient-to-r from-purple-50 to-fuchsia-50 flex items-center justify-between">
                  <Label className="text-base font-semibold text-purple-900">
                    {t("Select stories")}
                    <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                      {selectedStories.length}
                    </span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedStories.length === stories.length) {
                        setSelectedStories([]);
                      } else {
                        setSelectedStories(stories.map(s => s._id));
                      }
                    }}
                    className="text-xs h-8 px-3 border-purple-200 text-purple-700 hover:text-purple-900"
                  >
                    {selectedStories.length === stories.length ? t("Unselect all") : t("Select all")}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {stories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      {t("No stories available")}
                    </p>
                  ) : (
                    <div>
                      {stories.map((story) => (
                        <div key={story._id} className="flex items-start space-x-3 px-4 py-2 hover:bg-purple-50/70 transition-colors border-b border-slate-100 last:border-0">
                          <Checkbox
                            id={`story-${story._id}`}
                            checked={selectedStories.includes(story._id)}
                            onCheckedChange={() => handleStoryToggle(story._id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`story-${story._id}`}
                              className="text-sm font-medium cursor-pointer block hover:text-purple-700"
                            >
                              {story.name}
                            </label>
                            {story.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {story.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 pb-2 border-t bg-white/80">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isTraining}
                className="px-6"
              >
                {t("Cancel")}
              </Button>
              <Button
                onClick={handleTrain}
                disabled={isTraining || !selectedChatbot || (selectedRules.length === 0 && selectedStories.length === 0)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6"
              >
                {isTraining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Training...")}
                  </>
                ) : (
                  <>
                    <Train className="mr-2 h-4 w-4" />
                    {t("Start training")}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
