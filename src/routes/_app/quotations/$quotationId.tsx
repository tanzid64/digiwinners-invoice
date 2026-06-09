import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRightLeft, Trash2 } from "lucide-react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import { fmtDate } from "#/lib/format.ts";
import { formatMoney } from "#/lib/money.ts";
import type { DocPdfData } from "#/lib/pdf/document-pdf.tsx";
import {
	convertQuotationToOrder,
	deleteQuotation,
	getQuotation,
	setQuotationStatus,
} from "#/lib/server/quotations.ts";

export const Route = createFileRoute("/_app/quotations/$quotationId")({
	loader: ({ params }) => getQuotation({ data: params.quotationId }),
	component: QuotationDetail,
});

const STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;

function QuotationDetail() {
	const data = Route.useLoaderData();
	const router = useRouter();
	if (!data) return <p>Quotation not found.</p>;
	const { quotation: q, items, customer } = data;

	const pdf: DocPdfData = {
		kind: "QUOTATION",
		number: q.number,
		status: q.status,
		currency: q.currency,
		issueDate: fmtDate(q.issueDate),
		secondaryDateLabel: "Valid until",
		secondaryDate: fmtDate(q.validUntil),
		customer: {
			name: customer?.name ?? "—",
			companyName: customer?.companyName,
			email: customer?.email,
			phone: customer?.phone,
			address: customer?.address,
		},
		items,
		subtotal: q.subtotal,
		discountAmount: q.discountAmount,
		taxAmount: q.taxAmount,
		total: q.total,
		notes: q.notes,
		terms: q.terms,
	};

	async function convert() {
		const { orderId } = await convertQuotationToOrder({ data: q.id });
		await router.navigate({ to: "/orders/$orderId", params: { orderId } });
	}
	async function remove() {
		if (!confirm(`Delete ${q.number}?`)) return;
		await deleteQuotation({ data: q.id });
		await router.navigate({ to: "/quotations" });
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button asChild variant="ghost" size="icon">
						<Link to="/quotations">
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight">{q.number}</h1>
						<StatusBadge status={q.status} />
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<Select
						value={q.status}
						onValueChange={async (v) => {
							await setQuotationStatus({
								data: { id: q.id, status: v as (typeof STATUSES)[number] },
							});
							router.invalidate();
						}}
					>
						<SelectTrigger className="w-36">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{STATUSES.map((s) => (
								<SelectItem key={s} value={s} className="capitalize">
									{s}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<PdfButton data={pdf} filename={`${q.number}.pdf`} />
					{!q.convertedOrderId ? (
						<Button onClick={convert}>
							<ArrowRightLeft className="size-4" /> Convert to order
						</Button>
					) : (
						<Button asChild variant="secondary">
							<Link
								to="/orders/$orderId"
								params={{ orderId: q.convertedOrderId }}
							>
								View order
							</Link>
						</Button>
					)}
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
							currency={q.currency}
							subtotal={q.subtotal}
							discountAmount={q.discountAmount}
							taxAmount={q.taxAmount}
							total={q.total}
						/>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Summary</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<Info label="Customer" value={customer?.name} />
						<Info label="Issued" value={fmtDate(q.issueDate)} />
						<Info label="Valid until" value={fmtDate(q.validUntil)} />
						<Info label="Total" value={formatMoney(q.total, q.currency)} />
						{q.notes ? <Info label="Notes" value={q.notes} /> : null}
						{q.terms ? <Info label="Terms" value={q.terms} /> : null}
					</CardContent>
				</Card>
			</div>
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
