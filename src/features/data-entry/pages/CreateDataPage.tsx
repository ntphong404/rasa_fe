import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { HelpCircle, X } from "lucide-react";
import { intentService } from "@/features/intents/api/service";
import { responseService } from "@/features/reponses/api/service";
import { ruleService } from "@/features/rules/api/service";
import { useChatbots } from "@/hooks/useChatbots";
import { useChatbotStore } from "@/store/chatbot";
import { useAuthStore } from "@/store/auth";

export function CreateDataPage() {
    const [showHelp, setShowHelp] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { chatbots } = useChatbots();
    const selectedBotId = useChatbotStore((state) => state.selectedBotId);
    const user = useAuthStore((state) => state.user);
    const isManager = useMemo(
        () => Boolean(user?.roles?.some((role) => role.name?.toUpperCase() === "MANAGER")),
        [user?.roles]
    );
    const managerAssignedBotId = useMemo(() => {
        return user?.managedBotIds?.[0] || null;
    }, [user?.managedBotIds]);
    const availableChatbots = useMemo(() => chatbots.filter((bot) => bot.botId !== "global"), [chatbots]);
    const [selectedBotIds, setSelectedBotIds] = useState<string[]>([]);
    const [searchParams] = useSearchParams();
    const [intentName, setIntentName] = useState("");
    const [initialExample, setInitialExample] = useState("");
    const [examples, setExamples] = useState<string[]>([]);
    const [responseText, setResponseText] = useState("");
    const [label, setLabel] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'form' | 'examples'>('form');
    const [errors, setErrors] = useState<{ intentName?: string; initialExample?: string; responseText?: string; examples?: string }>({});
    const intentRef = useRef<HTMLInputElement | null>(null);
    const initialExampleRef = useRef<HTMLInputElement | null>(null);
    const responseRef = useRef<HTMLTextAreaElement | null>(null);
    const examplesSectionRef = useRef<HTMLDivElement | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const sampleQuestion = searchParams.get("sampleQuestion")?.trim();
        if (sampleQuestion) {
            setInitialExample(sampleQuestion);
        }
    }, [searchParams]);

    useEffect(() => {
        if (isManager) {
            setSelectedBotIds(managerAssignedBotId ? [managerAssignedBotId] : []);
            return;
        }

        setSelectedBotIds((prev) => {
            const validSet = new Set(availableChatbots.map((b) => b.botId));
            const filtered = prev.filter((id) => validSet.has(id));

            if (selectedBotId && selectedBotId !== "global" && validSet.has(selectedBotId)) {
                return filtered.includes(selectedBotId) ? filtered : [...filtered, selectedBotId];
            }

            return filtered;
        });
    }, [availableChatbots, isManager, managerAssignedBotId, selectedBotId]);

    const toggleChatbot = useCallback((botId: string) => {
        setSelectedBotIds((prev) =>
            prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]
        );
    }, []);

    const selectAllChatbots = useCallback(() => {
        setSelectedBotIds(availableChatbots.map((bot) => bot.botId));
    }, [availableChatbots]);

    const clearSelectedChatbots = useCallback(() => {
        setSelectedBotIds([]);
    }, []);

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

    function buildRuleDefine(ruleName: string, steps: Array<{ intentId?: string; actionId?: string }>) {
        const lines: string[] = [];
        lines.push(`- rule: ${ruleName}`);
        lines.push(`  steps:`);
        steps.forEach((s) => {
            if (s.intentId) {
                lines.push(`  - intent: [${s.intentId}]`);
            }
            if (s.actionId) {
                lines.push(`  - action: [${s.actionId}]`);
            }
        });
        return lines.join("\n");
    }

    function buildIntentDefine(intentName: string, examplesArr: string[]) {
        const examplesBlock = examplesArr.length
            ? examplesArr.map((s) => `- ${s.trim()}`).join("\n")
            : "";
        const lines: string[] = [];
        lines.push(`- intent: ${intentName}`);
        lines.push(`  examples: |`);
        if (examplesBlock) {
            examplesBlock.split('\n').forEach((ln) => lines.push(`    ${ln}`));
        }
        return lines.join("\n");
    }

    function buildResponseDefine(responseName: string, responseText: string) {
        // Convert escaped \n back to actual newlines for formatting
        const unescapedText = responseText ? responseText.replace(/\\n/g, '\n') : "";
        const textBlock = unescapedText ? unescapedText.trim().split('\n').map((ln) => `      ${ln}`).join('\n') : "";
        const lines: string[] = [];
        lines.push(`${responseName}:`);
        lines.push(`  - text: |`);
        if (textBlock) {
            lines.push(textBlock);
        }
        return lines.join("\n");
    }

    const formattedIntent = useMemo(() => formatIntentName(intentName), [intentName]);

    const removeExample = useCallback((index: number) => {
        setExamples((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const addExamples = useCallback((newExamples: string[]) => {
        setExamples((prev) => {
            const merged = [...prev, ...newExamples.map((s) => s.trim()).filter(Boolean)];
            // keep unique and preserve order
            const seen = new Set<string>();
            const uniq = [] as string[];
            for (const ex of merged) {
                if (!seen.has(ex)) {
                    seen.add(ex);
                    uniq.push(ex);
                }
            }
            return uniq;
        });
    }, []);

    // Generate examples using Gemini (configurable via env)
    const handleGenerate = async () => {
        if (isGenerating) return;
        
        // Require all main fields before generating: intent name, at least one example, and response
        const seed = examples[0] || initialExample || "";
        const newErrors: typeof errors = {};
        if (!intentName.trim()) newErrors.intentName = t("Please enter question group name");
        if (!seed.trim()) newErrors.initialExample = t("Please enter at least one question to auto-generate");
        if (!responseText.trim()) newErrors.responseText = t("Please enter answer text");
        if (Object.keys(newErrors).length) {
            setErrors((p) => ({ ...p, ...newErrors }));
            // also show toast for immediate feedback
            const msg = Object.values(newErrors)[0];
            // scroll/focus to first error field
            if (newErrors.intentName && intentRef.current) {
                intentRef.current.focus();
                intentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (newErrors.initialExample && initialExampleRef.current) {
                initialExampleRef.current.focus();
                initialExampleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (newErrors.responseText && responseRef.current) {
                responseRef.current.focus();
                responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            toast.error(msg);
            return;
        }

        setIsGenerating(true);

        // Preserve the original user example (first one), and generate to fill up to 10 total
        // Always keep the user's initial example at the beginning
        const userOriginalExample = examples[0] || initialExample || "";
        const targetTotal = 10;
        const toRequest = Math.max(1, targetTotal - examples.length);

        try {
            const payload = { example: seed, num: toRequest, response: responseText };
            const gen = await intentService.geminiExamples(payload);
            // support both shapes: direct array or wrapped { data: { examples: [] } }
            const genAny: any = gen;
            const returnedExamples: string[] = Array.isArray(genAny)
                ? genAny
                : (Array.isArray(genAny?.data?.examples) ? genAny.data.examples : []);
            if (!returnedExamples || returnedExamples.length === 0) return toast.error(t("No questions were generated"));

            // Ensure user's original example is always first, then add generated ones
            const filteredGenerated = returnedExamples.slice(0, toRequest).filter(ex => ex.trim() !== userOriginalExample.trim());
            setExamples((prev) => {
                // Keep the first example (user's original), remove it from prev if exists, then merge with new
                const withoutFirst = prev.filter(ex => ex.trim() !== userOriginalExample.trim());
                const merged = [userOriginalExample, ...withoutFirst, ...filteredGenerated.map((s) => s.trim()).filter(Boolean)];
                // keep unique and preserve order
                const seen = new Set<string>();
                const uniq = [] as string[];
                for (const ex of merged) {
                    if (!seen.has(ex)) {
                        seen.add(ex);
                        uniq.push(ex);
                    }
                }
                return uniq;
            });
            // clear related errors after successful generation
            setErrors((p) => ({ ...p, examples: undefined, initialExample: undefined }));
            // ensure examples panel is visible so user sees generated examples
            setStep('examples');
            toast.success(t("Added questions automatically"));
        } catch (err) {
            console.error(err);
            toast.error(t("Failed to generate examples automatically"));
        }
        finally {
            setIsGenerating(false);
        }
    };

    const goToExamplesStep = () => {
        if (!intentName.trim()) return toast.error(t("Please enter question group name"));
        if (!initialExample.trim()) return toast.error(t("Please enter at least one question to start"));
        setExamples([initialExample.trim()]);
        setStep('examples');
    };

    const handleSubmit = async () => {
        // Validate required fields: intent name, response text, and at least 5 examples
        const newErrors: typeof errors = {};
        if (!intentName.trim()) newErrors.intentName = t("Please enter question group name");
        if (!responseText.trim()) newErrors.responseText = t("Please enter answer text");
        if (examples.length < 5) {
            newErrors.examples = t("At least 5 questions are required before saving");
            // If user is still on the initial 'form' step, surface the examples error under the initial example input
            if (step === 'form') {
                newErrors.initialExample = newErrors.examples;
            }
        }
        if (Object.keys(newErrors).length) {
            setErrors((p) => ({ ...p, ...newErrors }));
            const msg = Object.values(newErrors)[0];
            // scroll/focus to first invalid field
            if (newErrors.intentName && intentRef.current) {
                intentRef.current.focus();
                intentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (newErrors.responseText && responseRef.current) {
                responseRef.current.focus();
                responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (newErrors.initialExample && initialExampleRef.current) {
                initialExampleRef.current.focus();
                initialExampleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (newErrors.examples && examplesSectionRef.current) {
                examplesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return toast.error(msg);
        }

        const targetBotIds = isManager
            ? managerAssignedBotId
                ? [managerAssignedBotId]
                : []
            : selectedBotIds.filter(Boolean);
        if (targetBotIds.length === 0) {
            return toast.error(t("Please select at least one chatbot"));
        }

        setIsSubmitting(true);
        try {
            // create intent
            const intentPayload = {
                // store the normalized intent name
                name: formattedIntent || formatIntentName(intentName.trim()),
                description: "",
                define: buildIntentDefine(formattedIntent || formatIntentName(intentName.trim()), examples),
                label: label.trim() || undefined,
                entities: [],
                botIds: targetBotIds,
            };

            const createdIntent = await intentService.createIntent(intentPayload as any);

            let createdResponse = null;
            if (responseText.trim()) {
                const respName = `utter_${formattedIntent || formatIntentName(intentName.trim())}`;
                const responsePayload = {
                    name: respName,
                    description: "",
                    define: buildResponseDefine(respName, responseText || intentName.trim()),
                    label: label.trim() || undefined,
                    botIds: targetBotIds,
                };
                createdResponse = await responseService.createResponse(responsePayload as any);
            }

            // create rule linking intent and response (if response created)
            if (createdResponse) {
                const ruleName = `rule_for_${formattedIntent || formatIntentName(intentName.trim())}`;
                const steps = [{ intentId: createdIntent._id } as { intentId?: string; actionId?: string }];
                if (createdResponse) {
                    steps.push({ actionId: createdResponse._id });
                }

                const rulePayload = {
                    name: ruleName,
                    description: "",
                    define: buildRuleDefine(ruleName, steps),
                    intents: [createdIntent._id],
                    responses: createdResponse ? [createdResponse._id] : [],
                    botIds: targetBotIds,
                    action: [],
                    roles: [],
                };

                await ruleService.createRule(rulePayload as any);
            }

            toast.success(t("Data created successfully"));
            // Reset form after successful save
            setIntentName("");
            setInitialExample("");
            setExamples([]);
            setResponseText("");
            setLabel("");
            setStep('form');
            setErrors({});
            // Focus back to intent name input
            setTimeout(() => {
                intentRef.current?.focus();
            }, 100);
        } catch (err) {
            console.error(err);
            toast.error(t("Failed to create data"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="admin-page container mx-auto p-6 max-w-6xl w-full">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">{t("Quick data creation")}</h1>
                        <p className="text-sm text-muted-foreground">{t("Create question groups, answers, and link them together")}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => navigate('/add-data/import')}>{t("Import from file")}</Button>
                    </div>
                </div>

                <div className="surface-card-strong grid gap-6 rounded-lg border-2 border-slate-300 p-6 text-foreground dark:border-white/20 relative">
                    <div>
                        <label className="mb-2 block text-base font-medium text-foreground">{t("Question group name")}</label>
                        <div className="relative mb-7">
                            <Input
                                ref={intentRef}
                                className={`h-12 text-base ${errors.intentName ? 'border-red-500 ring-1 ring-red-300' : ''}`}
                                value={intentName}
                                onChange={(e) => { setIntentName(e.target.value); setErrors((p) => ({ ...p, intentName: undefined })); }}
                            />
                            {errors.intentName && <div className="absolute left-0 top-full mt-1 text-sm text-red-600 whitespace-nowrap z-10">{errors.intentName}</div>}
                        </div>
                        <div className="text-sm text-muted-foreground">{t("Normalized name")}: <span className="ml-2 font-mono text-sm text-indigo-700 dark:text-indigo-300">{formattedIntent || <span className="text-slate-400 dark:text-slate-500">{t("(auto-generated)")}</span>}</span></div>
                    </div>

                    <div>
                        <label className="mb-2 block text-base font-medium text-foreground">{t("Label")}</label>
                        <Input
                            className="h-12 text-base"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder={t("Example: pccc")}
                        />
                    </div>

                    {!isManager && (
                    <div className="rounded-lg border p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div>
                                <label className="block text-base font-medium text-foreground">{t("Applicable Chatbots")}</label>
                                <p className="text-xs text-muted-foreground">{t("Select one or more chatbots to create this data")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button type="button" size="sm" variant="outline" onClick={selectAllChatbots}>{t("Select all")}</Button>
                                <Button type="button" size="sm" variant="ghost" onClick={clearSelectedChatbots}>{t("Clear")}</Button>
                            </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {availableChatbots.map((bot) => (
                                <label key={bot._id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                                    <input
                                        type="checkbox"
                                        className="accent-indigo-600"
                                        checked={selectedBotIds.includes(bot.botId)}
                                        onChange={() => toggleChatbot(bot.botId)}
                                    />
                                    <span>{bot.name}</span>
                                </label>
                            ))}
                        </div>
                        {selectedBotIds.length === 0 && (
                            <p className="mt-2 text-xs text-red-500">{t("Please select at least one chatbot")}</p>
                        )}
                    </div>
                    )}

                    {step === 'form' ? (
                        <div>
                            <label className="mb-2 block text-base font-medium text-foreground">{t("Sample question (enter one question to start)")}</label>
                            <div className="relative">
                                <Input
                                    ref={initialExampleRef}
                                    className={`h-12 text-base ${errors.initialExample ? 'border-red-500 ring-1 ring-red-300' : ''}`}
                                    value={initialExample}
                                    onChange={(e) => { setInitialExample(e.target.value); setErrors((p) => ({ ...p, initialExample: undefined, examples: undefined })); }}
                                />
                                {errors.initialExample && <div className="absolute left-0 top-full mt-1 text-sm text-red-600 whitespace-nowrap">{errors.initialExample}</div>}
                            </div>
                            {/* Removed inline example action buttons — controls moved to bottom-right */}
                        </div>
                    ) : (
                        <div>
                            <label className="mb-2 block text-base font-medium text-foreground">{t("Similar questions")}</label>
                            <div className="space-y-2" ref={examplesSectionRef}>
                                {examples.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">{t("No questions yet. Add manually or generate automatically.")}</div>
                                ) : (
                                    examples.map((ex, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input
                                                className={`h-10 flex-1 ${errors.examples ? 'border-red-500 ring-1 ring-red-300' : ''}`}
                                                value={ex}
                                                onChange={(e) => { setExamples((prev) => prev.map((p, i) => i === idx ? e.target.value : p)); if (examples.length >= 5) setErrors((p) => ({ ...p, examples: undefined })); }}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => removeExample(idx)} aria-label={t("Delete question")}>
                                                <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* example buttons removed from here and placed at bottom-right */}

                            <div className="mt-4 flex items-center gap-2 relative">
                                <Button variant="ghost" onClick={() => setStep('form')}>{t("Back")}</Button>
                                {errors.examples && <div className="absolute left-0 top-full mt-2 text-sm text-red-600 whitespace-nowrap">{errors.examples}</div>}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-base font-medium text-foreground">{t("Answer")}</label>
                        <div className="relative mb-4">
                            <Textarea
                                className={`h-24 text-base ${errors.responseText ? 'border-red-500 ring-1 ring-red-300' : ''}`}
                                value={responseText}
                                onChange={(e) => { setResponseText(e.target.value); setErrors((p) => ({ ...p, responseText: undefined })); }}
                            />
                            {errors.responseText && <div className="absolute left-0 top-full mt-1 text-sm text-red-600 whitespace-nowrap z-10">{errors.responseText}</div>}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isSubmitting ? t("Saving...") : t("Save")}
                        </Button>
                        <Button variant="ghost" onClick={handleCancel}>
                            {t("Cancel")}
                        </Button>
                    </div>

                    {/* Bottom-right example controls */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        <Button
                            onClick={() => { setErrors({}); handleGenerate(); }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center"
                            disabled={isGenerating}
                        >
                            {isGenerating && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
                            {t("Generate questions automatically")}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                // preserve the first user example back into the initial input and return to form
                                if (examples && examples.length > 0) {
                                    setInitialExample(examples[0]);
                                }
                                setExamples([]);
                                setErrors((p) => ({ ...p, examples: undefined }));
                                setStep('form');
                            }}
                        >
                            {t("Clear all questions")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Floating Help Button and Modal (like Rule page) */}
            <button
                className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 z-50 flex items-center justify-center"
                onClick={() => setShowHelp(true)}
                aria-label={t("Help")}
            >
                <HelpCircle className="h-6 w-6" />
            </button>

            <Dialog open={showHelp} onOpenChange={setShowHelp}>
                <DialogContent className="app-dialog-content w-[95vw] md:max-w-2xl p-0 overflow-hidden">
                        <DialogHeader className="sticky top-0 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-blue-600" />
                                {t("Usage guide")}
                            </DialogTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowHelp(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogHeader>

                        <div className="max-h-[calc(88vh-4.5rem)] overflow-y-auto p-6 space-y-6">
                            <section>
                                <h3 className="text-lg font-semibold mb-3 text-blue-600">{t("What is a question group?")}</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">{t("A question group represents a user intent (what users may ask). Similar questions help the system recognize that group.")}</p>
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                    <p className="text-sm font-medium mb-2">{t("Example")}:</p>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        <li>{t("Example question group line")}</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold mb-3 text-green-600">{t("Name format")}</h3>
                                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t("The question group name is normalized to lower_case_with_underscores. You can preview the normalized name under the input field.")}</p>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg font-mono text-sm">
                                    <pre>{formattedIntent || t("(auto-generated)")}</pre>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold mb-3 text-orange-600">{t("Answer name")}</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">{t("If you enter an answer, it will be created with the default name pattern utter_<group_name>.")}</p>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold mb-3 text-purple-600">{t("Similar questions help")}</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">{t("You can add many similar questions to improve recognition. Use the Generate questions automatically button to let AI suggest more from your sample.")}</p>
                            </section>
                        </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default CreateDataPage;
