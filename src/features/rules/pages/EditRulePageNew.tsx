import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ruleService } from "../api/service";
import { RuleForm } from "../components/RuleForm";
import { IRule } from "@/interfaces/rule.interface";
import { toast } from "sonner";

export function EditRulePageNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  // States
  const [rule, setRule] = useState<IRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Get rule from location state or fetch by ID
  const stateRule = location.state?.rule as IRule | undefined;

  useEffect(() => {
    const loadRule = async () => {
      if (stateRule) {
        // Use rule from navigation state
        setRule(stateRule);
        setIsLoading(false);
      } else if (id) {
        // Fetch rule by ID
        try {
          setIsLoading(true);
          const fetchedRule = await ruleService.getRuleById(id);
          setRule(fetchedRule);
        } catch (error) {
          console.error("Error fetching rule:", error);
          setLoadError(t("Failed to load rule"));
          toast.error(t("Failed to load rule"));
        } finally {
          setIsLoading(false);
        }
      } else {
        setLoadError(t("Rule ID not found"));
        setIsLoading(false);
      }
    };

    loadRule();
  }, [id, stateRule, t]);

  const handleSubmit = async (ruleData: any) => {
    if (!rule?._id) return;

    setIsSubmitting(true);
    try {
      await ruleService.updateRule(rule._id, ruleData);
      toast.success(t("Rule updated successfully"));
      navigate("/rules");
    } catch (error) {
      console.error("Error updating rule:", error);
      toast.error(t("Failed to update rule"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/rules");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{t("Loading rule...")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !rule) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/rules")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Back")}
          </Button>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{t("Error")}</h2>
          <p className="text-muted-foreground mb-4">
            {loadError || t("Rule not found")}
          </p>
          <Button onClick={() => navigate("/rules")}>
            {t("Back to Rules")}
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
            onClick={() => navigate("/rules")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("Edit Rule")}</h1>
            <p className="text-muted-foreground">{t("Edit RASA rule")}: {rule.name}</p>
          </div>
        </div>
      </div>

      {/* Rule Form */}
      <RuleForm
        initialRule={rule}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitButtonText={t("Update Rule")}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
