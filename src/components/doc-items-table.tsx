import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table.tsx";
import { formatMoney } from "#/lib/money.ts";

interface Item {
	id: string;
	name: string;
	description: string | null;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
}

export function DocItemsTable({
	items,
	currency,
	subtotal,
	discountAmount,
	taxAmount,
	total,
	amountPaid,
	dueAmount,
}: {
	items: Item[];
	currency: string;
	subtotal: number;
	discountAmount: number;
	taxAmount: number;
	total: number;
	amountPaid?: number;
	dueAmount?: number;
}) {
	const m = (c: number) => formatMoney(c, currency);
	return (
		<div className="space-y-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Item</TableHead>
						<TableHead className="text-right">Qty</TableHead>
						<TableHead className="text-right">Unit</TableHead>
						<TableHead className="text-right">Total</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((it) => (
						<TableRow key={it.id}>
							<TableCell>
								<div className="font-medium">{it.name}</div>
								{it.description ? (
									<div className="text-muted-foreground text-sm">
										{it.description}
									</div>
								) : null}
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{it.quantity}
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{m(it.unitPrice)}
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{m(it.lineTotal)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
				<Row label="Subtotal" value={m(subtotal)} muted />
				{discountAmount > 0 ? (
					<Row label="Discount" value={`− ${m(discountAmount)}`} muted />
				) : null}
				<Row label="Tax" value={m(taxAmount)} muted />
				<div className="border-t pt-1.5">
					<Row label="Total" value={m(total)} bold />
				</div>
				{amountPaid !== undefined ? (
					<>
						<Row label="Paid" value={m(amountPaid)} muted />
						<Row label="Balance due" value={m(dueAmount ?? 0)} bold />
					</>
				) : null}
			</div>
		</div>
	);
}

function Row({
	label,
	value,
	muted,
	bold,
}: {
	label: string;
	value: string;
	muted?: boolean;
	bold?: boolean;
}) {
	return (
		<div
			className={`flex justify-between tabular-nums ${
				bold ? "text-base font-semibold" : ""
			} ${muted ? "text-muted-foreground" : ""}`}
		>
			<span>{label}</span>
			<span>{value}</span>
		</div>
	);
}
