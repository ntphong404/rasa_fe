import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          p: ({ ...props }) => (
            <p className="whitespace-pre-wrap" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="my-2 list-disc list-inside space-y-1" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="my-2 list-decimal list-inside space-y-1" {...props} />
          ),
          li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
          a: ({ ...props }) => (
            <a
              {...props}
              className="text-blue-600 underline hover:text-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          code: (props: any) => {
            const { inline, ...restProps } = props;
            return inline ? (
              <code
                className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] dark:bg-slate-800"
                {...restProps}
              />
            ) : (
              <code className="block whitespace-pre-wrap" {...restProps} />
            );
          },
          pre: ({ ...props }) => (
            <pre className="my-2 overflow-x-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="my-2 border-l-4 border-slate-300 pl-3 text-slate-600 dark:border-slate-600 dark:text-slate-300" {...props} />
          ),
          table: ({ ...props }) => (
            <table className="my-2 w-full border-collapse text-sm" {...props} />
          ),
          th: ({ ...props }) => (
            <th className="border border-slate-200 bg-slate-100 px-2 py-1 text-left text-xs font-semibold dark:border-slate-700 dark:bg-slate-800" {...props} />
          ),
          td: ({ ...props }) => (
            <td className="border border-slate-200 px-2 py-1 text-xs dark:border-slate-700" {...props} />
          ),
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
