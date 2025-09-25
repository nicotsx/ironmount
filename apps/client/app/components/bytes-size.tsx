import React from "react";

type ByteSizeProps = {
	bytes: number;
	base?: 1000 | 1024; // 1000 = SI (KB, MB, ...), 1024 = IEC (KiB, MiB, ...)
	maximumFractionDigits?: number; // default: 2
	smartRounding?: boolean; // dynamically reduces decimals for big numbers (default: true)
	locale?: string | string[]; // e.g., 'en', 'de', or navigator.languages
	space?: boolean; // space between number and unit (default: true)
	className?: string;
	style?: React.CSSProperties;
	fallback?: string; // shown if bytes is not a finite number (default: '—')
};

const SI_UNITS = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"] as const;
const IEC_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"] as const;

type FormatBytesResult = {
	text: string;
	unit: string;
	unitIndex: number;
	numeric: number; // numeric value before formatting (with sign)
};

export function formatBytes(
	bytes: number,
	options?: {
		base?: 1000 | 1024;
		maximumFractionDigits?: number;
		smartRounding?: boolean;
		locale?: string | string[];
	},
): FormatBytesResult {
	const { base = 1000, maximumFractionDigits = 2, smartRounding = true, locale } = options ?? {};

	if (!Number.isFinite(bytes)) {
		return {
			text: "—",
			unit: "",
			unitIndex: 0,
			numeric: NaN,
		};
	}

	const units = base === 1024 ? IEC_UNITS : SI_UNITS;

	const sign = Math.sign(bytes) || 1;
	const abs = Math.abs(bytes);

	let idx = 0;
	if (abs > 0) {
		idx = Math.floor(Math.log(abs) / Math.log(base));
		if (!Number.isFinite(idx)) idx = 0;
		idx = Math.max(0, Math.min(idx, units.length - 1));
	}

	const numeric = (abs / Math.pow(base, idx)) * sign;

	const maxFrac = (() => {
		if (!smartRounding) return maximumFractionDigits;
		const v = Math.abs(numeric);
		if (v >= 100) return 0;
		if (v >= 10) return Math.min(1, maximumFractionDigits);
		return maximumFractionDigits;
	})();

	const text = new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: maxFrac,
	}).format(numeric);

	return {
		text,
		unit: units[idx],
		unitIndex: idx,
		numeric,
	};
}

export function ByteSize(props: ByteSizeProps) {
	const {
		bytes,
		base = 1000,
		maximumFractionDigits = 2,
		smartRounding = true,
		locale,
		space = true,
		className,
		style,
		fallback = "—",
	} = props;

	const { text, unit } = formatBytes(bytes, {
		base,
		maximumFractionDigits,
		smartRounding,
		locale,
	});

	if (text === "—") {
		return (
			<span className={className} style={style}>
				{fallback}
			</span>
		);
	}

	return (
		<span className={className} style={style}>
			{text}
			{space ? " " : ""}
			{unit}
		</span>
	);
}
