import React, { useEffect } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-twilight.css";
import "prismjs/components/prism-yaml";
import { toast } from "sonner";
import { copyToClipboard } from "~/utils/clipboard";

interface CodeBlockProps {
	code: string;
	language?: string;
	filename?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = "jsx", filename }) => {
	useEffect(() => {
		Prism.highlightAll();
	}, []);

	const handleCopy = async () => {
		await copyToClipboard(code);
		toast.success("Code copied to clipboard");
	};

	return (
		<div className="overflow-hidden rounded-sm bg-slate-900 ring-1 ring-white/10">
			<div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-slate-400">
				<div className="flex items-center gap-1.5">
					<span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
					<span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
					<span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
					{filename && <span className="ml-3 font-medium text-slate-300">{filename}</span>}
				</div>
				<button
					type="button"
					onClick={() => handleCopy()}
					className="cursor-pointer rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 active:translate-y-px"
				>
					Copy
				</button>
			</div>
			<pre className="overflow-x-auto leading-6 text-xs m-0" style={{ marginTop: 0, marginBottom: 0 }}>
				<code className={`language-${language}`}>{code}</code>
			</pre>
		</div>
	);
};
