import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { StatusBadge } from "#/components/status-badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table.tsx";
import { downloadCSV } from "#/lib/export.ts";
import { fmtDate } from "#/lib/format.ts";
import { formatMoney, fromCents } from "#/lib/money.ts";
import { getReports } from "#/lib/server/reports.ts";

const searchSchema = z.object({
	from: z.number().optional(),
	to: z.number().optional(),
});

export const Route = createFileRoute("/_app/reports")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ from: search.from, to: search.to }),
	loader: ({ deps }) => getReports({ data: deps }),
	component: Reports,
});

const TABS = [
	"Revenue",
	"Collection",
	"Outstanding",
	"Overdue",
	"Customer-wise",
	"Monthly",
	"Yearly",
	"Payments",
] as const;

function toInput(ms: number) {
	return new Date(ms).toISOString().slice(0, 10);
}

function Reports() {
	const data = Route.useLoaderData();
	const navigate = useNavigate();
	const [tab, setTab] = useState<(typeof TABS)[number]>("Revenue");
	const [from, setFrom] = useState(toInput(data.range.from));
	const [to, setTo] = useState(toInput(data.range.to));

	function applyRange() {
		navigate({
			to: "/reports",
			search: {
				from: new Date(from).getTime(),
				to: new Date(to).getTime(),
			},
		});
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Financial Reports
					</h1>
					<p className="text-muted-foreground">
						{fmtDate(data.range.from)} – {fmtDate(data.range.to)}
					</p>
				</div>
				<div className="flex flex-wrap items-end gap-2">
					<div className="space-y-1">
						<Label className="text-xs">From</Label>
						<Input
							type="date"
							value={from}
							onChange={(e) => setFrom(e.target.value)}
							className="w-40"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">To</Label>
						<Input
							type="date"
							value={to}
							onChange={(e) => setTo(e.target.value)}
							className="w-40"
						/>
					</div>
					<Button variant="outline" onClick={applyRange}>
						Apply
					</Button>
					<Button variant="outline" onClick={() => window.print()}>
						<Printer className="size-4" /> Print
					</Button>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Summary label="Revenue (invoiced)" value={data.totals.revenue} />
				<Summary label="Collected" value={data.totals.collection} />
				<Summary
					label="Outstanding (current)"
					value={data.totals.outstanding}
				/>
				<Card>
					<CardHeader>
						<CardDescription>Overdue invoices</CardDescription>
						<CardTitle className="text-2xl">
							{data.totals.overdueCount}
						</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<div className="flex flex-wrap gap-2 print:hidden">
				{TABS.map((t) => (
					<Button
						key={t}
						variant={tab === t ? "default" : "outline"}
						size="sm"
						onClick={() => setTab(t)}
					>
						{t}
					</Button>
				))}
			</div>

			<Card className="py-0">
				<CardContent className="p-0">
					{tab === "Revenue" && (
						<ReportTable
							title="revenue"
							cols={["Invoice", "Customer", "Issued", "Status", "Total"]}
							rows={data.revenue}
							render={(i) => [
								i.number,
								i.customerName ?? "—",
								fmtDate(i.issueDate),
								<StatusBadge key="s" status={i.status} />,
								formatMoney(i.total, i.currency),
							]}
							csv={(i) => ({
								Invoice: i.number,
								Customer: i.customerName ?? "",
								Issued: fmtDate(i.issueDate),
								Status: i.status,
								Total: fromCents(i.total),
							})}
						/>
					)}
					{tab === "Collection" && (
						<ReportTable
							title="collection"
							cols={["Date", "Invoice", "Customer", "Method", "Amount"]}
							rows={data.payments}
							render={(p) => [
								fmtDate(p.paymentDate),
								p.invoiceNumber ?? "—",
								p.customerName ?? "—",
								p.method.replace("_", " "),
								formatMoney(p.amount),
							]}
							csv={(p) => ({
								Date: fmtDate(p.paymentDate),
								Invoice: p.invoiceNumber ?? "",
								Customer: p.customerName ?? "",
								Method: p.method,
								Amount: fromCents(p.amount),
							})}
						/>
					)}
					{tab === "Outstanding" && (
						<ReportTable
							title="outstanding"
							cols={["Invoice", "Customer", "Due date", "Status", "Balance"]}
							rows={data.outstandingInvoices}
							render={(i) => [
								i.number,
								i.customerName ?? "—",
								fmtDate(i.dueDate),
								<StatusBadge key="s" status={i.status} />,
								formatMoney(i.dueAmount, i.currency),
							]}
							csv={(i) => ({
								Invoice: i.number,
								Customer: i.customerName ?? "",
								"Due date": fmtDate(i.dueDate),
								Status: i.status,
								Balance: fromCents(i.dueAmount),
							})}
						/>
					)}
					{tab === "Overdue" && (
						<ReportTable
							title="overdue"
							cols={["Invoice", "Customer", "Due date", "Balance"]}
							rows={data.overdueInvoices}
							render={(i) => [
								i.number,
								i.customerName ?? "—",
								fmtDate(i.dueDate),
								formatMoney(i.dueAmount, i.currency),
							]}
							csv={(i) => ({
								Invoice: i.number,
								Customer: i.customerName ?? "",
								"Due date": fmtDate(i.dueDate),
								Balance: fromCents(i.dueAmount),
							})}
						/>
					)}
					{tab === "Customer-wise" && (
						<ReportTable
							title="customer-revenue"
							cols={["Customer", "Invoiced", "Collected", "Outstanding"]}
							rows={data.customerWise}
							render={(c) => [
								c.name,
								formatMoney(c.invoiced),
								formatMoney(c.collected),
								formatMoney(c.outstanding),
							]}
							csv={(c) => ({
								Customer: c.name,
								Invoiced: fromCents(c.invoiced),
								Collected: fromCents(c.collected),
								Outstanding: fromCents(c.outstanding),
							})}
						/>
					)}
					{tab === "Monthly" && (
						<ReportTable
							title="monthly-revenue"
							cols={["Month", "Revenue"]}
							rows={data.monthly}
							render={(m) => [m.month, formatMoney(m.total)]}
							csv={(m) => ({ Month: m.month, Revenue: fromCents(m.total) })}
						/>
					)}
					{tab === "Yearly" && (
						<ReportTable
							title="yearly-revenue"
							cols={["Year", "Revenue"]}
							rows={data.yearly}
							render={(y) => [y.year, formatMoney(y.total)]}
							csv={(y) => ({ Year: y.year, Revenue: fromCents(y.total) })}
						/>
					)}
					{tab === "Payments" && (
						<ReportTable
							title="payment-history"
							cols={["Date", "Invoice", "Customer", "Method", "Ref", "Amount"]}
							rows={data.payments}
							render={(p) => [
								fmtDate(p.paymentDate),
								p.invoiceNumber ?? "—",
								p.customerName ?? "—",
								p.method.replace("_", " "),
								p.reference ?? "—",
								formatMoney(p.amount),
							]}
							csv={(p) => ({
								Date: fmtDate(p.paymentDate),
								Invoice: p.invoiceNumber ?? "",
								Customer: p.customerName ?? "",
								Method: p.method,
								Ref: p.reference ?? "",
								Amount: fromCents(p.amount),
							})}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function Summary({ label, value }: { label: string; value: number }) {
	return (
		<Card>
			<CardHeader>
				<CardDescription>{label}</CardDescription>
				<CardTitle className="text-2xl">{formatMoney(value)}</CardTitle>
			</CardHeader>
		</Card>
	);
}

function ReportTable<T>({
	title,
	cols,
	rows,
	render,
	csv,
}: {
	title: string;
	cols: string[];
	rows: T[];
	render: (row: T) => React.ReactNode[];
	csv: (row: T) => Record<string, string | number>;
}) {
	function exportCsv() {
		if (rows.length === 0) return;
		const sample = csv(rows[0]);
		const columns = Object.keys(sample).map((header) => ({
			header,
			value: (r: T) => csv(r)[header],
		}));
		downloadCSV(title, columns, rows);
	}

	return (
		<div>
			<div className="flex justify-end p-3 print:hidden">
				<Button variant="outline" size="sm" onClick={exportCsv}>
					<Download className="size-4" /> Excel / CSV
				</Button>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						{cols.map((c, i) => (
							<TableHead
								key={c}
								className={i >= cols.length - 1 ? "text-right" : ""}
							>
								{c}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={cols.length}
								className="text-muted-foreground py-10 text-center"
							>
								No data in range.
							</TableCell>
						</TableRow>
					) : (
						rows.map((row, idx) => {
							const cells = render(row);
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: report rows are positional
								<TableRow key={idx}>
									{cells.map((cell, i) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: fixed column layout
										<TableCell
											key={i}
											className={`${i >= cells.length - 1 ? "text-right tabular-nums" : ""} ${i === 0 ? "font-medium" : ""}`}
										>
											{cell}
										</TableCell>
									))}
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</div>
	);
}
