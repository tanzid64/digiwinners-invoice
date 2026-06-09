import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import {
	activities,
	contacts,
	customers,
	invoices,
	orders,
} from "#/db/app-schema.ts";
import { db, logActivity } from "./util.ts";

const customerInput = z.object({
	type: z.enum(["individual", "company"]),
	name: z.string().min(1, "Name required"),
	companyName: z.string().optional().nullable(),
	email: z.string().email().optional().or(z.literal("")).nullable(),
	phone: z.string().optional().nullable(),
	address: z.string().optional().nullable(),
	taxId: z.string().optional().nullable(),
	website: z.string().optional().nullable(),
	status: z.enum(["active", "inactive"]).default("active"),
	notes: z.string().optional().nullable(),
});

export const listCustomers = createServerFn({ method: "GET" })
	.validator(
		(d: { search?: string; status?: "active" | "inactive" | "all" } = {}) => d,
	)
	.handler(async ({ data }) => {
		const filters = [];
		if (data.search) {
			const q = `%${data.search}%`;
			filters.push(
				or(
					like(customers.name, q),
					like(customers.companyName, q),
					like(customers.email, q),
					like(customers.phone, q),
				),
			);
		}
		if (data.status && data.status !== "all") {
			filters.push(eq(customers.status, data.status));
		}

		return db
			.select()
			.from(customers)
			.where(filters.length ? and(...filters) : undefined)
			.orderBy(desc(customers.createdAt))
			.all();
	});

export const getCustomer = createServerFn({ method: "GET" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		const customer = await db
			.select()
			.from(customers)
			.where(eq(customers.id, id))
			.get();
		if (!customer) return null;

		const [customerContacts, timeline, customerOrders, customerInvoices] =
			await Promise.all([
				db.select().from(contacts).where(eq(contacts.customerId, id)).all(),
				db
					.select()
					.from(activities)
					.where(eq(activities.customerId, id))
					.orderBy(desc(activities.createdAt))
					.limit(50)
					.all(),
				db
					.select()
					.from(orders)
					.where(eq(orders.customerId, id))
					.orderBy(desc(orders.createdAt))
					.all(),
				db
					.select()
					.from(invoices)
					.where(eq(invoices.customerId, id))
					.orderBy(desc(invoices.createdAt))
					.all(),
			]);

		return {
			customer,
			contacts: customerContacts,
			timeline,
			orders: customerOrders,
			invoices: customerInvoices,
		};
	});

export const createCustomer = createServerFn({ method: "POST" })
	.validator(customerInput)
	.handler(async ({ data }) => {
		const row = await db
			.insert(customers)
			.values({ ...data, email: data.email || null })
			.returning()
			.get();
		await logActivity({
			type: "customer_created",
			entityType: "customer",
			entityId: row.id,
			customerId: row.id,
			title: `Customer created: ${row.name}`,
		});
		return row;
	});

export const updateCustomer = createServerFn({ method: "POST" })
	.validator(customerInput.extend({ id: z.string() }))
	.handler(async ({ data }) => {
		const { id, ...rest } = data;
		const row = await db
			.update(customers)
			.set({ ...rest, email: rest.email || null })
			.where(eq(customers.id, id))
			.returning()
			.get();
		await logActivity({
			type: "customer_updated",
			entityType: "customer",
			entityId: id,
			customerId: id,
			title: `Customer updated: ${row.name}`,
		});
		return row;
	});

export const deleteCustomer = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(customers).where(eq(customers.id, id));
		return { ok: true };
	});

const contactInput = z.object({
	customerId: z.string(),
	name: z.string().min(1),
	role: z.string().optional().nullable(),
	email: z.string().optional().nullable(),
	phone: z.string().optional().nullable(),
	isPrimary: z.boolean().default(false),
	notes: z.string().optional().nullable(),
});

export const addContact = createServerFn({ method: "POST" })
	.validator(contactInput)
	.handler(async ({ data }) => {
		return db.insert(contacts).values(data).returning().get();
	});

export const deleteContact = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(contacts).where(eq(contacts.id, id));
		return { ok: true };
	});
