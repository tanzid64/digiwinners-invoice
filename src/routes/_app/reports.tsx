import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	CircleDollarSign,
	Download,
	Percent,
	Printer,
	Receipt,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { CategoryDonut, RevenueArea } from "#/components/charts.tsx";
import { KpiCard } from "#/components/kpi-card.tsx";
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

function monthLabel(ym: string) {
	const [y, m] = ym.split("-").map(Number);
	return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("en-US", {
		month: "short",
		year: "2-digit",
	});
}

function Reports() {
	const data = Route.useLoaderData();
	const navigate = useNavigate();
	const [tab, setTab] = useState<(typeof TABS)[number]>("Revenue");
	const [from, setFrom] = useState(toInput(data.range.from));
	const [to, setTo] = useState(toInput(data.range.to));

	const collectionRate =
		data.totals.revenue > 0
			? Math.round((data.totals.collection / data.totals.revenue) * 100)
			: 0;
	const areaData = data.monthly.map((m) => ({
		label: monthLabel(m.month),
		value: m.total,
	}));
	const topCustomers = data.customerWise
		.slice(0, 5)
		.map((c) => ({ name: c.name, value: c.invoiced }));

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
				<KpiCard
					label="Total Invoiced"
					value={formatMoney(data.totals.revenue)}
					icon={Receipt}
				/>
				<KpiCard
					label="Collected"
					value={formatMoney(data.totals.collection)}
					icon={CircleDollarSign}
					tone="success"
				/>
				<KpiCard
					label="Outstanding"
					value={formatMoney(data.totals.outstanding)}
					icon={Wallet}
					tone="warning"
				/>
				<KpiCard
					label="Collection Rate"
					value={`${collectionRate}%`}
					icon={Percent}
					tone="info"
					sub={
						<span className="text-muted-foreground">
							{data.totals.overdueCount} overdue
						</span>
					}
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Revenue Overview</CardTitle>
					</CardHeader>
					<CardContent>
						{areaData.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No invoiced revenue in range.
							</p>
						) : (
							<RevenueArea data={areaData} />
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Top Customers</CardTitle>
					</CardHeader>
					<CardContent>
						{topCustomers.length === 0 ? (
							<p className="text-muted-foreground text-sm">No data in range.</p>
						) : (
							<>
								<CategoryDonut data={topCustomers} />
								<ul className="mt-4 space-y-1.5">
									{topCustomers.map((c, i) => (
										<li
											key={c.name}
											className="flex items-center justify-between gap-2 text-sm"
										>
											<span className="flex items-center gap-2 truncate">
												<span
													className="size-2.5 rounded-full"
													style={{
														background: `var(--chart-${(i % 5) + 1})`,
													}}
												/>
												<span className="truncate">{c.name}</span>
											</span>
											<span className="tabular-nums">
												{formatMoney(c.value)}
											</span>
										</li>
									))}
								</ul>
							</>
						)}
					</CardContent>
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
										<TableCell
											key={cols[i]}
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
