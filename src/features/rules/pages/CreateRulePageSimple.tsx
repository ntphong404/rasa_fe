import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ruleService } from "../api/service";
import { RuleForm } from "../components/RuleForm";
import { toast } from "sonner";

export function CreateRulePageSimple() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (ruleData: any) => {
    setIsSubmitting(true);
    try {
      await ruleService.createRule(ruleData);
      toast.success(t("Rule created successfully"));
      navigate("/rules");
    } catch (error) {
      console.error("Error creating rule:", error);
      toast.error(t("Failed to create rule"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/rules");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/rules")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("Create Rule")}</h1>
            <p className="text-muted-foreground">{t("Create a new RASA rule")}</p>
          </div>
        </div>
      </div>

      {/* Rule Form */}
      <RuleForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitButtonText={t("Create Rule")}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
