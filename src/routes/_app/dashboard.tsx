import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";

export const Route = createFileRoute("/_app/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground">
					Business overview and actionable insights.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[
					"Total Customers",
					"Total Orders",
					"Active Projects",
					"Outstanding",
				].map((label) => (
					<Card key={label}>
						<CardHeader>
							<CardDescription>{label}</CardDescription>
							<CardTitle className="text-2xl">—</CardTitle>
						</CardHeader>
					</Card>
				))}
			</div>
			<p className="text-muted-foreground text-sm">
				Full KPIs, charts, and recent activity land in Phase 4.
			</p>
		</div>
	);
}
