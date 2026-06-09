import { z } from "zod";
import type { DiscountType } from "#/db/app-schema.ts";
import { computeTotals } from "#/lib/money.ts";

export const lineItemSchema = z.object({
	serviceId: z.string().optional().nullable(),
	name: z.string().min(1),
	description: z.string().optional().nullable(),
	quantity: z.number().int().min(1).default(1),
	unitPrice: z.number().int().min(0).default(0), // cents
});

export type LineItemInput = z.infer<typeof lineItemSchema>;

export const documentMoneySchema = {
	currency: z.string().default("USD"),
	discountType: z.enum(["none", "percent", "fixed"]).default("none"),
	discountValue: z.number().int().min(0).default(0), // bps or cents
	taxRate: z.number().int().min(0).default(0), // bps
	notes: z.string().optional().nullable(),
	terms: z.string().optional().nullable(),
	items: z.array(lineItemSchema).min(1),
};

/** Compute document totals + per-line totals from raw item inputs. */
export function rollup(input: {
	items: LineItemInput[];
	discountType: DiscountType;
	discountValue: number;
	taxRate: number;
}) {
	const totals = computeTotals({
		items: input.items.map((i) => ({
			quantity: i.quantity,
			unitPrice: i.unitPrice,
		})),
		discountType: input.discountType,
		discountValue: input.discountValue,
		taxRate: input.taxRate,
	});
	const items = input.items.map((i, idx) => ({
		serviceId: i.serviceId ?? null,
		name: i.name,
		description: i.description ?? null,
		quantity: i.quantity,
		unitPrice: i.unitPrice,
		lineTotal: i.quantity * i.unitPrice,
		sortOrder: idx,
	}));
	return { totals, items };
}
