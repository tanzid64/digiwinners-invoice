import { Plus, Trash2 } from "lucide-react";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table.tsx";
import { computeTotals, formatMoney, fromCents, toCents } from "#/lib/money.ts";

export interface ItemRow {
	serviceId: string;
	name: string;
	description: string;
	quantity: number;
	unitPrice: string; // dollars, as typed
}

export interface MoneyState {
	items: ItemRow[];
	discountType: "none" | "percent" | "fixed";
	discountValue: string; // percent number or dollars
	taxRate: string; // percent number
}

export const emptyMoneyState: MoneyState = {
	items: [
		{ serviceId: "", name: "", description: "", quantity: 1, unitPrice: "" },
	],
	discountType: "none",
	discountValue: "",
	taxRate: "",
};

export interface ServiceOption {
	id: string;
	name: string;
	unitPrice: number; // cents
}

/** Convert the UI money state into the server payload (cents / basis points). */
export function moneyStateToPayload(s: MoneyState) {
	const discountValue =
		s.discountType === "percent"
			? Math.round(Number.parseFloat(s.discountValue || "0") * 100) // bps
			: s.discountType === "fixed"
				? toCents(s.discountValue || "0")
				: 0;
	return {
		discountType: s.discountType,
		discountValue,
		taxRate: Math.round(Number.parseFloat(s.taxRate || "0") * 100), // bps
		items: s.items
			.filter((i) => i.name.trim())
			.map((i) => ({
				serviceId: i.serviceId || null,
				name: i.name,
				description: i.description || null,
				quantity: Math.max(1, Math.floor(i.quantity) || 1),
				unitPrice: toCents(i.unitPrice || "0"),
			})),
	};
}

function liveTotals(s: MoneyState) {
	return computeTotals({
		items: s.items.map((i) => ({
			quantity: Math.max(1, Math.floor(i.quantity) || 1),
			unitPrice: toCents(i.unitPrice || "0"),
		})),
		discountType: s.discountType,
		discountValue:
			s.discountType === "percent"
				? Math.round(Number.parseFloat(s.discountValue || "0") * 100)
				: s.discountType === "fixed"
					? toCents(s.discountValue || "0")
					: 0,
		taxRate: Math.round(Number.parseFloat(s.taxRate || "0") * 100),
	});
}

export function DocumentLineItems({
	value,
	onChange,
	services,
	currency = "USD",
}: {
	value: MoneyState;
	onChange: (s: MoneyState) => void;
	services: ServiceOption[];
	currency?: string;
}) {
	const totals = liveTotals(value);

	const setItem = (idx: number, patch: Partial<ItemRow>) =>
		onChange({
			...value,
			items: value.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
		});

	const addRow = () =>
		onChange({
			...value,
			items: [
				...value.items,
				{
					serviceId: "",
					name: "",
					description: "",
					quantity: 1,
					unitPrice: "",
				},
			],
		});

	const removeRow = (idx: number) =>
		onChange({ ...value, items: value.items.filter((_, i) => i !== idx) });

	const pickService = (idx: number, serviceId: string) => {
		const svc = services.find((s) => s.id === serviceId);
		setItem(idx, {
			serviceId,
			name: svc?.name ?? value.items[idx].name,
			unitPrice: svc
				? String(fromCents(svc.unitPrice))
				: value.items[idx].unitPrice,
		});
	};

	return (
		<div className="space-y-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="min-w-48">Item</TableHead>
						<TableHead className="w-20">Qty</TableHead>
						<TableHead className="w-32">Unit price</TableHead>
						<TableHead className="w-28 text-right">Total</TableHead>
						<TableHead className="w-10" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{value.items.map((item, idx) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
						<TableRow key={idx} className="align-top">
							<TableCell className="space-y-2">
								{services.length > 0 && (
									<Select
										value={item.serviceId || "custom"}
										onValueChange={(v) =>
											pickService(idx, v === "custom" ? "" : v)
										}
									>
										<SelectTrigger className="h-8">
											<SelectValue placeholder="Custom item" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="custom">Custom item</SelectItem>
											{services.map((s) => (
												<SelectItem key={s.id} value={s.id}>
													{s.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
								<Input
									placeholder="Description / name"
									value={item.name}
									onChange={(e) => setItem(idx, { name: e.target.value })}
								/>
								<Input
									placeholder="Details (optional)"
									value={item.description}
									onChange={(e) =>
										setItem(idx, { description: e.target.value })
									}
								/>
							</TableCell>
							<TableCell>
								<Input
									type="number"
									min="1"
									value={item.quantity}
									onChange={(e) =>
										setItem(idx, { quantity: Number(e.target.value) })
									}
								/>
							</TableCell>
							<TableCell>
								<Input
									type="number"
									min="0"
									step="0.01"
									value={item.unitPrice}
									onChange={(e) => setItem(idx, { unitPrice: e.target.value })}
								/>
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{formatMoney(
									Math.max(1, Math.floor(item.quantity) || 1) *
										toCents(item.unitPrice || "0"),
									currency,
								)}
							</TableCell>
							<TableCell>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={() => removeRow(idx)}
									disabled={value.items.length === 1}
								>
									<Trash2 className="size-4" />
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<Button type="button" variant="outline" size="sm" onClick={addRow}>
				<Plus className="size-4" /> Add line
			</Button>

			<div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
				<div className="grid max-w-sm flex-1 gap-3 sm:grid-cols-2">
					<div className="space-y-1">
						<Label>Discount</Label>
						<Select
							value={value.discountType}
							onValueChange={(v) =>
								onChange({
									...value,
									discountType: v as MoneyState["discountType"],
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">No discount</SelectItem>
								<SelectItem value="percent">Percent (%)</SelectItem>
								<SelectItem value="fixed">Fixed ({currency})</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<Label>Discount value</Label>
						<Input
							type="number"
							min="0"
							step="0.01"
							disabled={value.discountType === "none"}
							value={value.discountValue}
							onChange={(e) =>
								onChange({ ...value, discountValue: e.target.value })
							}
						/>
					</div>
					<div className="space-y-1">
						<Label>Tax rate (%)</Label>
						<Input
							type="number"
							min="0"
							step="0.01"
							value={value.taxRate}
							onChange={(e) => onChange({ ...value, taxRate: e.target.value })}
						/>
					</div>
				</div>

				<div className="w-full max-w-xs space-y-1.5 text-sm">
					<Row
						label="Subtotal"
						value={formatMoney(totals.subtotal, currency)}
					/>
					<Row
						label="Discount"
						value={`− ${formatMoney(totals.discountAmount, currency)}`}
					/>
					<Row label="Tax" value={formatMoney(totals.taxAmount, currency)} />
					<div className="border-t pt-1.5">
						<Row
							label="Total"
							value={formatMoney(totals.total, currency)}
							bold
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

function Row({
	label,
	value,
	bold,
}: {
	label: string;
	value: string;
	bold?: boolean;
}) {
	return (
		<div
			className={`flex justify-between tabular-nums ${bold ? "text-base font-semibold" : "text-muted-foreground"}`}
		>
			<span>{label}</span>
			<span>{value}</span>
		</div>
	);
}
