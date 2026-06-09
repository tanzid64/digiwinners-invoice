import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
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
import { listOrders } from "#/lib/server/orders.ts";

export const Route = createFileRoute("/_app/orders/")({
	loader: () => listOrders(),
	component: OrdersList,
});

function OrdersList() {
	const rows = Route.useLoaderData();
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Orders</h1>
					<p className="text-muted-foreground">{rows.length} total</p>
				</div>
				<Button asChild>
					<Link to="/orders/new">
						<Plus className="size-4" /> New order
					</Link>
				</Button>
			</div>
			<Card className="py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Number</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Priority</TableHead>
							<TableHead>Delivery</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Value</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-muted-foreground py-10 text-center"
								>
									No orders yet.
								</TableCell>
							</TableRow>
						) : (
							rows.map((o) => (
								<TableRow key={o.id}>
									<TableCell className="font-medium">
										<Link
											to="/orders/$orderId"
											params={{ orderId: o.id }}
											className="hover:underline"
										>
											{o.number}
										</Link>
									</TableCell>
									<TableCell>{o.customerName ?? "—"}</TableCell>
									<TableCell>
										<StatusBadge status={o.priority} />
									</TableCell>
									<TableCell>{fmtDate(o.expectedDelivery)}</TableCell>
									<TableCell>
										<StatusBadge status={o.status} />
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatMoney(o.value, o.currency)}
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
