import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
	CustomerForm,
	type CustomerFormValues,
} from "#/components/customer-form.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { getCustomer, updateCustomer } from "#/lib/server/customers.ts";

export const Route = createFileRoute("/_app/customers/$customerId/edit")({
	loader: ({ params }) => getCustomer({ data: params.customerId }),
	component: EditCustomer,
});

function EditCustomer() {
	const data = Route.useLoaderData();
	const router = useRouter();
	const { customerId } = Route.useParams();
	const [submitting, setSubmitting] = useState(false);

	if (!data) return <p>Customer not found.</p>;
	const c = data.customer;

	async function handle(values: CustomerFormValues) {
		setSubmitting(true);
		try {
			await updateCustomer({ data: { ...values, id: customerId } });
			toast.success("Customer updated");
			await router.navigate({
				to: "/customers/$customerId",
				params: { customerId },
			});
		} catch {
			toast.error("Could not update customer");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<PageHeader
				title="Edit customer"
				backTo="/customers/$customerId"
				backParams={{ customerId }}
			/>
			<Card>
				<CardContent>
					<CustomerForm
						submitting={submitting}
						submitLabel="Save changes"
						onSubmit={handle}
						initial={{
							type: c.type,
							name: c.name,
							companyName: c.companyName ?? "",
							email: c.email ?? "",
							phone: c.phone ?? "",
							address: c.address ?? "",
							taxId: c.taxId ?? "",
							website: c.website ?? "",
							status: c.status,
							notes: c.notes ?? "",
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
