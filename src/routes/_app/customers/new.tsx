import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
	CustomerForm,
	type CustomerFormValues,
} from "#/components/customer-form.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { createCustomer } from "#/lib/server/customers.ts";

export const Route = createFileRoute("/_app/customers/new")({
	component: NewCustomer,
});

function NewCustomer() {
	const router = useRouter();

	async function handle(values: CustomerFormValues) {
		try {
			const created = await createCustomer({ data: values });
			toast.success(`Customer “${created.name}” created`);
			await router.navigate({
				to: "/customers/$customerId",
				params: { customerId: created.id },
			});
		} catch {
			toast.error("Could not create customer");
		}
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<PageHeader title="New customer" backTo="/customers" />
			<Card>
				<CardContent>
					<CustomerForm submitLabel="Create customer" onSubmit={handle} />
				</CardContent>
			</Card>
		</div>
	);
}
