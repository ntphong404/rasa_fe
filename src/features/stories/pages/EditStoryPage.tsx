import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { storyService } from "../api/service";
import { StoryForm } from "../components/StoryForm";
import { IStory } from "@/interfaces/story.interface";
import { toast } from "sonner";

export function EditStoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // States
  const [story, setStory] = useState<IStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Get story ID from query params
  const storyId = searchParams.get("id");

  useEffect(() => {
    const loadStory = async () => {
      if (!storyId) {
        setLoadError(t("Story ID not found"));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await storyService.getStoryById(storyId);
        setStory(response.data);
      } catch (error) {
        console.error("Error fetching story:", error);
        setLoadError(t("Failed to load story"));
        toast.error(t("Failed to load story"));
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId, t]);

  const handleSubmit = async (storyData: any) => {
    if (!story?._id) return;

    setIsSubmitting(true);
    try {
      await storyService.updateStory(story._id, { ...storyData, _id: story._id });
      toast.success(t("Story updated successfully"));
      navigate("/stories");
    } catch (error) {
      console.error("Error updating story:", error);
      toast.error(t("Failed to update story"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/stories");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{t("Loading story...")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !story) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/stories")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Back")}
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{loadError || t("Story not found")}</p>
          <Button onClick={() => navigate("/stories")}>
            {t("Go Back to Stories")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/stories")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("Edit Story")}</h1>
            <p className="text-muted-foreground">
              {t("Editing")}: {story.name}
            </p>
          </div>
        </div>
      </div>

      {/* Story Form */}
      <StoryForm
        initialStory={story}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitButtonText={t("Update Story")}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
