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
import { listProjects } from "#/lib/server/projects.ts";

export const Route = createFileRoute("/_app/projects/")({
	loader: () => listProjects(),
	component: ProjectsList,
});

function ProjectsList() {
	const rows = Route.useLoaderData();
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Projects</h1>
					<p className="text-muted-foreground">{rows.length} total</p>
				</div>
				<Button asChild>
					<Link to="/projects/new">
						<Plus className="size-4" /> New project
					</Link>
				</Button>
			</div>
			<Card className="py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Project</TableHead>
							<TableHead>Order</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-40">Progress</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-muted-foreground py-10 text-center"
								>
									No projects yet.
								</TableCell>
							</TableRow>
						) : (
							rows.map((p) => (
								<TableRow key={p.id}>
									<TableCell className="font-medium">
										<Link
											to="/projects/$projectId"
											params={{ projectId: p.id }}
											className="hover:underline"
										>
											{p.name}
										</Link>
									</TableCell>
									<TableCell>{p.orderNumber ?? "—"}</TableCell>
									<TableCell>{p.customerName ?? "—"}</TableCell>
									<TableCell>
										<StatusBadge status={p.status} />
									</TableCell>
									<TableCell>
										<ProgressBar value={p.progress} />
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

export function ProgressBar({ value }: { value: number }) {
	return (
		<div className="flex items-center gap-2">
			<div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
				<div
					className="bg-primary h-full rounded-full transition-all"
					style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
				/>
			</div>
			<span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
				{value}%
			</span>
		</div>
	);
}
