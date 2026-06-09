export function fmtDate(d: Date | string | number | null | undefined): string {
	if (!d) return "—";
	return new Date(d).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}
