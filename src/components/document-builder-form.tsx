import { useState } from "react";
import {
	DocumentLineItems,
	emptyMoneyState,
	type MoneyState,
	moneyStateToPayload,
	type ServiceOption,
} from "#/components/document-line-items.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";

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

export function DocumentBuilderForm({
	customers,
	services,
	secondaryDateLabel,
	submitLabel,
	submitting,
	onSubmit,
}: {
	customers: { id: string; name: string; companyName?: string | null }[];
	services: ServiceOption[];
	secondaryDateLabel: string;
	submitLabel: string;
	submitting?: boolean;
	onSubmit: (data: BuilderSubmit) => void;
}) {
	const [customerId, setCustomerId] = useState("");
	const [issueDate, setIssueDate] = useState(todayISO());
	const [secondaryDate, setSecondaryDate] = useState("");
	const [notes, setNotes] = useState("");
	const [terms, setTerms] = useState("");
	const [money, setMoney] = useState<MoneyState>(emptyMoneyState);
	const [error, setError] = useState<string | null>(null);

	function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!customerId) return setError("Select a customer.");
		const payload = moneyStateToPayload(money);
		if (payload.items.length === 0)
			return setError("Add at least one line item with a name.");
		onSubmit({
			customerId,
			issueDate: new Date(issueDate).getTime(),
			secondaryDate: secondaryDate ? new Date(secondaryDate).getTime() : null,
			notes,
			terms,
			money: payload,
		});
	}

	return (
		<form className="space-y-6" onSubmit={submit}>
			<div className="grid gap-5 sm:grid-cols-3">
				<div className="space-y-2 sm:col-span-1">
					<Label>Customer *</Label>
					<Select value={customerId} onValueChange={setCustomerId}>
						<SelectTrigger>
							<SelectValue placeholder="Select customer" />
						</SelectTrigger>
						<SelectContent>
							{customers.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
									{c.companyName ? ` · ${c.companyName}` : ""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>Issue date</Label>
					<Input
						type="date"
						value={issueDate}
						onChange={(e) => setIssueDate(e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label>{secondaryDateLabel}</Label>
					<Input
						type="date"
						value={secondaryDate}
						onChange={(e) => setSecondaryDate(e.target.value)}
					/>
				</div>
			</div>

			<DocumentLineItems
				value={money}
				onChange={setMoney}
				services={services}
			/>

			<div className="grid gap-5 sm:grid-cols-2">
				<div className="space-y-2">
					<Label>Notes</Label>
					<Textarea
						rows={3}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label>Terms</Label>
					<Textarea
						rows={3}
						value={terms}
						onChange={(e) => setTerms(e.target.value)}
					/>
				</div>
			</div>

			{error && <p className="text-destructive text-sm">{error}</p>}

			<Button type="submit" disabled={submitting}>
				{submitting ? "Saving…" : submitLabel}
			</Button>
		</form>
	);
}
