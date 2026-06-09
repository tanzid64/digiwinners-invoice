/** Client-side CSV export. Columns map a header to a row accessor. */
export function downloadCSV<T>(
	filename: string,
	columns: { header: string; value: (row: T) => string | number }[],
	rows: T[],
): void {
	const esc = (v: string | number) => {
		const s = String(v ?? "");
		return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	const head = columns.map((c) => esc(c.header)).join(",");
	const body = rows
		.map((r) => columns.map((c) => esc(c.value(r))).join(","))
		.join("\n");
	const csv = `${head}\n${body}`;
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}
