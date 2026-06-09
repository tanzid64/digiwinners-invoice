import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
	type BuilderSubmit,
	DocumentBuilderForm,
} from "#/components/document-builder-form.tsx";
import { PageHeader } from "#/components/page-header.tsx";
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

	async function handle(d: BuilderSubmit) {
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
			toast.success(`Quotation ${created.number} created`);
			await router.navigate({
				to: "/quotations/$quotationId",
				params: { quotationId: created.id },
			});
		} catch {
			toast.error("Could not create quotation");
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader title="New quotation" backTo="/quotations" />
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
						onSubmit={handle}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
