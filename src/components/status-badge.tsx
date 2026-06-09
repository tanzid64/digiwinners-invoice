import { Badge } from "#/components/ui/badge.tsx";

type Variant =
	| "default"
	| "secondary"
	| "destructive"
	| "outline"
	| "success"
	| "warning"
	| "info"
	| "muted";

const MAP: Record<string, { label: string; variant: Variant }> = {
	// customer
	active: { label: "Active", variant: "success" },
	inactive: { label: "Inactive", variant: "muted" },
	// quotation / invoice / order shared
	draft: { label: "Draft", variant: "muted" },
	sent: { label: "Sent", variant: "info" },
	accepted: { label: "Accepted", variant: "success" },
	rejected: { label: "Rejected", variant: "destructive" },
	expired: { label: "Expired", variant: "warning" },
	// order
	pending: { label: "Pending", variant: "warning" },
	approved: { label: "Approved", variant: "info" },
	in_progress: { label: "In Progress", variant: "info" },
	on_hold: { label: "On Hold", variant: "warning" },
	completed: { label: "Completed", variant: "success" },
	cancelled: { label: "Cancelled", variant: "destructive" },
	not_started: { label: "Not Started", variant: "muted" },
	// invoice
	partially_paid: { label: "Partially Paid", variant: "warning" },
	paid: { label: "Paid", variant: "success" },
	overdue: { label: "Overdue", variant: "destructive" },
	// priority
	low: { label: "Low", variant: "muted" },
	medium: { label: "Medium", variant: "info" },
	high: { label: "High", variant: "warning" },
	urgent: { label: "Urgent", variant: "destructive" },
};

export function StatusBadge({ status }: { status: string }) {
	const conf = MAP[status] ?? { label: status, variant: "default" as const };
	return <Badge variant={conf.variant}>{conf.label}</Badge>;
}
