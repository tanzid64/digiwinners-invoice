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

function Dashboard() {
	const {
		kpis,
		recentActivities,
		recentPayments,
		recentOrders,
		monthlyRevenue,
	} = Route.useLoaderData();

	const maxMonth = Math.max(1, ...monthlyRevenue.map((m) => m.total));

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground">Business overview at a glance.</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<Kpi label="Total Customers" value={kpis.totalCustomers} icon={Users} />
				<Kpi label="Total Orders" value={kpis.totalOrders} icon={Package} />
				<Kpi
					label="Active Projects"
					value={kpis.activeProjects}
					icon={FolderKanban}
				/>
				<Kpi
					label="Total Invoiced"
					value={formatMoney(kpis.totalInvoiced)}
					icon={Receipt}
				/>
				<Kpi
					label="Total Collected"
					value={formatMoney(kpis.totalCollected)}
					icon={CircleDollarSign}
					accent="success"
				/>
				<Kpi
					label="Outstanding"
					value={formatMoney(kpis.outstanding)}
					icon={Wallet}
					accent="warning"
				/>
				<Kpi
					label="Overdue Invoices"
					value={kpis.overdueCount}
					icon={AlertTriangle}
					accent={kpis.overdueCount > 0 ? "danger" : undefined}
				/>
				<Kpi
					label="Monthly Revenue"
					value={formatMoney(kpis.monthlyRevenue)}
					icon={TrendingUp}
				/>
				<Kpi
					label="Monthly Collection"
					value={formatMoney(kpis.monthlyCollection)}
					icon={CircleDollarSign}
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Revenue (last 6 months)</CardTitle>
					</CardHeader>
					<CardContent>
						{monthlyRevenue.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No invoiced revenue yet.
							</p>
						) : (
							<div className="flex items-end gap-3 pt-4">
								{[...monthlyRevenue].reverse().map((m) => (
									<div
										key={m.month}
										className="flex flex-1 flex-col items-center gap-2"
									>
										<div className="flex h-40 w-full items-end">
											<div
												className="bg-primary w-full rounded-t"
												style={{
													height: `${Math.max(4, (m.total / maxMonth) * 100)}%`,
												}}
												title={formatMoney(m.total)}
											/>
										</div>
										<span className="text-muted-foreground text-xs">
											{m.month}
										</span>
									</div>
								))}
							</div>
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
					<CardContent className="space-y-3">
						{recentPayments.length === 0 ? (
							<p className="text-muted-foreground text-sm">No payments yet.</p>
						) : (
							recentPayments.map((p) => (
								<div
									key={p.id}
									className="flex items-center justify-between gap-3 text-sm"
								>
									<div className="min-w-0">
										<Link
											to="/invoices/$invoiceId"
											params={{ invoiceId: p.invoiceId }}
											className="font-medium hover:underline"
										>
											{p.invoiceNumber}
										</Link>
										<span className="text-muted-foreground">
											{" "}
											· {p.customerName}
										</span>
									</div>
									<div className="flex items-center gap-3">
										<span className="tabular-nums font-medium">
											{formatMoney(p.amount)}
										</span>
										<span className="text-muted-foreground text-xs">
											{fmtDate(p.paymentDate)}
										</span>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Recent Orders</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{recentOrders.length === 0 ? (
							<p className="text-muted-foreground text-sm">No orders yet.</p>
						) : (
							recentOrders.map((o) => (
								<div
									key={o.id}
									className="flex items-center justify-between gap-3 text-sm"
								>
									<div className="min-w-0">
										<Link
											to="/orders/$orderId"
											params={{ orderId: o.id }}
											className="font-medium hover:underline"
										>
											{o.number}
										</Link>
										<span className="text-muted-foreground">
											{" "}
											· {o.customerName}
										</span>
									</div>
									<div className="flex items-center gap-3">
										<StatusBadge status={o.status} />
										<span className="tabular-nums">
											{formatMoney(o.value, o.currency)}
										</span>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function Kpi({
	label,
	value,
	icon: Icon,
	accent,
}: {
	label: string;
	value: string | number;
	icon: React.ComponentType<{ className?: string }>;
	accent?: "success" | "warning" | "danger";
}) {
	const accentClass =
		accent === "success"
			? "text-emerald-600"
			: accent === "warning"
				? "text-amber-600"
				: accent === "danger"
					? "text-destructive"
					: "text-primary";
	return (
		<Card>
			<CardContent className="flex items-center justify-between gap-3 py-5">
				<div className="min-w-0">
					<p className="text-muted-foreground text-sm">{label}</p>
					<p className={`mt-1 text-2xl font-bold tabular-nums ${accentClass}`}>
						{value}
					</p>
				</div>
				<Icon className={`size-8 shrink-0 opacity-30 ${accentClass}`} />
			</CardContent>
		</Card>
	);
}
