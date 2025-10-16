import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Activity, Send, Play, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { chatBotService, myModelService } from "../api/service";
import {
  ChatBot,
  ActionsListResponse,
  HealthCheckResponse,
  ModelDetail
} from "../api/dto/ChatBotResponse";

interface ChatBotOperationsDialogProps {
  chatBot: ChatBot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatBotOperationsDialog({
  chatBot,
  open,
  onOpenChange,
}: ChatBotOperationsDialogProps) {
  const { t } = useTranslation();

  // Health Check
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Models List (from Rasa - for Run Model only)
  const [rasaModelsList, setRasaModelsList] = useState<string[]>([]);
  const [rasaModelsLoading, setRasaModelsLoading] = useState(false);

  // Models from MongoDB (for Send Model)
  const [mongoModelsList, setMongoModelsList] = useState<ModelDetail[]>([]);
  const [mongoModelsLoading, setMongoModelsLoading] = useState(false);

  // Actions List
  const [actionsList, setActionsList] = useState<ActionsListResponse["actions"]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);

  // Send Model (share to another chatbot)
  const [selectedModelId, setSelectedModelId] = useState("");
  const [sendModelLoading, setSendModelLoading] = useState(false);

  // Run Model (activate in current chatbot)
  const [selectedRunModelName, setSelectedRunModelName] = useState("");
  const [runModelLoading, setRunModelLoading] = useState(false);

  // Push Action
  const [pushActionModelId, setPushActionModelId] = useState("");
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [pushActionLoading, setPushActionLoading] = useState(false);

  const handleHealthCheck = async () => {
    if (!chatBot) return;
    setHealthLoading(true);
    try {
      const result = await chatBotService.healthCheck(chatBot._id);
      setHealthStatus(result);

      // Check if result has data property with services
      if (result && result.data && typeof result.data === 'object') {
        const services = Object.entries(result.data);

        const offlineServices = services.filter(([_, service]) =>
          service && service.status && (service.status === "offline" || service.status === "not_responding")
        );

        const totalServices = services.length;
        const onlineServices = services.filter(([_, service]) =>
          service && service.status === "running"
        ).length;

        if (offlineServices.length > 0) {
          toast.warning(`${offlineServices.length}/${totalServices} ${t("service(s) offline")}`);
        } else if (onlineServices === totalServices) {
          toast.success(t("All services are online"));
        } else {
          toast.info(`${onlineServices}/${totalServices} ${t("services online")}`);
        }
      } else {
        toast.warning(t("Health check completed but no service data available"));
      }
    } catch (error) {
      console.error("Health check error:", error);
      toast.error(t("Failed to check health"));
    } finally {
      setHealthLoading(false);
    }
  };

  const handleGetRasaModelsList = async () => {
    if (!chatBot) return;
    setRasaModelsLoading(true);
    try {
      const result = await chatBotService.getModelsList(chatBot._id);
      setRasaModelsList(result.models || []);
      toast.success(`${t("Found")} ${result.total} ${t("models in Rasa server")}`);
    } catch (error) {
      console.error("Get Rasa models error:", error);
      toast.error(t("Failed to fetch models from Rasa"));
    } finally {
      setRasaModelsLoading(false);
    }
  };

  const handleGetMongoModelsList = async () => {
    if (!chatBot) return;
    setMongoModelsLoading(true);
    try {
      const result = await myModelService.getPaginate({
        page: 1,
        limit: 100,
        chatbotId: chatBot._id
      });
      setMongoModelsList(result.data || []);
      toast.success(`${t("Found")} ${result.data?.length || 0} ${t("models in MongoDB")}`);
    } catch (error) {
      console.error("Get MongoDB models error:", error);
      toast.error(t("Failed to fetch models from MongoDB"));
    } finally {
      setMongoModelsLoading(false);
    }
  };

  const handleGetActionsList = async () => {
    if (!chatBot) return;
    setActionsLoading(true);
    try {
      const result = await chatBotService.getActionsList(chatBot._id);
      setActionsList(result.actions || []);
      toast.success(`${t("Found")} ${result.total} ${t("actions in MongoDB")}`);
    } catch (error) {
      console.error("Get actions error:", error);
      toast.error(t("Failed to fetch actions"));
    } finally {
      setActionsLoading(false);
    }
  };

  const handleSendModel = async () => {
    if (!chatBot || !selectedModelId) return;
    setSendModelLoading(true);
    try {
      await chatBotService.sendModel(chatBot._id, { modelId: selectedModelId });
      toast.success(t("Model sent to another chatbot successfully"));
      setSelectedModelId("");
    } catch (error) {
      console.error("Send model error:", error);
      toast.error(t("Failed to send model to another chatbot"));
    } finally {
      setSendModelLoading(false);
    }
  };

