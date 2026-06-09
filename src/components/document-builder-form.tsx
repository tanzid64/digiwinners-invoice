import { useState } from "react";
import { z } from "zod";
import {
	DocumentLineItems,
	emptyMoneyState,
	type MoneyState,
	moneyStateToPayload,
	type ServiceOption,
} from "#/components/document-line-items.tsx";
import { Separator } from "#/components/ui/separator.tsx";
import { useAppForm } from "#/lib/form.tsx";

export interface BuilderSubmit {
	customerId: string;
	issueDate: number;
	secondaryDate: number | null;
	notes: string;
	terms: string;
	money: ReturnType<typeof moneyStateToPayload>;
}

function todayISO() {
	return new Date().toISOString().slice(0, 10);
}

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

export function DocumentBuilderForm({
	customers,
	services,
	secondaryDateLabel,
	submitLabel,
	onSubmit,
}: {
	customers: { id: string; name: string; companyName?: string | null }[];
	services: ServiceOption[];
	secondaryDateLabel: string;
	submitLabel: string;
	onSubmit: (data: BuilderSubmit) => Promise<void> | void;
}) {
	const [money, setMoney] = useState<MoneyState>(emptyMoneyState);
	const [itemsError, setItemsError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: {
			customerId: "",
			issueDate: todayISO(),
			secondaryDate: "",
			notes: "",
			terms: "",
		},
		onSubmit: async ({ value }) => {
			const payload = moneyStateToPayload(money);
			if (payload.items.length === 0) {
				setItemsError("Add at least one line item with a name.");
				return;
			}
			setItemsError(null);
			await onSubmit({
				customerId: value.customerId,
				issueDate: new Date(value.issueDate).getTime(),
				secondaryDate: value.secondaryDate
					? new Date(value.secondaryDate).getTime()
					: null,
				notes: value.notes,
				terms: value.terms,
				money: payload,
			});
		},
	});

	return (
		<form
			className="space-y-8"
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			<Section title="Details" description="Customer and key dates.">
				<form.AppField
					name="customerId"
					validators={{ onSubmit: z.string().min(1, "Select a customer") }}
				>
					{(f) => (
						<f.SelectField
							label="Customer"
							placeholder="Select customer"
							options={customers.map((c) => ({
								value: c.id,
								label: c.companyName ? `${c.name} · ${c.companyName}` : c.name,
							}))}
						/>
					)}
				</form.AppField>
				<div className="grid gap-4 sm:grid-cols-2">
					<form.AppField name="issueDate">
						{(f) => <f.TextField label="Issue date" type="date" />}
					</form.AppField>
					<form.AppField name="secondaryDate">
						{(f) => <f.TextField label={secondaryDateLabel} type="date" />}
					</form.AppField>
				</div>
			</Section>

			<Separator />

			<Section
				title="Line items"
				description="Catalog services or custom items, with discount and tax."
			>
				<DocumentLineItems
					value={money}
					onChange={(m) => {
						setMoney(m);
						if (itemsError) setItemsError(null);
					}}
					services={services}
				/>
				{itemsError ? (
					<p className="text-destructive text-sm">{itemsError}</p>
				) : null}
			</Section>

			<Separator />

			<Section title="Notes & terms" description="Shown on the generated PDF.">
				<form.AppField name="notes">
					{(f) => <f.TextareaField label="Notes" rows={3} />}
				</form.AppField>
				<form.AppField name="terms">
					{(f) => <f.TextareaField label="Terms" rows={3} />}
				</form.AppField>
			</Section>

			<div className="flex justify-end border-t pt-5">
				<form.AppForm>
					<form.SubmitButton label={submitLabel} />
				</form.AppForm>
			</div>
		</form>
	);
}
