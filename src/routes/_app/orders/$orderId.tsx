import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, FilePlus2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProgressDonut } from "#/components/charts.tsx";
import { DocItemsTable } from "#/components/doc-items-table.tsx";
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
import { createInvoiceFromOrder } from "#/lib/server/invoices.ts";
import { deleteOrder, getOrder, setOrderStatus } from "#/lib/server/orders.ts";

export const Route = createFileRoute("/_app/orders/$orderId")({
	loader: ({ params }) => getOrder({ data: params.orderId }),
	component: OrderDetail,
});

const STATUSES = [
	"draft",
	"pending",
	"approved",
	"in_progress",
	"on_hold",
	"completed",
	"cancelled",
] as const;

function OrderDetail() {
	const data = Route.useLoaderData();
	const router = useRouter();
	if (!data) return <p>Order not found.</p>;
	const { order: o, items, customer, invoices, project } = data;

	const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);

	async function makeInvoice() {
		const inv = await createInvoiceFromOrder({ data: o.id });
		toast.success(`Invoice ${inv.number} created`);
		await router.navigate({
			to: "/invoices/$invoiceId",
			params: { invoiceId: inv.id },
		});
	}
	async function remove() {
		if (!confirm(`Delete ${o.number}?`)) return;
		await deleteOrder({ data: o.id });
		toast.success("Order deleted");
		await router.navigate({ to: "/orders" });
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button asChild variant="ghost" size="icon">
						<Link to="/orders">
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight">{o.number}</h1>
						<StatusBadge status={o.status} />
						<StatusBadge status={o.priority} />
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<Select
						value={o.status}
						onValueChange={async (v) => {
							await setOrderStatus({
								data: { id: o.id, status: v as (typeof STATUSES)[number] },
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
					<Button onClick={makeInvoice}>
						<FilePlus2 className="size-4" /> Create invoice
					</Button>
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
							currency={o.currency}
							subtotal={subtotal}
							discountAmount={0}
							taxAmount={0}
							total={o.value}
						/>
					</CardContent>
				</Card>

				<div className="space-y-6">
					{project ? (
						<Card>
							<CardHeader>
								<CardTitle>Project Progress</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col items-center gap-3">
								<ProgressDonut value={project.progress} />
								<Link
									to="/projects/$projectId"
									params={{ projectId: project.id }}
									className="text-sm font-medium hover:underline"
								>
									{project.name}
								</Link>
								<StatusBadge status={project.status} />
							</CardContent>
						</Card>
					) : null}

					<Card>
						<CardHeader>
							<CardTitle>Summary</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<Info label="Customer" value={customer?.name} />
							<Info
								label="Expected delivery"
								value={fmtDate(o.expectedDelivery)}
							/>
							<Info label="Value" value={formatMoney(o.value, o.currency)} />
							{o.notes ? <Info label="Notes" value={o.notes} /> : null}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Invoices ({invoices.length})</CardTitle>
						</CardHeader>
						<CardContent className="px-0">
							{invoices.length === 0 ? (
								<p className="text-muted-foreground px-6 text-sm">
									No invoices generated yet.
								</p>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Number</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Due</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{invoices.map((i) => (
											<TableRow key={i.id}>
												<TableCell>
													<Link
														to="/invoices/$invoiceId"
														params={{ invoiceId: i.id }}
														className="font-medium hover:underline"
													>
														{i.number}
													</Link>
												</TableCell>
												<TableCell>
													<StatusBadge status={i.status} />
												</TableCell>
												<TableCell className="text-right tabular-nums">
													{formatMoney(i.dueAmount, i.currency)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</div>
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
