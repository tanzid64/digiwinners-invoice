import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
	CustomerForm,
	type CustomerFormValues,
} from "#/components/customer-form.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { createCustomer } from "#/lib/server/customers.ts";

export const Route = createFileRoute("/_app/customers/new")({
	component: NewCustomer,
});

function NewCustomer() {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);

	async function handle(values: CustomerFormValues) {
		setSubmitting(true);
		try {
			const created = await createCustomer({ data: values });
			await router.navigate({
				to: "/customers/$customerId",
				params: { customerId: created.id },
			});
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="flex items-center gap-3">
				<Button asChild variant="ghost" size="icon">
					<Link to="/customers">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<h1 className="text-2xl font-bold tracking-tight">New customer</h1>
			</div>
			<Card>
				<CardContent>
					<CustomerForm
						submitting={submitting}
						submitLabel="Create customer"
						onSubmit={handle}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
