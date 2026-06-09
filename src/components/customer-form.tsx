import { z } from "zod";
import { useAppForm } from "#/lib/form.tsx";

export interface CustomerFormValues {
	type: "individual" | "company";
	name: string;
	companyName: string;
	email: string;
	phone: string;
	address: string;
	taxId: string;
	website: string;
	status: "active" | "inactive";
	notes: string;
}

export const emptyCustomer: CustomerFormValues = {
	type: "individual",
	name: "",
	companyName: "",
	email: "",
	phone: "",
	address: "",
	taxId: "",
	website: "",
	status: "active",
	notes: "",
};

const emailField = z.union([
	z.string().email("Enter a valid email"),
	z.literal(""),
]);

export function CustomerForm({
	initial,
	submitLabel = "Save",
	onSubmit,
}: {
	initial?: Partial<CustomerFormValues>;
	submitLabel?: string;
	onSubmit: (values: CustomerFormValues) => Promise<void> | void;
}) {
	const form = useAppForm({
		defaultValues: { ...emptyCustomer, ...initial } as CustomerFormValues,
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	return (
		<form
			className="space-y-5"
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			<div className="grid gap-5 sm:grid-cols-2">
				<form.AppField name="type">
					{(f) => (
						<f.SelectField
							label="Type"
							options={[
								{ value: "individual", label: "Individual" },
								{ value: "company", label: "Company" },
							]}
						/>
					)}
				</form.AppField>
				<form.AppField name="status">
					{(f) => (
						<f.SelectField
							label="Status"
							options={[
								{ value: "active", label: "Active" },
								{ value: "inactive", label: "Inactive" },
							]}
						/>
					)}
				</form.AppField>

				<form.AppField
					name="name"
					validators={{ onBlur: z.string().min(1, "Name required") }}
				>
					{(f) => <f.TextField label="Name" />}
				</form.AppField>

				<form.Subscribe selector={(s) => s.values.type}>
					{(type) => (
						<form.AppField name="companyName">
							{(f) => (
								<f.TextField
									label="Company name"
									disabled={type !== "company"}
								/>
							)}
						</form.AppField>
					)}
				</form.Subscribe>

				<form.AppField name="email" validators={{ onBlur: emailField }}>
					{(f) => <f.TextField label="Email" type="email" />}
				</form.AppField>
				<form.AppField name="phone">
					{(f) => <f.TextField label="Phone" />}
				</form.AppField>
				<form.AppField name="taxId">
					{(f) => <f.TextField label="Tax ID" />}
				</form.AppField>
				<form.AppField name="website">
					{(f) => <f.TextField label="Website" />}
				</form.AppField>
			</div>

			<form.AppField name="address">
				{(f) => <f.TextareaField label="Address" rows={2} />}
			</form.AppField>
			<form.AppField name="notes">
				{(f) => <f.TextareaField label="Internal notes" rows={3} />}
			</form.AppField>

			<form.AppForm>
				<form.SubmitButton label={submitLabel} />
			</form.AppForm>
		</form>
	);
}
