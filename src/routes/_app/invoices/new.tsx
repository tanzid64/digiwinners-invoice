import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
	type BuilderSubmit,
	DocumentBuilderForm,
} from "#/components/document-builder-form.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { listCustomers } from "#/lib/server/customers.ts";
import { createInvoice } from "#/lib/server/invoices.ts";
import { listServices } from "#/lib/server/services.ts";

export const Route = createFileRoute("/_app/invoices/new")({
	loader: async () => ({
		customers: await listCustomers({ data: { status: "active" } }),
		services: await listServices(),
	}),
	component: NewInvoice,
});

function NewInvoice() {
	const { customers, services } = Route.useLoaderData();
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);

	async function handle(d: BuilderSubmit) {
		setSubmitting(true);
		try {
			const due = d.secondaryDate ?? d.issueDate + 30 * 86400000; // default net-30
			const created = await createInvoice({
				data: {
					customerId: d.customerId,
					issueDate: d.issueDate,
					dueDate: due,
					currency: "USD",
					notes: d.notes,
					terms: d.terms,
					...d.money,
				},
			});
			await router.navigate({
				to: "/invoices/$invoiceId",
				params: { invoiceId: created.id },
			});
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button asChild variant="ghost" size="icon">
					<Link to="/invoices">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<h1 className="text-2xl font-bold tracking-tight">New invoice</h1>
			</div>
			<Card>
				<CardContent>
					<DocumentBuilderForm
						customers={customers}
						services={services.map((s) => ({
							id: s.id,
							name: s.name,
							unitPrice: s.unitPrice,
						}))}
						secondaryDateLabel="Due date"
						submitLabel="Create invoice"
						submitting={submitting}
						onSubmit={handle}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
