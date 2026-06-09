import { useState } from "react";
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

export function CustomerForm({
	initial,
	submitting,
	submitLabel = "Save",
	onSubmit,
}: {
	initial?: Partial<CustomerFormValues>;
	submitting?: boolean;
	submitLabel?: string;
	onSubmit: (values: CustomerFormValues) => void;
}) {
	const [v, setV] = useState<CustomerFormValues>({
		...emptyCustomer,
		...initial,
	});
	const set = <K extends keyof CustomerFormValues>(
		k: K,
		val: CustomerFormValues[K],
	) => setV((prev) => ({ ...prev, [k]: val }));

	return (
		<form
			className="space-y-5"
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit(v);
			}}
		>
			<div className="grid gap-5 sm:grid-cols-2">
				<div className="space-y-2">
					<Label>Type</Label>
					<Select
						value={v.type}
						onValueChange={(val) =>
							set("type", val as CustomerFormValues["type"])
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="individual">Individual</SelectItem>
							<SelectItem value="company">Company</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>Status</Label>
					<Select
						value={v.status}
						onValueChange={(val) =>
							set("status", val as CustomerFormValues["status"])
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="inactive">Inactive</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label htmlFor="name">
						{v.type === "company" ? "Contact name" : "Name"} *
					</Label>
					<Input
						id="name"
						required
						value={v.name}
						onChange={(e) => set("name", e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="companyName">Company name</Label>
					<Input
						id="companyName"
						value={v.companyName}
						onChange={(e) => set("companyName", e.target.value)}
						disabled={v.type !== "company"}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						type="email"
						value={v.email}
						onChange={(e) => set("email", e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="phone">Phone</Label>
					<Input
						id="phone"
						value={v.phone}
						onChange={(e) => set("phone", e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="taxId">Tax ID</Label>
					<Input
						id="taxId"
						value={v.taxId}
						onChange={(e) => set("taxId", e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="website">Website</Label>
					<Input
						id="website"
						value={v.website}
						onChange={(e) => set("website", e.target.value)}
					/>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="address">Address</Label>
				<Textarea
					id="address"
					rows={2}
					value={v.address}
					onChange={(e) => set("address", e.target.value)}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="notes">Internal notes</Label>
				<Textarea
					id="notes"
					rows={3}
					value={v.notes}
					onChange={(e) => set("notes", e.target.value)}
				/>
			</div>
			<Button type="submit" disabled={submitting}>
				{submitting ? "Saving…" : submitLabel}
			</Button>
		</form>
	);
}
