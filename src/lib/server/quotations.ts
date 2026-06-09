import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	customers,
	orderItems,
	orders,
	quotationItems,
	quotations,
} from "#/db/app-schema.ts";
import { documentMoneySchema, rollup } from "./shared.ts";
import { db, logActivity, nextNumber } from "./util.ts";

export const listQuotations = createServerFn({ method: "GET" }).handler(
	async () => {
		const rows = await db
			.select({ q: quotations, customerName: customers.name })
			.from(quotations)
			.leftJoin(customers, eq(quotations.customerId, customers.id))
			.orderBy(desc(quotations.createdAt))
			.all();
		return rows.map((r) => ({ ...r.q, customerName: r.customerName }));
	},
);

export const getQuotation = createServerFn({ method: "GET" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		const quotation = await db
			.select()
			.from(quotations)
			.where(eq(quotations.id, id))
			.get();
		if (!quotation) return null;
		const [items, customer] = await Promise.all([
			db
				.select()
				.from(quotationItems)
				.where(eq(quotationItems.quotationId, id))
				.orderBy(quotationItems.sortOrder)
				.all(),
			db
				.select()
				.from(customers)
				.where(eq(customers.id, quotation.customerId))
				.get(),
		]);
		return { quotation, items, customer };
	});

const createInput = z.object({
	customerId: z.string(),
	issueDate: z.number(), // epoch ms
	validUntil: z.number().optional().nullable(),
	...documentMoneySchema,
});

export const createQuotation = createServerFn({ method: "POST" })
	.validator(createInput)
	.handler(async ({ data }) => {
		const { totals, items } = rollup(data);
		const number = await nextNumber("quotation", "QUO");
		const row = await db
			.insert(quotations)
			.values({
				number,
				customerId: data.customerId,
				status: "draft",
				currency: data.currency,
				issueDate: new Date(data.issueDate),
				validUntil: data.validUntil ? new Date(data.validUntil) : null,
				subtotal: totals.subtotal,
				discountType: data.discountType,
				discountValue: data.discountValue,
				discountAmount: totals.discountAmount,
				taxRate: data.taxRate,
				taxAmount: totals.taxAmount,
				total: totals.total,
				notes: data.notes ?? null,
				terms: data.terms ?? null,
			})
			.returning()
			.get();
		await db
			.insert(quotationItems)
			.values(items.map((i) => ({ ...i, quotationId: row.id })));
		await logActivity({
			type: "quotation_created",
			entityType: "quotation",
			entityId: row.id,
			customerId: data.customerId,
			title: `Quotation ${number} created`,
		});
		return row;
	});

export const updateQuotation = createServerFn({ method: "POST" })
	.validator(createInput.extend({ id: z.string() }))
	.handler(async ({ data }) => {
		const { totals, items } = rollup(data);
		await db
			.update(quotations)
			.set({
				customerId: data.customerId,
				currency: data.currency,
				issueDate: new Date(data.issueDate),
				validUntil: data.validUntil ? new Date(data.validUntil) : null,
				subtotal: totals.subtotal,
				discountType: data.discountType,
				discountValue: data.discountValue,
				discountAmount: totals.discountAmount,
				taxRate: data.taxRate,
				taxAmount: totals.taxAmount,
				total: totals.total,
				notes: data.notes ?? null,
				terms: data.terms ?? null,
			})
			.where(eq(quotations.id, data.id));
		await db
			.delete(quotationItems)
			.where(eq(quotationItems.quotationId, data.id));
		await db
			.insert(quotationItems)
			.values(items.map((i) => ({ ...i, quotationId: data.id })));
		return { ok: true };
	});

export const setQuotationStatus = createServerFn({ method: "POST" })
	.validator(
		z.object({
			id: z.string(),
			status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
		}),
	)
	.handler(async ({ data }) => {
		await db
			.update(quotations)
			.set({ status: data.status })
			.where(eq(quotations.id, data.id));
		return { ok: true };
	});

export const deleteQuotation = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(quotations).where(eq(quotations.id, id));
		return { ok: true };
	});

/** Create an order from an accepted quotation, copying its line items. */
export const convertQuotationToOrder = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		const quotation = await db
			.select()
			.from(quotations)
			.where(eq(quotations.id, id))
			.get();
		if (!quotation) throw new Error("Quotation not found");
		if (quotation.convertedOrderId) {
			return { orderId: quotation.convertedOrderId };
		}

		const items = await db
			.select()
			.from(quotationItems)
			.where(eq(quotationItems.quotationId, id))
			.all();

		const number = await nextNumber("order", "ORD");
		const order = await db
			.insert(orders)
			.values({
				number,
				customerId: quotation.customerId,
				quotationId: quotation.id,
				status: "pending",
				priority: "medium",
				currency: quotation.currency,
				value: quotation.total,
			})
			.returning()
			.get();

		if (items.length) {
			await db.insert(orderItems).values(
				items.map((i) => ({
					orderId: order.id,
					serviceId: i.serviceId,
					name: i.name,
					description: i.description,
					quantity: i.quantity,
					unitPrice: i.unitPrice,
					lineTotal: i.lineTotal,
					sortOrder: i.sortOrder,
				})),
			);
		}

		await db
			.update(quotations)
			.set({ status: "accepted", convertedOrderId: order.id })
			.where(eq(quotations.id, id));

		await logActivity({
			type: "order_created",
			entityType: "order",
			entityId: order.id,
			customerId: quotation.customerId,
			title: `Order ${number} created from quotation ${quotation.number}`,
		});
		return { orderId: order.id };
	});
