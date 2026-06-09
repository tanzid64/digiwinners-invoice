import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "#/components/empty-state.tsx";
import { PageHeader } from "#/components/page-header.tsx";
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
import { deletePayment, listPayments } from "#/lib/server/payments.ts";

export const Route = createFileRoute("/_app/payments/")({
	loader: () => listPayments(),
	component: PaymentsList,
});

const METHOD_LABEL: Record<string, string> = {
	cash: "Cash",
	bank_transfer: "Bank Transfer",
	cheque: "Cheque",
	mobile_banking: "Mobile Banking",
	other: "Other",
};

function PaymentsList() {
	const rows = Route.useLoaderData();
	const router = useRouter();
	const total = rows.reduce((s, p) => s + p.amount, 0);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Payments"
				description={`${rows.length} payments · ${formatMoney(total)} collected. Record payments from an invoice.`}
			/>
			<Card className="py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead>Invoice</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Method</TableHead>
							<TableHead>Reference</TableHead>
							<TableHead className="text-right">Amount</TableHead>
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="p-0">
									<EmptyState
										icon={Wallet}
										title="No payments recorded"
										description="Open an invoice to record a received payment."
									/>
								</TableCell>
							</TableRow>
						) : (
							rows.map((p) => (
								<TableRow key={p.id}>
									<TableCell>{fmtDate(p.paymentDate)}</TableCell>
									<TableCell className="font-medium">
										<Link
											to="/invoices/$invoiceId"
											params={{ invoiceId: p.invoiceId }}
											className="hover:underline"
										>
											{p.invoiceNumber ?? "—"}
										</Link>
									</TableCell>
									<TableCell>{p.customerName ?? "—"}</TableCell>
									<TableCell>{METHOD_LABEL[p.method] ?? p.method}</TableCell>
									<TableCell>{p.reference || "—"}</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatMoney(p.amount)}
									</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={async () => {
												await deletePayment({ data: p.id });
												toast.success("Payment deleted");
												router.invalidate();
											}}
										>
											<Trash2 className="size-4" />
										</Button>
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
