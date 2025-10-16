import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const [finetune, setFinetune] = useState(false);

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
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [chatbotsRes, rulesRes, storiesRes] = await Promise.all([
        trainingService.getAllChatbots(),
        trainingService.getAllRules(),
        trainingService.getAllStories(),
      ]);

      setChatbots(chatbotsRes.data || []);
      setRules(rulesRes.data || []);
      setStories(storiesRes.data || []);

      // Auto select first chatbot if available
      if (chatbotsRes.data && chatbotsRes.data.length > 0) {
        setSelectedChatbot(chatbotsRes.data[0]._id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("Failed to load data"));
    } finally {
      setIsLoading(false);
    }
  };

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

    if (selectedRules.length === 0) {
      toast.error(t("Please select at least one rule"));
      return;
    }

    if (selectedStories.length === 0) {
      toast.error(t("Please select at least one story"));
      return;
    }

    try {
      setIsTraining(true);
      await trainingService.trainModel(selectedChatbot, {
        ruleIds: selectedRules,
        storyIds: selectedStories,
        firetune: finetune,
      });

      toast.success(t("Training started successfully"));
      onTrainSuccess();
      onOpenChange(false);

      // Reset form
      setSelectedRules([]);
      setSelectedStories([]);
      setFinetune(false);
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
    setFinetune(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Train className="h-5 w-5" />
            {t("Train Model")}
          </DialogTitle>
          <DialogDescription>
            {t("Select rules, stories and configure training options")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            {/* Chatbot Selection */}
            <div className="space-y-2">
              <Label htmlFor="chatbot">{t("Select Chatbot")}</Label>
              <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Choose a chatbot")} />
                </SelectTrigger>
                <SelectContent>
                  {chatbots.map((chatbot) => (
                    <SelectItem key={chatbot._id} value={chatbot._id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{chatbot.name}</span>
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
              <div className="flex-1 flex flex-col">
                <Label className="mb-2">{t("Select Rules")} ({selectedRules.length})</Label>
                <div className="flex-1 border rounded-md p-4 overflow-y-auto">
                  {rules.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t("No rules available")}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {rules.map((rule) => (
                        <div key={rule._id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`rule-${rule._id}`}
                            checked={selectedRules.includes(rule._id)}
                            onCheckedChange={() => handleRuleToggle(rule._id)}
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`rule-${rule._id}`}
                              className="text-sm font-medium cursor-pointer block"
                            >
                              {rule.name}
                            </label>
                            {rule.description && (
                              <p className="text-xs text-muted-foreground mt-1">
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
              <div className="flex-1 flex flex-col">
                <Label className="mb-2">{t("Select Stories")} ({selectedStories.length})</Label>
                <div className="flex-1 border rounded-md p-4 overflow-y-auto">
                  {stories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t("No stories available")}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {stories.map((story) => (
                        <div key={story._id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`story-${story._id}`}
                            checked={selectedStories.includes(story._id)}
                            onCheckedChange={() => handleStoryToggle(story._id)}
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`story-${story._id}`}
                              className="text-sm font-medium cursor-pointer block"
                            >
                              {story.name}
                            </label>
                            {story.description && (
                              <p className="text-xs text-muted-foreground mt-1">
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

            {/* Finetune Option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="finetune"
                checked={finetune}
                onCheckedChange={(checked) => setFinetune(checked as boolean)}
              />
              <Label htmlFor="finetune" className="text-sm font-medium">
                {t("Enable Finetune")}
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isTraining}
              >
                {t("Cancel")}
              </Button>
              <Button
                onClick={handleTrain}
                disabled={isTraining || !selectedChatbot || selectedRules.length === 0 || selectedStories.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isTraining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("Training...")}
                  </>
                ) : (
                  <>
                    <Train className="mr-2 h-4 w-4" />
                    {t("Start Training")}
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
