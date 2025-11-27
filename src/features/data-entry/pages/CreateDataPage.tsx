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
        
        // Require all main fields before generating: intent name, at least one example, and response
        const seed = examples[0] || initialExample || "";
        const newErrors: typeof errors = {};
        if (!intentName.trim()) newErrors.intentName = "Vui lòng nhập tên nhóm câu hỏi";
        if (!seed.trim()) newErrors.initialExample = "Vui lòng nhập ít nhất một câu hỏi để tạo tự động";
        if (!responseText.trim()) newErrors.responseText = "Vui lòng nhập câu trả lời";
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
            if (!returnedExamples || returnedExamples.length === 0) return toast.error("Không có câu hỏi nào được tạo");

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
            toast.success("Đã thêm các câu hỏi tự động");
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi tạo ví dụ tự động");
        }
        finally {
            setIsGenerating(false);
        }
    };

    const goToExamplesStep = () => {
        if (!intentName.trim()) return toast.error("Vui lòng nhập tên nhóm câu hỏi");
        if (!initialExample.trim()) return toast.error("Vui lòng nhập ít nhất một câu hỏi để bắt đầu");
        setExamples([initialExample.trim()]);
        setStep('examples');
    };

    const handleSubmit = async () => {
        // Validate required fields: intent name, response text, and at least 5 examples
        const newErrors: typeof errors = {};
        if (!intentName.trim()) newErrors.intentName = "Vui lòng nhập tên nhóm câu hỏi";
        if (!responseText.trim()) newErrors.responseText = "Vui lòng nhập câu trả lời";
        if (examples.length < 5) {
            newErrors.examples = "Cần ít nhất 5 câu hỏi trước khi lưu";
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

            toast.success("Tạo dữ liệu thành công");
            // Reset form after successful save
            setIntentName("");
            setInitialExample("");
            setExamples([]);
            setResponseText("");
            setStep('form');
            setErrors({});
            // Focus back to intent name input
            setTimeout(() => {
                intentRef.current?.focus();
            }, 100);
        } catch (err) {
            console.error(err);
            toast.error("Tạo dữ liệu thất bại");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="container mx-auto p-6 max-w-6xl w-full">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">Thêm dữ liệu nhanh</h1>
                        <p className="text-sm text-muted-foreground">Tạo nhóm câu hỏi, câu trả lời và liên kết chúng với nhau</p>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => navigate('/add-data/import')}>Nhập từ Excel</Button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-slate-300 dark:border-slate-600 grid gap-6 relative">
                    <div>
                        <label className="block text-base font-medium mb-2 text-slate-700">Tên nhóm câu hỏi</label>
                        <div className="relative mb-7">
                            <Input
                                ref={intentRef}
                                className={`h-12 text-base ${errors.intentName ? 'border-red-500 ring-1 ring-red-300' : ''}`}
                                value={intentName}
                                onChange={(e) => { setIntentName(e.target.value); setErrors((p) => ({ ...p, intentName: undefined })); }}
                            />
                            {errors.intentName && <div className="absolute left-0 top-full mt-1 text-sm text-red-600 whitespace-nowrap z-10">{errors.intentName}</div>}
                        </div>
                        <div className="text-sm text-slate-600">Tên chuẩn hóa: <span className="font-mono text-sm ml-2 text-indigo-700">{formattedIntent || <span className="text-slate-400">(sẽ được tạo tự động)</span>}</span></div>
                    </div>

                    {step === 'form' ? (
                        <div>
                            <label className="block text-base font-medium mb-2 text-slate-700">Câu hỏi mẫu (nhập 1 câu hỏi để bắt đầu)</label>
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
                            <label className="block text-base font-medium mb-2 text-slate-700">Các câu hỏi tương tự</label>
                            <div className="space-y-2" ref={examplesSectionRef}>
                                {examples.length === 0 ? (
                                    <div className="text-sm text-slate-500">Chưa có câu hỏi. Thêm hoặc tạo tự động.</div>
                                ) : (
                                    examples.map((ex, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input
                                                className={`h-10 flex-1 ${errors.examples ? 'border-red-500 ring-1 ring-red-300' : ''}`}
                                                value={ex}
                                                onChange={(e) => { setExamples((prev) => prev.map((p, i) => i === idx ? e.target.value : p)); if (examples.length >= 5) setErrors((p) => ({ ...p, examples: undefined })); }}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => removeExample(idx)} aria-label={"Xóa câu hỏi"}>
                                                <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* example buttons removed from here and placed at bottom-right */}

                            <div className="mt-4 flex items-center gap-2 relative">
                                <Button variant="ghost" onClick={() => setStep('form')}>Quay lại</Button>
                                {errors.examples && <div className="absolute left-0 top-full mt-2 text-sm text-red-600 whitespace-nowrap">{errors.examples}</div>}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-base font-medium mb-2 text-slate-700">Câu trả lời</label>
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
                            {isSubmitting ? "Đang lưu..." : "Lưu"}
                        </Button>
                        <Button variant="ghost" onClick={handleCancel}>
                            Hủy
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
                            Tạo câu hỏi tự động
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
                            Xóa tất cả câu hỏi
                        </Button>
                    </div>
                </div>
            </div>

            {/* Floating Help Button and Modal (like Rule page) */}
            <button
                className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 z-50 flex items-center justify-center"
                onClick={() => setShowHelp(true)}
                aria-label="Trợ giúp"
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
                                Hướng dẫn sử dụng
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
                                <h3 className="text-lg font-semibold mb-3 text-blue-600">📌 Nhóm câu hỏi là gì?</h3>
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">Nhóm câu hỏi đại diện cho ý định của người dùng (những gì người dùng có thể hỏi). Các câu hỏi tương tự giúp hệ thống nhận diện nhóm câu hỏi.</p>
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                    <p className="text-sm font-medium mb-2">Ví dụ:</p>
                                    <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                        <li>• <code className="bg-white dark:bg-gray-900 px-1 rounded">chao_hoi</code> - người dùng chào hỏi</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold mb-3 text-green-600">🏷️ Định dạng tên</h3>
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-3">Tên nhóm câu hỏi sẽ được chuẩn hóa thành <code className="font-mono">chu_thuong_gach_duoi</code>. Bạn có thể xem trước tên đã chuẩn hóa bên dưới ô nhập.</p>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg font-mono text-sm">
                                    <pre>{formattedIntent || "(sẽ được tạo tự động)"}</pre>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold mb-3 text-orange-600">💬 Tên câu trả lời</h3>
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">Nếu bạn nhập câu trả lời, nó sẽ được tạo với tên <code className="font-mono">utter_{`<ten_nhom>`}</code> theo mặc định.</p>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold mb-3 text-purple-600">✍️ Các câu hỏi tương tự</h3>
                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">Bạn có thể thêm nhiều câu hỏi tương tự để hệ thống nhận diện tốt hơn. Sử dụng nút "Tạo câu hỏi tự động" để AI tạo thêm các câu hỏi tương tự dựa trên câu hỏi mẫu của bạn.</p>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CreateDataPage;
