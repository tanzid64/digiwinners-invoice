// All monetary values are stored as integer cents. These helpers keep the
// arithmetic in integer space and only format at the edges.

import type { DiscountType } from "#/db/app-schema.ts";

/** Parse a user-entered amount string ("1,250.50") into integer cents. */
export function toCents(input: string | number): number {
	if (typeof input === "number") return Math.round(input * 100);
	const cleaned = input.replace(/[^0-9.-]/g, "");
	if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
	return Math.round(Number.parseFloat(cleaned) * 100);
}

/** cents -> decimal number (1250 -> 12.5). */
export function fromCents(cents: number): number {
	return cents / 100;
}

/** Format cents for display with currency. */
export function formatMoney(cents: number, currency = "USD"): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(cents / 100);
}

/** Format basis points as a percent string (1500 -> "15%"). */
export function formatBps(bps: number): string {
	return `${bps / 100}%`;
}

/** percent in basis points -> cents (15% of $100 = 1500 bps of 10000c = 1500c). */
export function percentOf(cents: number, bps: number): number {
	return Math.round((cents * bps) / 10000);
}

export interface LineInput {
	quantity: number;
	unitPrice: number; // cents
}

export interface TotalsInput {
	items: LineInput[];
	discountType: DiscountType;
	discountValue: number; // bps for percent, cents for fixed
	taxRate: number; // bps
}

export interface Totals {
	subtotal: number;
	discountAmount: number;
	taxAmount: number;
	total: number;
}

/**
 * Compute document totals from line items. Discount applies to the subtotal;
 * tax applies to the post-discount amount. All values in cents.
 */
export function computeTotals(input: TotalsInput): Totals {
	const subtotal = input.items.reduce(
		(sum, it) => sum + it.quantity * it.unitPrice,
		0,
	);

	let discountAmount = 0;
	if (input.discountType === "percent") {
		discountAmount = percentOf(subtotal, input.discountValue);
	} else if (input.discountType === "fixed") {
		discountAmount = Math.min(input.discountValue, subtotal);
	}

	const taxable = subtotal - discountAmount;
	const taxAmount = percentOf(taxable, input.taxRate);
	const total = taxable + taxAmount;

	return { subtotal, discountAmount, taxAmount, total };
}

export function lineTotal(line: LineInput): number {
	return line.quantity * line.unitPrice;
}
