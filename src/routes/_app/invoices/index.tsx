import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "#/components/empty-state.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { StatusBadge } from "#/components/status-badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card } from "#/components/ui/card.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table.tsx";
import { fmtDate } from "#/lib/format.ts";
import { formatMoney } from "#/lib/money.ts";
import { listInvoices } from "#/lib/server/invoices.ts";

export const Route = createFileRoute("/_app/invoices/")({
	loader: () => listInvoices(),
	component: InvoicesList,
});

const FILTERS = [
	"all",
	"draft",
	"sent",
	"partially_paid",
	"paid",
	"overdue",
	"cancelled",
] as const;

function InvoicesList() {
	const rows = Route.useLoaderData();
	const [status, setStatus] = useState<(typeof FILTERS)[number]>("all");
	const filtered = useMemo(
		() => (status === "all" ? rows : rows.filter((r) => r.status === status)),
		[rows, status],
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Invoices"
				description={`${rows.length} total`}
				actions={
					<Button asChild>
						<Link to="/invoices/new">
							<Plus className="size-4" /> New invoice
						</Link>
					</Button>
				}
			/>

			<Select
				value={status}
				onValueChange={(v) => setStatus(v as typeof status)}
			>
				<SelectTrigger className="w-48">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{FILTERS.map((f) => (
						<SelectItem key={f} value={f} className="capitalize">
							{f === "all" ? "All statuses" : f.replace("_", " ")}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Card className="py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Number</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Due date</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Total</TableHead>
							<TableHead className="text-right">Balance</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="p-0">
									<EmptyState
										icon={Receipt}
										title="No invoices"
										description="Create an invoice or generate one from an order."
										action={
											<Button asChild size="sm">
												<Link to="/invoices/new">
													<Plus className="size-4" /> New invoice
												</Link>
											</Button>
										}
									/>
								</TableCell>
							</TableRow>
						) : (
							filtered.map((i) => (
								<TableRow key={i.id}>
									<TableCell className="font-medium">
										<Link
											to="/invoices/$invoiceId"
											params={{ invoiceId: i.id }}
											className="hover:underline"
										>
											{i.number}
										</Link>
									</TableCell>
									<TableCell>{i.customerName ?? "—"}</TableCell>
									<TableCell>{fmtDate(i.dueDate)}</TableCell>
									<TableCell>
										<StatusBadge status={i.status} />
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatMoney(i.total, i.currency)}
									</TableCell>
									<TableCell className="text-right tabular-nums font-medium">
										{formatMoney(i.dueAmount, i.currency)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
}
