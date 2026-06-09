import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
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
	createProject,
	listOrdersWithoutProject,
} from "#/lib/server/projects.ts";

export const Route = createFileRoute("/_app/projects/new")({
	loader: () => listOrdersWithoutProject(),
	component: NewProject,
});

function NewProject() {
	const orders = Route.useLoaderData();
	const router = useRouter();
	const [orderId, setOrderId] = useState("");
	const [name, setName] = useState("");
	const [start, setStart] = useState("");
	const [end, setEnd] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!orderId) return setError("Select an order.");
		if (!name.trim()) return setError("Project name required.");
		setBusy(true);
		try {
			const created = await createProject({
				data: {
					orderId,
					name,
					startDate: start ? new Date(start).getTime() : null,
					endDate: end ? new Date(end).getTime() : null,
				},
			});
			await router.navigate({
				to: "/projects/$projectId",
				params: { projectId: created.id },
			});
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div className="flex items-center gap-3">
				<Button asChild variant="ghost" size="icon">
					<Link to="/projects">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<h1 className="text-2xl font-bold tracking-tight">New project</h1>
			</div>
			<Card>
				<CardContent>
					<form className="space-y-5" onSubmit={submit}>
						<div className="space-y-2">
							<Label>Order *</Label>
							{orders.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No orders available — every order already has a project, or
									none exist yet.
								</p>
							) : (
								<Select value={orderId} onValueChange={setOrderId}>
									<SelectTrigger>
										<SelectValue placeholder="Select order" />
									</SelectTrigger>
									<SelectContent>
										{orders.map((o) => (
											<SelectItem key={o.id} value={o.id}>
												{o.number}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
						<div className="space-y-2">
							<Label>Project name *</Label>
							<Input value={name} onChange={(e) => setName(e.target.value)} />
						</div>
						<div className="grid gap-5 sm:grid-cols-2">
							<div className="space-y-2">
								<Label>Start date</Label>
								<Input
									type="date"
									value={start}
									onChange={(e) => setStart(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label>End date</Label>
								<Input
									type="date"
									value={end}
									onChange={(e) => setEnd(e.target.value)}
								/>
							</div>
						</div>
						{error && <p className="text-destructive text-sm">{error}</p>}
						<Button type="submit" disabled={busy || orders.length === 0}>
							{busy ? "Saving…" : "Create project"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
