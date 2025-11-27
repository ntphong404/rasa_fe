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
      toast.error("Không thể tải dữ liệu");
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
      toast.error("Vui lòng chọn chatbot");
      return;
    }

    if (selectedRules.length === 0) {
      toast.error("Vui lòng chọn ít nhất một Rule");
      return;
    }

    if (selectedStories.length === 0) {
      toast.error("Vui lòng chọn ít nhất một Story");
      return;
    }

    try {
      setIsTraining(true);
      await trainingService.trainModel(selectedChatbot, {
        ruleIds: selectedRules,
        storyIds: selectedStories,
        firetune: false,
      });

      toast.success("Bắt đầu huấn luyện thành công");
      onTrainSuccess();
      onOpenChange(false);

      // Reset form
      setSelectedRules([]);
      setSelectedStories([]);
    } catch (error) {
      console.error("Error training model:", error);
      toast.error("Không thể bắt đầu huấn luyện");
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
      <DialogContent className="max-w-[85vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-1 border-b">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Train className="h-6 w-6 text-green-600" />
            Huấn luyện mô hình
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Chọn Rules, Stories và cấu hình các tùy chọn huấn luyện
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden px-6">
            {/* Chatbot Selection */}
            <div className="space-y-2">
              <Label htmlFor="chatbot" className="text-base font-semibold">Chọn Chatbot</Label>
              <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
                <SelectTrigger className="h-auto py-3">
                  <SelectValue placeholder="Chọn một chatbot" />
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
              <div className="flex-1 flex flex-col bg-white rounded-lg border shadow-sm">
                <div className="px-5 py-3 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 flex items-center justify-between">
                  <Label className="text-base font-semibold text-blue-900">
                    Chọn Rules
                    <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {selectedRules.length}
                    </span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedRules.length === rules.length) {
                        setSelectedRules([]);
                      } else {
                        setSelectedRules(rules.map(r => r._id));
                      }
                    }}
                    className="text-xs h-7 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                  >
                    {selectedRules.length === rules.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {rules.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      Không có Rules nào
                    </p>
                  ) : (
                    <div>
                      {rules.map((rule) => (
                        <div key={rule._id} className="flex items-start space-x-3 px-4 py-2 hover:bg-blue-50/50 transition-colors border-b border-slate-100 last:border-0">
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
              <div className="flex-1 flex flex-col bg-white rounded-lg border shadow-sm">
                <div className="px-5 py-3 border-b bg-gradient-to-r from-purple-50 to-purple-100/50 flex items-center justify-between">
                  <Label className="text-base font-semibold text-purple-900">
                    Chọn Stories
                    <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                      {selectedStories.length}
                    </span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedStories.length === stories.length) {
                        setSelectedStories([]);
                      } else {
                        setSelectedStories(stories.map(s => s._id));
                      }
                    }}
                    className="text-xs h-7 px-2 text-purple-700 hover:text-purple-900 hover:bg-purple-100"
                  >
                    {selectedStories.length === stories.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {stories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      Không có Stories nào
                    </p>
                  ) : (
                    <div>
                      {stories.map((story) => (
                        <div key={story._id} className="flex items-start space-x-3 px-4 py-2 hover:bg-purple-50/50 transition-colors border-b border-slate-100 last:border-0">
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
            <div className="flex gap-3 justify-end pt-4 pb-6 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isTraining}
                className="px-6"
              >
                Hủy
              </Button>
              <Button
                onClick={handleTrain}
                disabled={isTraining || !selectedChatbot || selectedRules.length === 0 || selectedStories.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-6"
              >
                {isTraining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang huấn luyện...
                  </>
                ) : (
                  <>
                    <Train className="mr-2 h-4 w-4" />
                    Bắt đầu huấn luyện
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
