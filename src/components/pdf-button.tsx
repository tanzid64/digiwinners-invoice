import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button.tsx";
import type { DocPdfData } from "#/lib/pdf/document-pdf.tsx";

/**
 * Generates the PDF on click via a dynamic import so @react-pdf/renderer
 * never enters the SSR bundle. Browser-only.
 */
export function PdfButton({
	data,
	filename,
}: {
	data: DocPdfData;
	filename: string;
}) {
	const [busy, setBusy] = useState(false);

	async function generate() {
		setBusy(true);
		try {
			const [{ pdf }, { DocumentPdf }] = await Promise.all([
				import("@react-pdf/renderer"),
				import("#/lib/pdf/document-pdf.tsx"),
			]);
			const blob = await pdf(<DocumentPdf {...data} />).toBlob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			setBusy(false);
		}
	}

	return (
		<Button variant="outline" onClick={generate} disabled={busy}>
			<Download className="size-4" />
			{busy ? "Generating…" : "PDF"}
		</Button>
	);
}
