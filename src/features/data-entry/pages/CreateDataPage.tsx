import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { HelpCircle, X } from "lucide-react";
import { intentService } from "@/features/intents/api/service";
import { responseService } from "@/features/reponses/api/service";
import { storyService } from "@/features/stories/api/service";

export function CreateDataPage() {
    const [showHelp, setShowHelp] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [intentName, setIntentName] = useState("");
    const [initialExample, setInitialExample] = useState("");
    const [examples, setExamples] = useState<string[]>([]);
    const [responseText, setResponseText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'form' | 'examples'>('form');
    const [errors, setErrors] = useState<{ intentName?: string; initialExample?: string; responseText?: string; examples?: string }>({});
    const intentRef = useRef<HTMLInputElement | null>(null);
    const initialExampleRef = useRef<HTMLInputElement | null>(null);
    const responseRef = useRef<HTMLTextAreaElement | null>(null);
    const examplesSectionRef = useRef<HTMLDivElement | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

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

    function buildStoryDefine(storyName: string, steps: Array<{ intentId?: string; actionId?: string }>) {
        const lines: string[] = [];
        lines.push(`- story: ${storyName}`);
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
        const textBlock = responseText ? responseText.trim().split('\n').map((ln) => `      ${ln}`).join('\n') : "";
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
        setIsGenerating(true);
        // Require all main fields before generating: intent name, at least one example, and response
        const seed = examples[0] || initialExample || "";
        const newErrors: typeof errors = {};
        if (!intentName.trim()) newErrors.intentName = "Vui lòng nhập tên intent";
        if (!seed.trim()) newErrors.initialExample = "Vui lòng nhập ít nhất một ví dụ để tạo tự động";
        if (!responseText.trim()) newErrors.responseText = "Vui lòng nhập Response text";
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
            return toast.error(msg);
        }

        // Determine how many to request: if already 10, request 5 each click; otherwise fill up to 10
        const targetTotal = 10;
        const toRequest = examples.length >= targetTotal ? 5 : Math.max(1, targetTotal - examples.length);

        try {
            const payload = { example: seed, num: toRequest, response: responseText };
            const gen = await intentService.geminiExamples(payload);
            // support both shapes: direct array or wrapped { data: { examples: [] } }
            const genAny: any = gen;
            const returnedExamples: string[] = Array.isArray(genAny)
                ? genAny
                : (Array.isArray(genAny?.data?.examples) ? genAny.data.examples : []);
            if (!returnedExamples || returnedExamples.length === 0) return toast.error("Không có ví dụ nào được tạo");
            addExamples(returnedExamples.slice(0, toRequest));
            // clear related errors after successful generation
            setErrors((p) => ({ ...p, examples: undefined, initialExample: undefined }));
            // ensure examples panel is visible so user sees generated examples
            setStep('examples');
            toast.success("Đã thêm ví dụ được tạo");
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi tạo ví dụ tự động");
        }
        finally {
            setIsGenerating(false);
        }
    };

    const goToExamplesStep = () => {
        if (!intentName.trim()) return toast.error(t("Intent name is required"));
        if (!initialExample.trim()) return toast.error(t("Provide at least one example to start"));
        setExamples([initialExample.trim()]);
        setStep('examples');
    };

    const handleSubmit = async () => {
        // Validate required fields: intent name, response text, and at least 5 examples
        const newErrors: typeof errors = {};
        if (!intentName.trim()) newErrors.intentName = "Vui lòng nhập tên intent";
        if (!responseText.trim()) newErrors.responseText = "Vui lòng nhập Response text";
        if (examples.length < 5) {
            newErrors.examples = "Cần ít nhất 5 ví dụ trước khi lưu";
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
        setIsSubmitting(true);
        try {
            // create intent
            const intentPayload = {
                // store the normalized intent name
                name: formattedIntent || formatIntentName(intentName.trim()),
                description: "",
                define: buildIntentDefine(formattedIntent || formatIntentName(intentName.trim()), examples),
                entities: [],
            };

            const createdIntent = await intentService.createIntent(intentPayload as any);

            let createdResponse = null;
            if (responseText.trim()) {
                const respName = `utter_${formattedIntent || formatIntentName(intentName.trim())}`;
                const responsePayload = {
                    name: respName,
                    description: "",
                    define: buildResponseDefine(respName, responseText || intentName.trim()),
                };
                createdResponse = await responseService.createResponse(responsePayload as any);
            }

            // create story linking intent and response (if response created)
            if (createdResponse) {
                const storyName = `story_for_${formattedIntent || formatIntentName(intentName.trim())}`;
                const steps = [{ intentId: createdIntent._id } as { intentId?: string; actionId?: string }];
                if (createdResponse) {
                    steps.push({ actionId: createdResponse._id });
                }

                const storyPayload = {
                    name: storyName,
                    description: "",
                    define: buildStoryDefine(storyName, steps),
                    intents: [createdIntent._id],
                    responses: createdResponse ? [createdResponse._id] : [],
                    // Other fields should exist but be empty arrays per backend expectations
                    action: [],
                    entities: [],
                    slots: [],
                    roles: [],
                };

                await storyService.createStory(storyPayload as any);
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

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-200 dark:border-indigo-900 grid gap-6 relative">
                    <div>
                        <label className="block text-base font-medium mb-2 text-slate-700">{t("Intent name")}</label>
                        <Input
                            ref={intentRef}
                            className={`h-12 text-base ${errors.intentName ? 'border-red-500 ring-1 ring-red-300' : ''}`}
                            value={intentName}
                            onChange={(e) => { setIntentName(e.target.value); setErrors((p) => ({ ...p, intentName: undefined })); }}
                        />
                        {errors.intentName && <div className="mt-1 text-sm text-red-600">{errors.intentName}</div>}
                        <div className="mt-3 text-sm text-slate-600">Formatted name: <span className="font-mono text-sm ml-2 text-indigo-700">{formattedIntent || <span className="text-slate-400">(will be generated)</span>}</span></div>
                    </div>

                    {step === 'form' ? (
                        <div>
                            <label className="block text-base font-medium mb-2 text-slate-700">Example (nhập 1 ví dụ để bắt đầu)</label>
                            <Input
                                ref={initialExampleRef}
                                className={`h-12 text-base ${errors.initialExample ? 'border-red-500 ring-1 ring-red-300' : ''}`}
                                value={initialExample}
                                onChange={(e) => { setInitialExample(e.target.value); setErrors((p) => ({ ...p, initialExample: undefined, examples: undefined })); }}
                            />
                            {errors.initialExample && <div className="mt-1 text-sm text-red-600">{errors.initialExample}</div>}
                            {/* Removed inline example action buttons — controls moved to bottom-right */}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-base font-medium mb-2 text-slate-700">Examples</label>
                            <div className="space-y-2" ref={examplesSectionRef}>
                                {examples.length === 0 ? (
                                    <div className="text-sm text-slate-500">Chưa có examples. Thêm hoặc tạo tự động.</div>
                                ) : (
                                    examples.map((ex, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input
                                                className={`h-10 flex-1 ${errors.examples ? 'border-red-500 ring-1 ring-red-300' : ''}`}
                                                value={ex}
                                                onChange={(e) => { setExamples((prev) => prev.map((p, i) => i === idx ? e.target.value : p)); if (examples.length >= 5) setErrors((p) => ({ ...p, examples: undefined })); }}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => removeExample(idx)} aria-label={"Xóa example"}>
                                                <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* example buttons removed from here and placed at bottom-right */}

                            <div className="mt-4 flex items-center gap-2">
                                <Button variant="ghost" onClick={() => setStep('form')}>Quay lại</Button>
                            </div>
                            {errors.examples && <div className="mt-2 text-sm text-red-600">{errors.examples}</div>}
                        </div>
                    )}

                    <div>
                        <label className="block text-base font-medium mb-2 text-slate-700">{t("Response text")}</label>
                        <Textarea
                            className={`h-24 text-base ${errors.responseText ? 'border-red-500 ring-1 ring-red-300' : ''}`}
                            value={responseText}
                            onChange={(e) => { setResponseText(e.target.value); setErrors((p) => ({ ...p, responseText: undefined })); }}
                        />
                        {errors.responseText && <div className="mt-1 text-sm text-red-600">{errors.responseText}</div>}
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
                            Thêm example tự động
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
                            Xóa tất cả examples
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
