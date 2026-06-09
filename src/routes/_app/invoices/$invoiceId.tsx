import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DocItemsTable } from "#/components/doc-items-table.tsx";
import { PdfButton } from "#/components/pdf-button.tsx";
import { StatusBadge } from "#/components/status-badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
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
import { Textarea } from "#/components/ui/textarea.tsx";
import { fmtDate } from "#/lib/format.ts";
import { formatMoney, toCents } from "#/lib/money.ts";
import type { DocPdfData } from "#/lib/pdf/document-pdf.tsx";
import {
	deleteInvoice,
	getInvoice,
	setInvoiceStatus,
} from "#/lib/server/invoices.ts";
import { createPayment, deletePayment } from "#/lib/server/payments.ts";

export const Route = createFileRoute("/_app/invoices/$invoiceId")({
	loader: ({ params }) => getInvoice({ data: params.invoiceId }),
	component: InvoiceDetail,
});

const STATUSES = [
	"draft",
	"sent",
	"partially_paid",
	"paid",
	"overdue",
	"cancelled",
] as const;

const METHOD_LABEL: Record<string, string> = {
	cash: "Cash",
	bank_transfer: "Bank Transfer",
	cheque: "Cheque",
	mobile_banking: "Mobile Banking",
	other: "Other",
};

function InvoiceDetail() {
	const data = Route.useLoaderData();
	const router = useRouter();
	if (!data) return <p>Invoice not found.</p>;
	const { invoice: inv, items, customer, payments } = data;

	const pdf: DocPdfData = {
		kind: "INVOICE",
		number: inv.number,
		status: inv.status,
		currency: inv.currency,
		issueDate: fmtDate(inv.issueDate),
		secondaryDateLabel: "Due",
		secondaryDate: fmtDate(inv.dueDate),
		customer: {
			name: customer?.name ?? "—",
			companyName: customer?.companyName,
			email: customer?.email,
			phone: customer?.phone,
			address: customer?.address,
		},
		items,
		subtotal: inv.subtotal,
		discountAmount: inv.discountAmount,
		taxAmount: inv.taxAmount,
		total: inv.total,
		amountPaid: inv.amountPaid,
		dueAmount: inv.dueAmount,
		notes: inv.notes,
		terms: inv.terms,
	};

	async function remove() {
		if (!confirm(`Delete ${inv.number}?`)) return;
		await deleteInvoice({ data: inv.id });
		toast.success("Invoice deleted");
		await router.navigate({ to: "/invoices" });
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button asChild variant="ghost" size="icon">
						<Link to="/invoices">
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight">{inv.number}</h1>
						<StatusBadge status={inv.status} />
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<Select
						value={inv.status}
						onValueChange={async (v) => {
							await setInvoiceStatus({
								data: { id: inv.id, status: v as (typeof STATUSES)[number] },
							});
							toast.success(`Status set to ${v.replace("_", " ")}`);
							router.invalidate();
						}}
					>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{STATUSES.map((s) => (
								<SelectItem key={s} value={s} className="capitalize">
									{s.replace("_", " ")}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<PdfButton data={pdf} filename={`${inv.number}.pdf`} />
					<Button variant="destructive" size="icon" onClick={remove}>
						<Trash2 className="size-4" />
					</Button>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Line items</CardTitle>
					</CardHeader>
					<CardContent>
						<DocItemsTable
							items={items}
							currency={inv.currency}
							subtotal={inv.subtotal}
							discountAmount={inv.discountAmount}
							taxAmount={inv.taxAmount}
							total={inv.total}
							amountPaid={inv.amountPaid}
							dueAmount={inv.dueAmount}
						/>
					</CardContent>
				</Card>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Summary</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<Info label="Customer" value={customer?.name} />
							<Info label="Issued" value={fmtDate(inv.issueDate)} />
							<Info label="Due" value={fmtDate(inv.dueDate)} />
							<Info
								label="Balance due"
								value={formatMoney(inv.dueAmount, inv.currency)}
							/>
						</CardContent>
					</Card>

					<RecordPayment
						invoiceId={inv.id}
						currency={inv.currency}
						suggested={inv.dueAmount}
						onSaved={() => router.invalidate()}
					/>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Payments ({payments.length})</CardTitle>
				</CardHeader>
				<CardContent className="px-0">
					{payments.length === 0 ? (
						<p className="text-muted-foreground px-6 text-sm">
							No payments recorded.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Method</TableHead>
									<TableHead>Reference</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead className="w-10" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{payments.map((p) => (
									<TableRow key={p.id}>
										<TableCell>{fmtDate(p.paymentDate)}</TableCell>
										<TableCell>{METHOD_LABEL[p.method] ?? p.method}</TableCell>
										<TableCell>{p.reference || "—"}</TableCell>
										<TableCell className="text-right tabular-nums">
											{formatMoney(p.amount, inv.currency)}
										</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={async () => {
													await deletePayment({ data: p.id });
													toast.success("Payment removed");
													router.invalidate();
												}}
											>
												<Trash2 className="size-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function Info({ label, value }: { label: string; value?: string | null }) {
	return (
		<div>
			<dt className="text-muted-foreground text-xs uppercase">{label}</dt>
			<dd className="break-words">{value || "—"}</dd>
		</div>
	);
}

function RecordPayment({
	invoiceId,
	currency,
	suggested,
	onSaved,
}: {
	invoiceId: string;
	currency: string;
	suggested: number;
	onSaved: () => void;
}) {
	const [amount, setAmount] = useState(
		suggested > 0 ? String(suggested / 100) : "",
	);
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [method, setMethod] = useState("bank_transfer");
	const [reference, setReference] = useState("");
	const [account, setAccount] = useState("");
	const [notes, setNotes] = useState("");
	const [busy, setBusy] = useState(false);

	async function save() {
		const cents = toCents(amount);
		if (cents <= 0) return;
		setBusy(true);
		try {
			await createPayment({
				data: {
					invoiceId,
					amount: cents,
					paymentDate: new Date(date).getTime(),
					method: method as
						| "cash"
						| "bank_transfer"
						| "cheque"
						| "mobile_banking"
						| "other",
					reference,
					receivingAccount: account,
					notes,
				},
			});
			setReference("");
			setAccount("");
			setNotes("");
			toast.success("Payment recorded");
			onSaved();
		} finally {
			setBusy(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Record payment</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1">
						<Label>Amount ({currency})</Label>
						<Input
							type="number"
							min="0"
							step="0.01"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<Label>Date</Label>
						<Input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
						/>
					</div>
				</div>
				<div className="space-y-1">
					<Label>Method</Label>
					<Select value={method} onValueChange={setMethod}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="cash">Cash</SelectItem>
							<SelectItem value="bank_transfer">Bank Transfer</SelectItem>
							<SelectItem value="cheque">Cheque</SelectItem>
							<SelectItem value="mobile_banking">Mobile Banking</SelectItem>
							<SelectItem value="other">Other</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label>Reference #</Label>
					<Input
						value={reference}
						onChange={(e) => setReference(e.target.value)}
					/>
				</div>
				<div className="space-y-1">
					<Label>Receiving account</Label>
					<Input value={account} onChange={(e) => setAccount(e.target.value)} />
				</div>
				<div className="space-y-1">
					<Label>Notes</Label>
					<Textarea
						rows={2}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				</div>
				<Button className="w-full" onClick={save} disabled={busy}>
					{busy ? "Saving…" : "Record payment"}
				</Button>
			</CardContent>
		</Card>
	);
}
