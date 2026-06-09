import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";
import { EmptyState } from "#/components/empty-state.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { StatusBadge } from "#/components/status-badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card } from "#/components/ui/card.tsx";
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
import { listQuotations } from "#/lib/server/quotations.ts";

export const Route = createFileRoute("/_app/quotations/")({
	loader: () => listQuotations(),
	component: QuotationsList,
});

function QuotationsList() {
	const rows = Route.useLoaderData();
	return (
		<div className="space-y-6">
			<PageHeader
				title="Quotations"
				description={`${rows.length} total`}
				actions={
					<Button asChild>
						<Link to="/quotations/new">
							<Plus className="size-4" /> New quotation
						</Link>
					</Button>
				}
			/>
			<Card className="py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Number</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Issued</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Total</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="p-0">
									<EmptyState
										icon={FileText}
										title="No quotations yet"
										description="Create a quotation to send pricing to a customer."
										action={
											<Button asChild size="sm">
												<Link to="/quotations/new">
													<Plus className="size-4" /> New quotation
												</Link>
											</Button>
										}
									/>
								</TableCell>
							</TableRow>
						) : (
							rows.map((q) => (
								<TableRow key={q.id}>
									<TableCell className="font-medium">
										<Link
											to="/quotations/$quotationId"
											params={{ quotationId: q.id }}
											className="hover:underline"
										>
											{q.number}
										</Link>
									</TableCell>
									<TableCell>{q.customerName ?? "—"}</TableCell>
									<TableCell>{fmtDate(q.issueDate)}</TableCell>
									<TableCell>
										<StatusBadge status={q.status} />
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatMoney(q.total, q.currency)}
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
