import { createServerFn } from "@tanstack/react-start";
import { desc, eq, sum } from "drizzle-orm";
import { z } from "zod";
import {
	customers,
	invoiceItems,
	invoices,
	orderItems,
	orders,
	payments,
} from "#/db/app-schema.ts";
import { documentMoneySchema, rollup } from "./shared.ts";
import { db, logActivity, nextNumber } from "./util.ts";

/**
 * Recalculate amountPaid / dueAmount / status for an invoice from its
 * payments. Called after any payment change. Leaves draft/cancelled alone.
 */
export async function recomputeInvoice(id: string): Promise<void> {
	const invoice = await db
		.select()
		.from(invoices)
		.where(eq(invoices.id, id))
		.get();
	if (!invoice) return;

	const paidRow = await db
		.select({ total: sum(payments.amount) })
		.from(payments)
		.where(eq(payments.invoiceId, id))
		.get();
	const amountPaid = Number(paidRow?.total ?? 0);
	const dueAmount = invoice.total - amountPaid;

	let status = invoice.status;
	if (status !== "draft" && status !== "cancelled") {
		if (amountPaid >= invoice.total && invoice.total > 0) status = "paid";
		else if (amountPaid > 0) status = "partially_paid";
		else if (invoice.dueDate.getTime() < Date.now()) status = "overdue";
		else status = "sent";
	}

	await db
		.update(invoices)
		.set({ amountPaid, dueAmount, status })
		.where(eq(invoices.id, id));
}

export const listInvoices = createServerFn({ method: "GET" }).handler(
	async () => {
		const rows = await db
			.select({ i: invoices, customerName: customers.name })
			.from(invoices)
			.leftJoin(customers, eq(invoices.customerId, customers.id))
			.orderBy(desc(invoices.createdAt))
			.all();
		return rows.map((r) => ({ ...r.i, customerName: r.customerName }));
	},
);

export const getInvoice = createServerFn({ method: "GET" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		const invoice = await db
			.select()
			.from(invoices)
			.where(eq(invoices.id, id))
			.get();
		if (!invoice) return null;
		const [items, customer, invoicePayments] = await Promise.all([
			db
				.select()
				.from(invoiceItems)
				.where(eq(invoiceItems.invoiceId, id))
				.orderBy(invoiceItems.sortOrder)
				.all(),
			db
				.select()
				.from(customers)
				.where(eq(customers.id, invoice.customerId))
				.get(),
			db
				.select()
				.from(payments)
				.where(eq(payments.invoiceId, id))
				.orderBy(desc(payments.paymentDate))
				.all(),
		]);
		return { invoice, items, customer, payments: invoicePayments };
	});

const createInput = z.object({
	customerId: z.string(),
	orderId: z.string().optional().nullable(),
	issueDate: z.number(),
	dueDate: z.number(),
	...documentMoneySchema,
});

export const createInvoice = createServerFn({ method: "POST" })
	.validator(createInput)
	.handler(async ({ data }) => {
		const { totals, items } = rollup(data);
		const number = await nextNumber("invoice", "INV");
		const row = await db
			.insert(invoices)
			.values({
				number,
				customerId: data.customerId,
				orderId: data.orderId ?? null,
				status: "draft",
				currency: data.currency,
				issueDate: new Date(data.issueDate),
				dueDate: new Date(data.dueDate),
				subtotal: totals.subtotal,
				discountType: data.discountType,
				discountValue: data.discountValue,
				discountAmount: totals.discountAmount,
				taxRate: data.taxRate,
				taxAmount: totals.taxAmount,
				total: totals.total,
				amountPaid: 0,
				dueAmount: totals.total,
				notes: data.notes ?? null,
				terms: data.terms ?? null,
			})
			.returning()
			.get();
		await db
			.insert(invoiceItems)
			.values(items.map((i) => ({ ...i, invoiceId: row.id })));
		await logActivity({
			type: "invoice_created",
			entityType: "invoice",
			entityId: row.id,
			customerId: data.customerId,
			title: `Invoice ${number} created`,
		});
		return row;
	});

/** Generate a draft invoice from an order, copying line items (30-day terms). */
export const createInvoiceFromOrder = createServerFn({ method: "POST" })
	.validator((orderId: string) => orderId)
	.handler(async ({ data: orderId }) => {
		const order = await db
			.select()
			.from(orders)
			.where(eq(orders.id, orderId))
			.get();
		if (!order) throw new Error("Order not found");
		const items = await db
			.select()
			.from(orderItems)
			.where(eq(orderItems.orderId, orderId))
			.all();

		const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
		const number = await nextNumber("invoice", "INV");
		const now = Date.now();
		const row = await db
			.insert(invoices)
			.values({
				number,
				customerId: order.customerId,
				orderId: order.id,
				status: "draft",
				currency: order.currency,
				issueDate: new Date(now),
				dueDate: new Date(now + 30 * 86400000),
				subtotal,
				total: subtotal,
				dueAmount: subtotal,
			})
			.returning()
			.get();
		if (items.length) {
			await db.insert(invoiceItems).values(
				items.map((i) => ({
					invoiceId: row.id,
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
		await logActivity({
			type: "invoice_created",
			entityType: "invoice",
			entityId: row.id,
			customerId: order.customerId,
			title: `Invoice ${number} created from order ${order.number}`,
		});
		return row;
	});

export const setInvoiceStatus = createServerFn({ method: "POST" })
	.validator(
		z.object({
			id: z.string(),
			status: z.enum([
				"draft",
				"sent",
				"partially_paid",
				"paid",
				"overdue",
				"cancelled",
			]),
		}),
	)
	.handler(async ({ data }) => {
		await db
			.update(invoices)
			.set({ status: data.status })
			.where(eq(invoices.id, data.id));
		// Re-derive paid/overdue from payments unless forced to draft/cancelled.
		if (data.status !== "draft" && data.status !== "cancelled") {
			await recomputeInvoice(data.id);
		}
		return { ok: true };
	});

export const deleteInvoice = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(invoices).where(eq(invoices.id, id));
		return { ok: true };
	});
