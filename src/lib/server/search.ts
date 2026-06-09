import { createServerFn } from "@tanstack/react-start";
import { eq, like, or } from "drizzle-orm";
import {
	customers,
	invoices,
	orders,
	payments,
	projects,
	quotations,
} from "#/db/app-schema.ts";
import { db } from "./util.ts";

export const globalSearch = createServerFn({ method: "GET" })
	.validator((query: string) => query)
	.handler(async ({ data: query }) => {
		const q = `%${query.trim()}%`;
		if (!query.trim()) {
			return {
				customers: [],
				orders: [],
				invoices: [],
				quotations: [],
				payments: [],
				projects: [],
			};
		}

		const [cust, ord, inv, quo, pay, proj] = await Promise.all([
			db
				.select()
				.from(customers)
				.where(
					or(
						like(customers.name, q),
						like(customers.companyName, q),
						like(customers.email, q),
						like(customers.phone, q),
					),
				)
				.limit(10)
				.all(),
			db
				.select({ o: orders, customerName: customers.name })
				.from(orders)
				.leftJoin(customers, eq(orders.customerId, customers.id))
				.where(like(orders.number, q))
				.limit(10)
				.all(),
			db
				.select({ i: invoices, customerName: customers.name })
				.from(invoices)
				.leftJoin(customers, eq(invoices.customerId, customers.id))
				.where(like(invoices.number, q))
				.limit(10)
				.all(),
			db
				.select({ qo: quotations, customerName: customers.name })
				.from(quotations)
				.leftJoin(customers, eq(quotations.customerId, customers.id))
				.where(like(quotations.number, q))
				.limit(10)
				.all(),
			db
				.select({
					p: payments,
					invoiceNumber: invoices.number,
				})
				.from(payments)
				.leftJoin(invoices, eq(payments.invoiceId, invoices.id))
				.where(like(payments.reference, q))
				.limit(10)
				.all(),
			db.select().from(projects).where(like(projects.name, q)).limit(10).all(),
		]);

		return {
			customers: cust,
			orders: ord.map((r) => ({ ...r.o, customerName: r.customerName })),
			invoices: inv.map((r) => ({ ...r.i, customerName: r.customerName })),
			quotations: quo.map((r) => ({ ...r.qo, customerName: r.customerName })),
			payments: pay.map((r) => ({ ...r.p, invoiceNumber: r.invoiceNumber })),
			projects: proj,
		};
	});
