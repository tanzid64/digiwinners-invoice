import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
	DocumentLineItems,
	emptyMoneyState,
	type MoneyState,
	moneyStateToPayload,
} from "#/components/document-line-items.tsx";
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
import { Textarea } from "#/components/ui/textarea.tsx";
import { listCustomers } from "#/lib/server/customers.ts";
import { createOrder } from "#/lib/server/orders.ts";
import { listServices } from "#/lib/server/services.ts";

export const Route = createFileRoute("/_app/orders/new")({
	loader: async () => ({
		customers: await listCustomers({ data: { status: "active" } }),
		services: await listServices(),
	}),
	component: NewOrder,
});

function NewOrder() {
	const { customers, services } = Route.useLoaderData();
	const router = useRouter();
	const [customerId, setCustomerId] = useState("");
	const [priority, setPriority] = useState<
		"low" | "medium" | "high" | "urgent"
	>("medium");
	const [delivery, setDelivery] = useState("");
	const [notes, setNotes] = useState("");
	const [money, setMoney] = useState<MoneyState>(emptyMoneyState);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!customerId) return setError("Select a customer.");
		const payload = moneyStateToPayload(money);
		if (payload.items.length === 0) return setError("Add at least one item.");
		setSubmitting(true);
		try {
			const created = await createOrder({
				data: {
					customerId,
					priority,
					currency: "USD",
					expectedDelivery: delivery ? new Date(delivery).getTime() : null,
					notes,
					items: payload.items,
				},
			});
			await router.navigate({
				to: "/orders/$orderId",
				params: { orderId: created.id },
			});
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button asChild variant="ghost" size="icon">
					<Link to="/orders">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<h1 className="text-2xl font-bold tracking-tight">New order</h1>
			</div>
			<Card>
				<CardContent>
					<form className="space-y-6" onSubmit={submit}>
						<div className="grid gap-5 sm:grid-cols-3">
							<div className="space-y-2">
								<Label>Customer *</Label>
								<Select value={customerId} onValueChange={setCustomerId}>
									<SelectTrigger>
										<SelectValue placeholder="Select customer" />
									</SelectTrigger>
									<SelectContent>
										{customers.map((c) => (
											<SelectItem key={c.id} value={c.id}>
												{c.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Priority</Label>
								<Select
									value={priority}
									onValueChange={(v) => setPriority(v as typeof priority)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="low">Low</SelectItem>
										<SelectItem value="medium">Medium</SelectItem>
										<SelectItem value="high">High</SelectItem>
										<SelectItem value="urgent">Urgent</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Expected delivery</Label>
								<Input
									type="date"
									value={delivery}
									onChange={(e) => setDelivery(e.target.value)}
								/>
							</div>
						</div>

						<DocumentLineItems
							value={money}
							onChange={setMoney}
							services={services.map((s) => ({
								id: s.id,
								name: s.name,
								unitPrice: s.unitPrice,
							}))}
						/>

						<div className="space-y-2">
							<Label>Internal notes</Label>
							<Textarea
								rows={3}
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</div>

						{error && <p className="text-destructive text-sm">{error}</p>}
						<Button type="submit" disabled={submitting}>
							{submitting ? "Saving…" : "Create order"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
