import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	CircleDollarSign,
	FolderKanban,
	Package,
	Receipt,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";
import { RevenueBars } from "#/components/charts.tsx";
import { KpiCard } from "#/components/kpi-card.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { StatusBadge } from "#/components/status-badge.tsx";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { fmtDate } from "#/lib/format.ts";
import { formatMoney } from "#/lib/money.ts";
import { getDashboard } from "#/lib/server/dashboard.ts";

export const Route = createFileRoute("/_app/dashboard")({
	loader: () => getDashboard(),
	component: Dashboard,
});

function monthLabel(ym: string) {
	const [y, m] = ym.split("-").map(Number);
	return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("en-US", {
		month: "short",
	});
}

function Dashboard() {
	const {
		kpis,
		recentActivities,
		recentPayments,
		recentOrders,
		monthlyRevenue,
	} = Route.useLoaderData();

	const bars = [...monthlyRevenue]
		.reverse()
		.map((m) => ({ label: monthLabel(m.month), value: m.total }));

	return (
		<div className="space-y-6">
			<PageHeader
				title="Dashboard"
				description="Business overview at a glance."
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<KpiCard
					label="Total Customers"
					value={kpis.totalCustomers}
					icon={Users}
				/>
				<KpiCard label="Total Orders" value={kpis.totalOrders} icon={Package} />
				<KpiCard
					label="Total Invoiced"
					value={formatMoney(kpis.totalInvoiced)}
					icon={Receipt}
				/>
				<KpiCard
					label="Total Collected"
					value={formatMoney(kpis.totalCollected)}
					icon={CircleDollarSign}
					tone="success"
				/>
				<KpiCard
					label="Outstanding Due"
					value={formatMoney(kpis.outstanding)}
					icon={Wallet}
					tone="warning"
				/>
				<KpiCard
					label="Overdue Invoices"
					value={kpis.overdueCount}
					icon={AlertTriangle}
					tone={kpis.overdueCount > 0 ? "danger" : "primary"}
				/>
				<KpiCard
					label="Active Projects"
					value={kpis.activeProjects}
					icon={FolderKanban}
					tone="info"
				/>
				<KpiCard
					label="This Month Revenue"
					value={formatMoney(kpis.monthlyRevenue)}
					icon={TrendingUp}
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Monthly Revenue</CardTitle>
					</CardHeader>
					<CardContent>
						{bars.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No invoiced revenue yet.
							</p>
						) : (
							<RevenueBars data={bars} />
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
					</CardHeader>
					<CardContent>
						{recentActivities.length === 0 ? (
							<p className="text-muted-foreground text-sm">No activity yet.</p>
						) : (
							<ol className="space-y-3">
								{recentActivities.map((a) => (
									<li key={a.id} className="flex gap-3">
										<div className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
										<div className="min-w-0">
											<p className="text-sm font-medium">{a.title}</p>
											<p className="text-muted-foreground text-xs">
												{fmtDate(a.createdAt)}
											</p>
										</div>
									</li>
								))}
							</ol>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Recent Payments</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1">
						{recentPayments.length === 0 ? (
							<p className="text-muted-foreground text-sm">No payments yet.</p>
						) : (
							recentPayments.map((p) => (
								<Link
									key={p.id}
									to="/invoices/$invoiceId"
									params={{ invoiceId: p.invoiceId }}
									className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm"
								>
									<div className="min-w-0">
										<p className="font-medium">{p.invoiceNumber}</p>
										<p className="text-muted-foreground truncate text-xs">
											{p.customerName}
										</p>
									</div>
									<div className="text-right">
										<p className="font-medium tabular-nums">
											{formatMoney(p.amount)}
										</p>
										<p className="text-muted-foreground text-xs">
											{fmtDate(p.paymentDate)}
										</p>
									</div>
								</Link>
							))
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Recent Orders</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1">
						{recentOrders.length === 0 ? (
							<p className="text-muted-foreground text-sm">No orders yet.</p>
						) : (
							recentOrders.map((o) => (
								<Link
									key={o.id}
									to="/orders/$orderId"
									params={{ orderId: o.id }}
									className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm"
								>
									<div className="min-w-0">
										<p className="font-medium">{o.number}</p>
										<p className="text-muted-foreground truncate text-xs">
											{o.customerName}
										</p>
									</div>
									<div className="flex items-center gap-3">
										<StatusBadge status={o.status} />
										<span className="tabular-nums">
											{formatMoney(o.value, o.currency)}
										</span>
									</div>
								</Link>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
