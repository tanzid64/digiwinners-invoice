import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	customers,
	invoices,
	orderItems,
	orders,
	projects,
} from "#/db/app-schema.ts";
import { lineItemSchema, rollup } from "./shared.ts";
import { db, logActivity, nextNumber } from "./util.ts";

const ORDER_STATUSES = [
	"draft",
	"pending",
	"approved",
	"in_progress",
	"on_hold",
	"completed",
	"cancelled",
] as const;

export const listOrders = createServerFn({ method: "GET" }).handler(
	async () => {
		const rows = await db
			.select({ o: orders, customerName: customers.name })
			.from(orders)
			.leftJoin(customers, eq(orders.customerId, customers.id))
			.orderBy(desc(orders.createdAt))
			.all();
		return rows.map((r) => ({ ...r.o, customerName: r.customerName }));
	},
);

export const getOrder = createServerFn({ method: "GET" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		const order = await db.select().from(orders).where(eq(orders.id, id)).get();
		if (!order) return null;
		const [items, customer, project, orderInvoices] = await Promise.all([
			db
				.select()
				.from(orderItems)
				.where(eq(orderItems.orderId, id))
				.orderBy(orderItems.sortOrder)
				.all(),
			db
				.select()
				.from(customers)
				.where(eq(customers.id, order.customerId))
				.get(),
			db.select().from(projects).where(eq(projects.orderId, id)).get(),
			db.select().from(invoices).where(eq(invoices.orderId, id)).all(),
		]);
		return { order, items, customer, project, invoices: orderInvoices };
	});

const createInput = z.object({
	customerId: z.string(),
	priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
	currency: z.string().default("USD"),
	expectedDelivery: z.number().optional().nullable(),
	notes: z.string().optional().nullable(),
	items: z.array(lineItemSchema).min(1),
});

export const createOrder = createServerFn({ method: "POST" })
	.validator(createInput)
	.handler(async ({ data }) => {
		const { totals, items } = rollup({
			items: data.items,
			discountType: "none",
			discountValue: 0,
			taxRate: 0,
		});
		const number = await nextNumber("order", "ORD");
		const row = await db
			.insert(orders)
			.values({
				number,
				customerId: data.customerId,
				status: "pending",
				priority: data.priority,
				currency: data.currency,
				value: totals.subtotal,
				expectedDelivery: data.expectedDelivery
					? new Date(data.expectedDelivery)
					: null,
				notes: data.notes ?? null,
			})
			.returning()
			.get();
		await db
			.insert(orderItems)
			.values(items.map((i) => ({ ...i, orderId: row.id })));
		await logActivity({
			type: "order_created",
			entityType: "order",
			entityId: row.id,
			customerId: data.customerId,
			title: `Order ${number} created`,
		});
		return row;
	});

export const setOrderStatus = createServerFn({ method: "POST" })
	.validator(z.object({ id: z.string(), status: z.enum(ORDER_STATUSES) }))
	.handler(async ({ data }) => {
		const row = await db
			.update(orders)
			.set({ status: data.status })
			.where(eq(orders.id, data.id))
			.returning()
			.get();
		await logActivity({
			type: "order_updated",
			entityType: "order",
			entityId: data.id,
			customerId: row.customerId,
			title: `Order ${row.number} → ${data.status.replace("_", " ")}`,
		});
		return { ok: true };
	});

export const updateOrderMeta = createServerFn({ method: "POST" })
	.validator(
		z.object({
			id: z.string(),
			priority: z.enum(["low", "medium", "high", "urgent"]),
			expectedDelivery: z.number().optional().nullable(),
			notes: z.string().optional().nullable(),
		}),
	)
	.handler(async ({ data }) => {
		await db
			.update(orders)
			.set({
				priority: data.priority,
				expectedDelivery: data.expectedDelivery
					? new Date(data.expectedDelivery)
					: null,
				notes: data.notes ?? null,
			})
			.where(eq(orders.id, data.id));
		return { ok: true };
	});

export const deleteOrder = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(orders).where(eq(orders.id, id));
		return { ok: true };
	});
