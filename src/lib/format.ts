import type { PortableTextBlock } from "emdash";

export function formatDate(date: Date | null | undefined, month: "short" | "long" = "short"): string | null {
	if (!date) return null;
	return date.toLocaleDateString("en-US", { year: "numeric", month, day: "numeric" });
}

const WORDS_PER_MINUTE = 200;
const WHITESPACE_REGEX = /\s+/;

type PortableTextSpan = { _type: string; text?: string };
type PortableTextTextBlock = PortableTextBlock & { _type: "block"; children: PortableTextSpan[] };

function isTextBlock(block: PortableTextBlock): block is PortableTextTextBlock {
	return block._type === "block" && Array.isArray(block.children);
}

/** Plain text from Portable Text blocks (for reading time and fallbacks). */
export function extractText(blocks: PortableTextBlock[] | undefined): string {
	if (!Array.isArray(blocks)) return "";
	return blocks
		.filter(isTextBlock)
		.map((block) =>
			block.children
				.filter((child) => child._type === "span" && typeof child.text === "string")
				.map((span) => span.text)
				.join(""),
		)
		.join(" ");
}

export function getReadingTime(content: PortableTextBlock[] | undefined): number {
	const words = extractText(content).split(WHITESPACE_REGEX).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
