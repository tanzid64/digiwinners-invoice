import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, inArray, ne, sql, sum } from "drizzle-orm";
import {
	activities,
	customers,
	invoices,
	orders,
	payments,
	projects,
} from "#/db/app-schema.ts";
import { db } from "./util.ts";

const INVOICED_STATUSES = [
	"sent",
	"partially_paid",
	"paid",
	"overdue",
] as const;
const OUTSTANDING_STATUSES = ["sent", "partially_paid", "overdue"] as const;
const ACTIVE_PROJECT_STATUSES = [
	"not_started",
	"in_progress",
	"on_hold",
] as const;

export const getDashboard = createServerFn({ method: "GET" }).handler(
	async () => {
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		const num = (v: unknown) => Number(v ?? 0);
		const scalar = async (p: Promise<{ v: unknown } | undefined>) =>
			num((await p)?.v);

		const [
			totalCustomers,
			totalOrders,
			activeProjects,
			totalInvoiced,
			totalCollected,
			outstanding,
			overdueCount,
			monthlyRevenue,
			monthlyCollection,
			recentActivities,
			recentPayments,
			recentOrders,
		] = await Promise.all([
			scalar(db.select({ v: count() }).from(customers).get()),
			scalar(db.select({ v: count() }).from(orders).get()),
			scalar(
				db
					.select({ v: count() })
					.from(projects)
					.where(inArray(projects.status, [...ACTIVE_PROJECT_STATUSES]))
					.get(),
			),
			scalar(
				db
					.select({ v: sum(invoices.total) })
					.from(invoices)
					.where(inArray(invoices.status, [...INVOICED_STATUSES]))
					.get(),
			),
			scalar(
				db
					.select({ v: sum(payments.amount) })
					.from(payments)
					.get(),
			),
			scalar(
				db
					.select({ v: sum(invoices.dueAmount) })
					.from(invoices)
					.where(inArray(invoices.status, [...OUTSTANDING_STATUSES]))
					.get(),
			),
			scalar(
				db
					.select({ v: count() })
					.from(invoices)
					.where(eq(invoices.status, "overdue"))
					.get(),
			),
			scalar(
				db
					.select({ v: sum(invoices.total) })
					.from(invoices)
					.where(
						and(
							ne(invoices.status, "cancelled"),
							ne(invoices.status, "draft"),
							gte(invoices.issueDate, monthStart),
						),
					)
					.get(),
			),
			scalar(
				db
					.select({ v: sum(payments.amount) })
					.from(payments)
					.where(gte(payments.paymentDate, monthStart))
					.get(),
			),
			db
				.select()
				.from(activities)
				.orderBy(desc(activities.createdAt))
				.limit(8)
				.all(),
			db
				.select({
					p: payments,
					invoiceNumber: invoices.number,
					customerName: customers.name,
				})
				.from(payments)
				.leftJoin(invoices, eq(payments.invoiceId, invoices.id))
				.leftJoin(customers, eq(payments.customerId, customers.id))
				.orderBy(desc(payments.paymentDate))
				.limit(5)
				.all(),
			db
				.select({ o: orders, customerName: customers.name })
				.from(orders)
				.leftJoin(customers, eq(orders.customerId, customers.id))
				.orderBy(desc(orders.createdAt))
				.limit(5)
				.all(),
		]);

		// Last 6 months revenue series for a simple chart.
		const monthly = await db
			.select({
				month: sql<string>`strftime('%Y-%m', ${invoices.issueDate}, 'unixepoch')`,
				total: sum(invoices.total),
			})
			.from(invoices)
			.where(inArray(invoices.status, [...INVOICED_STATUSES]))
			.groupBy(sql`1`)
			.orderBy(sql`1 desc`)
			.limit(6)
			.all();

		return {
			kpis: {
				totalCustomers,
				totalOrders,
				activeProjects,
				totalInvoiced,
				totalCollected,
				outstanding,
				overdueCount,
				monthlyRevenue,
				monthlyCollection,
			},
			recentActivities,
			recentPayments: recentPayments.map((r) => ({
				...r.p,
				invoiceNumber: r.invoiceNumber,
				customerName: r.customerName,
			})),
			recentOrders: recentOrders.map((r) => ({
				...r.o,
				customerName: r.customerName,
			})),
			monthlyRevenue: monthly.map((m) => ({
				month: m.month,
				total: Number(m.total ?? 0),
			})),
		};
	},
);
