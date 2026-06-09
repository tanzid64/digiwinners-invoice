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
import { createQuotation } from "#/lib/server/quotations.ts";
import { listServices } from "#/lib/server/services.ts";

export const Route = createFileRoute("/_app/quotations/new")({
	loader: async () => ({
		customers: await listCustomers({ data: { status: "active" } }),
		services: await listServices(),
	}),
	component: NewQuotation,
});

function NewQuotation() {
	const { customers, services } = Route.useLoaderData();
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);

	async function handle(d: BuilderSubmit) {
		setSubmitting(true);
		try {
			const created = await createQuotation({
				data: {
					customerId: d.customerId,
					issueDate: d.issueDate,
					validUntil: d.secondaryDate,
					currency: "USD",
					notes: d.notes,
					terms: d.terms,
					...d.money,
				},
			});
			await router.navigate({
				to: "/quotations/$quotationId",
				params: { quotationId: created.id },
			});
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button asChild variant="ghost" size="icon">
					<Link to="/quotations">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<h1 className="text-2xl font-bold tracking-tight">New quotation</h1>
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
						secondaryDateLabel="Valid until"
						submitLabel="Create quotation"
						submitting={submitting}
						onSubmit={handle}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
