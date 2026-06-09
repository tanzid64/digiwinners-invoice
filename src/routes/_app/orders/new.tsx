import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
	DocumentLineItems,
	emptyMoneyState,
	type MoneyState,
	moneyStateToPayload,
} from "#/components/document-line-items.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { Separator } from "#/components/ui/separator.tsx";
import { useAppForm } from "#/lib/form.tsx";
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

function Section({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="grid gap-x-8 gap-y-4 md:grid-cols-[220px_1fr]">
			<div>
				<h3 className="text-sm font-semibold">{title}</h3>
				{description ? (
					<p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
				) : null}
			</div>
			<div className="space-y-4">{children}</div>
		</div>
	);
}

function NewOrder() {
	const { customers, services } = Route.useLoaderData();
	const router = useRouter();
	const [money, setMoney] = useState<MoneyState>(emptyMoneyState);
	const [itemsError, setItemsError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: {
			customerId: "",
			priority: "medium",
			expectedDelivery: "",
			notes: "",
		},
		onSubmit: async ({ value }) => {
			const payload = moneyStateToPayload(money);
			if (payload.items.length === 0) {
				setItemsError("Add at least one line item with a name.");
				return;
			}
			setItemsError(null);
			try {
				const created = await createOrder({
					data: {
						customerId: value.customerId,
						priority: value.priority as "low" | "medium" | "high" | "urgent",
						currency: "USD",
						expectedDelivery: value.expectedDelivery
							? new Date(value.expectedDelivery).getTime()
							: null,
						notes: value.notes,
						items: payload.items,
					},
				});
				toast.success(`Order ${created.number} created`);
				await router.navigate({
					to: "/orders/$orderId",
					params: { orderId: created.id },
				});
			} catch {
				toast.error("Could not create order");
			}
		},
	});

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<PageHeader title="New order" backTo="/orders" />
			<Card>
				<CardContent className="py-2">
					<form
						className="space-y-8"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<Section
							title="Order details"
							description="Who the order is for and how it's prioritised."
						>
							<form.AppField
								name="customerId"
								validators={{
									onSubmit: z.string().min(1, "Select a customer"),
								}}
							>
								{(f) => (
									<f.SelectField
										label="Customer"
										placeholder="Select customer"
										options={customers.map((c) => ({
											value: c.id,
											label: c.companyName
												? `${c.name} · ${c.companyName}`
												: c.name,
										}))}
									/>
								)}
							</form.AppField>
							<div className="grid gap-4 sm:grid-cols-2">
								<form.AppField name="priority">
									{(f) => (
										<f.SelectField
											label="Priority"
											options={[
												{ value: "low", label: "Low" },
												{ value: "medium", label: "Medium" },
												{ value: "high", label: "High" },
												{ value: "urgent", label: "Urgent" },
											]}
										/>
									)}
								</form.AppField>
								<form.AppField name="expectedDelivery">
									{(f) => <f.TextField label="Expected delivery" type="date" />}
								</form.AppField>
							</div>
						</Section>

						<Separator />

						<Section
							title="Line items"
							description="Pick catalog services or add custom items."
						>
							<DocumentLineItems
								value={money}
								onChange={(m) => {
									setMoney(m);
									if (itemsError) setItemsError(null);
								}}
								services={services.map((s) => ({
									id: s.id,
									name: s.name,
									unitPrice: s.unitPrice,
								}))}
							/>
							{itemsError ? (
								<p className="text-destructive text-sm">{itemsError}</p>
							) : null}
						</Section>

						<Separator />

						<Section
							title="Notes"
							description="Internal only — not shown to the customer."
						>
							<form.AppField name="notes">
								{(f) => <f.TextareaField label="" rows={3} />}
							</form.AppField>
						</Section>

						<div className="flex justify-end border-t pt-5">
							<form.AppForm>
								<form.SubmitButton label="Create order" />
							</form.AppForm>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
