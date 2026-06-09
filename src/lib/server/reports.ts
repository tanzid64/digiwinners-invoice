import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, inArray, lte, sum } from "drizzle-orm";
import { customers, invoices, payments } from "#/db/app-schema.ts";
import { db } from "./util.ts";

const OUTSTANDING_STATUSES = ["sent", "partially_paid", "overdue"] as const;

export const getReports = createServerFn({ method: "GET" })
	.validator((d: { from?: number; to?: number } = {}) => d)
	.handler(async ({ data }) => {
		const to = data.to ? new Date(data.to) : new Date();
		const from = data.from
			? new Date(data.from)
			: new Date(to.getFullYear() - 1, to.getMonth(), to.getDate());

		const [invRows, payRows, outstandingRow] = await Promise.all([
			db
				.select({ i: invoices, customerName: customers.name })
				.from(invoices)
				.leftJoin(customers, eq(invoices.customerId, customers.id))
				.where(
					and(
						gte(invoices.issueDate, from),
						lte(invoices.issueDate, to),
						inArray(invoices.status, [
							"sent",
							"partially_paid",
							"paid",
							"overdue",
						]),
					),
				)
				.orderBy(desc(invoices.issueDate))
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
				.where(
					and(gte(payments.paymentDate, from), lte(payments.paymentDate, to)),
				)
				.orderBy(desc(payments.paymentDate))
				.all(),
			db
				.select({ v: sum(invoices.dueAmount) })
				.from(invoices)
				.where(inArray(invoices.status, [...OUTSTANDING_STATUSES]))
				.get(),
		]);

		const inv = invRows.map((r) => ({ ...r.i, customerName: r.customerName }));
		const pay = payRows.map((r) => ({
			...r.p,
			invoiceNumber: r.invoiceNumber,
			customerName: r.customerName,
		}));

		const revenueTotal = inv.reduce((s, i) => s + i.total, 0);
		const collectionTotal = pay.reduce((s, p) => s + p.amount, 0);

		// Customer-wise: invoiced + collected + balance over the range.
		const byCustomer = new Map<
			string,
			{ name: string; invoiced: number; collected: number; outstanding: number }
		>();
		for (const i of inv) {
			const key = i.customerId;
			const e = byCustomer.get(key) ?? {
				name: i.customerName ?? "—",
				invoiced: 0,
				collected: 0,
				outstanding: 0,
			};
			e.invoiced += i.total;
			e.outstanding += i.dueAmount;
			byCustomer.set(key, e);
		}
		for (const p of pay) {
			const key = p.customerId;
			const e = byCustomer.get(key) ?? {
				name: p.customerName ?? "—",
				invoiced: 0,
				collected: 0,
				outstanding: 0,
			};
			e.collected += p.amount;
			byCustomer.set(key, e);
		}
		const customerWise = [...byCustomer.values()].sort(
			(a, b) => b.invoiced - a.invoiced,
		);

		// Monthly + yearly revenue summaries from in-range invoices.
		const monthly = new Map<string, number>();
		const yearly = new Map<string, number>();
		for (const i of inv) {
			const d = new Date(i.issueDate);
			const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
			const yk = String(d.getFullYear());
			monthly.set(mk, (monthly.get(mk) ?? 0) + i.total);
			yearly.set(yk, (yearly.get(yk) ?? 0) + i.total);
		}

		const overdue = inv.filter((i) => i.status === "overdue");

		return {
			range: { from: from.getTime(), to: to.getTime() },
			totals: {
				revenue: revenueTotal,
				collection: collectionTotal,
				outstanding: Number(outstandingRow?.v ?? 0),
				overdueCount: overdue.length,
				invoiceCount: inv.length,
			},
			revenue: inv,
			payments: pay,
			outstandingInvoices: inv.filter((i) => i.dueAmount > 0),
			overdueInvoices: overdue,
			customerWise,
			monthly: [...monthly.entries()]
				.map(([month, total]) => ({ month, total }))
				.sort((a, b) => a.month.localeCompare(b.month)),
			yearly: [...yearly.entries()]
				.map(([year, total]) => ({ year, total }))
				.sort((a, b) => a.year.localeCompare(b.year)),
		};
	});