  const handleRunModel = async () => {
    if (!chatBot || !selectedRunModelName) return;
    setRunModelLoading(true);
    try {
      await chatBotService.runModel(chatBot._id, { modelName: selectedRunModelName });
      toast.success(t("Model activated in Rasa successfully"));
      setSelectedRunModelName("");
    } catch (error) {
      console.error("Run model error:", error);
      toast.error(t("Failed to activate model in Rasa"));
    } finally {
      setRunModelLoading(false);
    }
  };

  const handlePushAction = async () => {
    if (!chatBot) return;
    setPushActionLoading(true);
    try {
      await chatBotService.pushAction(chatBot._id, {
        modelId: pushActionModelId && pushActionModelId !== "none" ? pushActionModelId : undefined,
        actionIds: selectedActionIds.length > 0 ? selectedActionIds : undefined,
      });

      toast.success(t("Actions pushed to Rasa successfully. actions.py file updated."));
      setPushActionModelId("");
      setSelectedActionIds([]);
    } catch (error) {
      console.error("Push actions error:", error);
      toast.error(t("Failed to push actions to Rasa"));
    } finally {
      setPushActionLoading(false);
    }
  };

  const toggleActionSelection = (actionId: string) => {
    setSelectedActionIds(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const toggleAllActions = () => {
    if (selectedActionIds.length === actionsList.length) {
      setSelectedActionIds([]);
    } else {
      setSelectedActionIds(actionsList.map(a => a._id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-3xl h-[700px] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("ChatBot Operations")}</DialogTitle>
          <DialogDescription>
            {t("Manage operations for")} {chatBot?.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="health" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health">{t("Health")}</TabsTrigger>
            <TabsTrigger value="models">{t("Models")}</TabsTrigger>
            <TabsTrigger value="actions">{t("Actions")}</TabsTrigger>
          </TabsList>

          {/* Health Check Tab */}
          <TabsContent value="health" className="flex-1 overflow-y-auto mt-4 space-y-4">
            <Button
              onClick={handleHealthCheck}
              disabled={healthLoading}
              className="w-full"
            >
              {healthLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Activity className="mr-2 h-4 w-4" />
              )}
              {t("Check Health")}
            </Button>

            {healthStatus && (
              <div className="space-y-3">
                {/* Services Status */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                    {t("Services Status")}:
                  </h4>

                  {healthStatus.data && typeof healthStatus.data === 'object' ? (
                    Object.entries(healthStatus.data).map(([serviceName, serviceData]) => {
                      // Additional safety check for serviceData
                      if (!serviceData || typeof serviceData !== 'object') {
                        return null;
                      }

                      const isOnline = serviceData.status === "running";
                      const isWarning = serviceData.status === "not_responding";

                      return (
                        <div
                          key={serviceName}
                          className={`p-4 rounded-lg border-2 ${isOnline
                            ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700"
                            : isWarning
                              ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700"
                              : "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700"
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {isOnline ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                                ) : (
                                  <AlertCircle className={`h-4 w-4 mr-2 ${isWarning
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-red-600 dark:text-red-400"
                                    }`} />
                                )}
                                <h5 className="font-semibold text-sm">
                                  {serviceName === "RasaServer" ? t("Rasa Server") :
                                    serviceName === "ActionsServer" ? t("Actions Server") :
                                      serviceName}
                                </h5>
                              </div>

                              <Badge
                                variant={isOnline ? "default" : "destructive"}
                                className={isWarning ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                              >
                                {serviceData.status === "running" ? t("Running") :
                                  serviceData.status === "offline" ? t("Offline") :
                                    serviceData.status === "not_responding" ? t("Not Responding") :
                                      serviceData.status ? String(serviceData.status).toUpperCase() : 'UNKNOWN'}
                              </Badge>

                              {serviceData.model_file && (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                                    {t("Active Model")}:
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 font-mono break-all">
                                    {serviceData.model_file}
                                  </p>
                                </div>
                              )}

                              {serviceData.error && (
                                <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border border-red-200 dark:border-red-800">
                                  <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                                    {t("Error Details")}:
                                  </p>
                                  <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
                                    {serviceData.error}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>{t("No service data available")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!healthStatus && !healthLoading && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>{t("Click button above to check health status")}</p>
              </div>
            )}
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4 h-full">
              {/* Send Model - Share model from MongoDB to Rasa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    {t("Send Model to Another ChatBot")}
                  </Label>
                  <Button
                    onClick={handleGetMongoModelsList}
                    disabled={mongoModelsLoading}
                    size="sm"
                    variant="outline"
                  >
                    {mongoModelsLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t("Load from MongoDB")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("Share a trained model stored in MongoDB/MinIO to another chatbot's Rasa server")}
                </p>

                {mongoModelsList.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg max-h-32 overflow-y-auto mb-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      {t("Models in MongoDB")} ({mongoModelsList.length})
                    </p>
                    <div className="space-y-1">
                      {mongoModelsList.map((model) => (
                        <div key={model._id} className="flex items-center text-sm p-2 bg-background rounded border">
                          <CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                          <span className="font-mono text-xs break-all">{model.url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Select
                    value={selectedModelId}
                    onValueChange={setSelectedModelId}
                    disabled={mongoModelsList.length === 0}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={
                        mongoModelsList.length === 0
                          ? t("Load models from MongoDB first")
                          : t("Select model to send")
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {mongoModelsList.map((model) => (
                        <SelectItem key={model._id} value={model._id}>
                          <span className="font-mono text-xs break-all">{model.url}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleSendModel}
                    disabled={sendModelLoading || !selectedModelId}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sendModelLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                {/* Get Models List from Rasa */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">{t("Models in Rasa Server")}</Label>
                    <Button
                      onClick={handleGetRasaModelsList}
                      disabled={rasaModelsLoading}
                      size="sm"
                      variant="outline"
                    >
                      {rasaModelsLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t("Refresh")}
                    </Button>
                  </div>

                  {rasaModelsList.length > 0 && (
                    <div className="p-4 bg-muted rounded-lg max-h-48 overflow-y-auto">
                      <p className="text-xs text-muted-foreground mb-2">
                        {t("Models available in Rasa server")} ({rasaModelsList.length})
                      </p>
                      <div className="space-y-1">
                        {rasaModelsList.map((modelUrl, index) => (
                          <div key={index} className="flex items-center text-sm p-2 bg-background rounded border">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className="font-mono text-xs break-all">{modelUrl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!rasaModelsLoading && rasaModelsList.length === 0 && (
                    <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                      {t("No models found in Rasa server. Click Refresh to check.")}
                    </div>
                  )}
                </div>

                {/* Run Model - Activate model in current Rasa */}
                <div className="space-y-2">
                  <Label htmlFor="runModelName" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    {t("Run Model")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("Activate a model in this chatbot's Rasa server")}
                  </p>
                  <div className="flex gap-2">
                    <Select
                      value={selectedRunModelName}
                      onValueChange={setSelectedRunModelName}
                      disabled={rasaModelsList.length === 0}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={
                          rasaModelsList.length === 0
                            ? t("Get models list first")
                            : t("Select model to activate")
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {rasaModelsList.map((modelUrl, index) => (
                          <SelectItem key={index} value={modelUrl}>
                            <span className="font-mono text-xs break-all">{modelUrl}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleRunModel}
                      disabled={runModelLoading || !selectedRunModelName}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {runModelLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4 h-full">
              {/* Get Actions List */}
              <div className="space-y-2">
                <Button
                  onClick={handleGetActionsList}
                  disabled={actionsLoading}
                  className="w-full"
                >
                  {actionsLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t("Get Actions List from MongoDB")}
                </Button>

                {actionsList.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{t("Available Actions")}:</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleAllActions}
                      >
                        {selectedActionIds.length === actionsList.length
                          ? t("Deselect All")
                          : t("Select All")}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {actionsList.map((action) => (
                        <div
                          key={action._id}
                          className="flex items-start space-x-2 border-b pb-2"
                        >
                          <Checkbox
                            id={`action-${action._id}`}
                            checked={selectedActionIds.includes(action._id)}
                            onCheckedChange={() => toggleActionSelection(action._id)}
                            className="mt-1"
                          />
                          <label
                            htmlFor={`action-${action._id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-sm">{action.name}</div>
                            {action.description && (
                              <div className="text-muted-foreground text-xs">
                                {action.description}
                              </div>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                {/* Push Actions */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {t("Push Actions to Rasa")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("Overwrite actions.py file in Rasa via Flask API. This syncs MongoDB actions to Rasa server.")}
                  </p>

                  <Select
                    value={pushActionModelId}
                    onValueChange={setPushActionModelId}
                    disabled={mongoModelsList.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        mongoModelsList.length === 0
                          ? t("Model ID (optional)")
                          : t("Select model (optional)")
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("None - Push all actions")}</SelectItem>
                      {mongoModelsList.map((model) => (
                        <SelectItem key={model._id} value={model._id}>
                          <span className="font-mono text-xs break-all">{model.url}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedActionIds.length > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          <strong>{t("Selected")}:</strong> {selectedActionIds.length} {t("actions")}
                        </span>
                        <Badge variant="secondary">{t("Custom Selection")}</Badge>
                      </div>
                    </div>
                  )}

                  {selectedActionIds.length === 0 && actionsList.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-sm">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      {t("No actions selected. Will push all actions to Rasa.")}
                    </div>
                  )}

                  <Button
                    onClick={handlePushAction}
                    disabled={pushActionLoading || actionsList.length === 0}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    {pushActionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {t("Push Actions to Rasa")}
                  </Button>

                  {actionsList.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      {t("Get actions list first to push them to Rasa")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}