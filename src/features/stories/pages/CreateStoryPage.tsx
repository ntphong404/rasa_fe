import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { storyService } from "../api/service";
import { StoryForm } from "../components/StoryForm";
import { toast } from "sonner";

export function CreateStoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (storyData: any) => {
    setIsSubmitting(true);
    try {
      await storyService.createStory(storyData);
      toast.success(t("Story created successfully"));
      navigate("/stories");
    } catch (error) {
      console.error("Error creating story:", error);
      toast.error(t("Failed to create story"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/stories");
  };

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
            <h1 className="text-2xl font-bold">{t("Create Story")}</h1>
            <p className="text-muted-foreground">{t("Create a new RASA story")}</p>
          </div>
        </div>
      </div>

      {/* Story Form */}
      <StoryForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitButtonText={t("Create Story")}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
