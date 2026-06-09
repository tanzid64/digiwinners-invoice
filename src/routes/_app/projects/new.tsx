import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "#/components/page-header.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { useAppForm } from "#/lib/form.tsx";
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

	const form = useAppForm({
		defaultValues: { orderId: "", name: "", start: "", end: "" },
		onSubmit: async ({ value }) => {
			try {
				const created = await createProject({
					data: {
						orderId: value.orderId,
						name: value.name,
						startDate: value.start ? new Date(value.start).getTime() : null,
						endDate: value.end ? new Date(value.end).getTime() : null,
					},
				});
				toast.success("Project created");
				await router.navigate({
					to: "/projects/$projectId",
					params: { projectId: created.id },
				});
			} catch {
				toast.error("Could not create project");
			}
		},
	});

	const noOrders = orders.length === 0;

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<PageHeader title="New project" backTo="/projects" />
			<Card>
				<CardContent>
					{noOrders ? (
						<p className="text-muted-foreground text-sm">
							No orders available — every order already has a project, or none
							exist yet.
						</p>
					) : (
						<form
							className="space-y-5"
							onSubmit={(e) => {
								e.preventDefault();
								form.handleSubmit();
							}}
						>
							<form.AppField
								name="orderId"
								validators={{ onSubmit: z.string().min(1, "Select an order") }}
							>
								{(f) => (
									<f.SelectField
										label="Order"
										placeholder="Select order"
										options={orders.map((o) => ({
											value: o.id,
											label: o.number,
										}))}
									/>
								)}
							</form.AppField>

							<form.AppField
								name="name"
								validators={{
									onBlur: z.string().min(1, "Project name required"),
								}}
							>
								{(f) => <f.TextField label="Project name" />}
							</form.AppField>

							<div className="grid gap-5 sm:grid-cols-2">
								<form.AppField name="start">
									{(f) => <f.TextField label="Start date" type="date" />}
								</form.AppField>
								<form.AppField name="end">
									{(f) => <f.TextField label="End date" type="date" />}
								</form.AppField>
							</div>

							<form.AppForm>
								<form.SubmitButton label="Create project" />
							</form.AppForm>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
