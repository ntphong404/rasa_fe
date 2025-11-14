import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { HelpCircle, X } from "lucide-react";
import { intentService } from "@/features/intents/api/service";
import { responseService } from "@/features/reponses/api/service";
import { ruleService } from "@/features/rules/api/service";

export function CreateDataPage() {
    const [showHelp, setShowHelp] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [intentName, setIntentName] = useState("");
    const [examples, setExamples] = useState("");
    const [responseText, setResponseText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCancel = () => navigate("/");

    // normalize intent name to lowercase_with_underscores
    function formatIntentName(input?: string) {
        if (!input) return "";
        const cleaned = input
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/[^\p{L}\p{N}]+/gu, "_")
            .replace(/^_+|_+$/g, "")
            .replace(/_+/g, "_")
            .toLowerCase();
        return cleaned;
    }

    const formattedIntent = useMemo(() => formatIntentName(intentName), [intentName]);

    const handleSubmit = async () => {
        if (!intentName.trim()) return toast.error(t("Intent name is required"));
        setIsSubmitting(true);
        try {
            // create intent
            const intentPayload = {
                // store the normalized intent name
                name: formattedIntent || formatIntentName(intentName.trim()),
                description: "",
                define: examples
                    .split(";")
                    .map((s) => `- ${s.trim()}`)
                    .join("\n"),
                entities: [],
            };

            const createdIntent = await intentService.createIntent(intentPayload as any);

            let createdResponse = null;
            if (responseText.trim()) {
                const respName = `utter_${formattedIntent || formatIntentName(intentName.trim())}`;
                const responsePayload = {
                    name: respName,
                    description: "",
                    define: responseText || intentName.trim(),
                };
                createdResponse = await responseService.createResponse(responsePayload as any);
            }

            // create rule linking intent and response (if response created)
            if (createdResponse) {
                const rulePayload = {
                    name: `rule_for_${intentName.trim()}`,
                    description: "",
                    define: "",
                    intents: [createdIntent._id],
                    responses: [createdResponse._id],
                    // Ensure action field is present as empty array when not provided
                    action: [],
                };

                await ruleService.createRule(rulePayload as any);
            }

            toast.success(t("Created data successfully"));
            navigate("/");
        } catch (err) {
            console.error(err);
            toast.error(t("Failed to create items"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="container mx-auto p-6 max-w-6xl w-full">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">Quick Add Data</h1>
                        <p className="text-sm text-muted-foreground">Create an intent, response, and a rule that links them together.</p>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => navigate('/add-data/import')}>Import from Excel</Button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-200 dark:border-indigo-900 grid gap-6">
                    <div>
                        <label className="block text-base font-medium mb-2 text-slate-700">{t("Intent name")}</label>
                        <Input className="h-12 text-base" value={intentName} onChange={(e) => setIntentName(e.target.value)} />
                        <div className="mt-3 text-sm text-slate-600">Formatted name: <span className="font-mono text-sm ml-2 text-indigo-700">{formattedIntent || <span className="text-slate-400">(will be generated)</span>}</span></div>
                    </div>

                    <div>
                        <label className="block text-base font-medium mb-2 text-slate-700">{t("Examples (separate with ';')")}</label>
                        <Textarea className="h-28 text-base" value={examples} onChange={(e) => setExamples(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-base font-medium mb-2 text-slate-700">{t("Response text")}</label>
                        <Textarea className="h-24 text-base" value={responseText} onChange={(e) => setResponseText(e.target.value)} />
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isSubmitting ? t("Saving...") : t("Save")}
                        </Button>
                        <Button variant="ghost" onClick={handleCancel}>
                            {t("Cancel")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Floating Help Button and Modal (like Rule page) */}
            <button
                className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 z-50 flex items-center justify-center"
                onClick={() => setShowHelp(true)}
                aria-label="Help & Guide"
            >
                <HelpCircle className="h-6 w-6" />
            </button>

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
                                Quick Add Guide
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
                            <section>
                                <h3 className="text-lg font-semibold mb-3 text-blue-600">📌 What is an Intent?</h3>
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">An intent represents the user's intention (what the user may say). Examples help the NLU model recognize the intent.</p>
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                    <p className="text-sm font-medium mb-2">Example:</p>
                                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>• <code className="bg-white dark:bg-gray-900 px-1 rounded">greet_intent</code> - user says hello</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold mb-3 text-green-600">🏷️ Naming & Format</h3>
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-3">Intent names will be normalized to <code className="font-mono">lowercase_with_underscores</code>. You can see the formatted name preview below the Intent input.</p>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg font-mono text-sm">
                                    <pre>{formattedIntent || "(will be generated)"}</pre>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold mb-3 text-orange-600">💬 Response Naming</h3>
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">If you provide a response, it will be created with the name <code className="font-mono">utter_{`<intent>`}</code> by default.</p>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold mb-3 text-purple-600">✍️ Examples</h3>
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">Provide examples separated by <code className="font-mono">;</code>. These will be converted into the define block of the intent.</p>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CreateDataPage;
