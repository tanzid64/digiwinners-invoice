import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	customers,
	invoices,
	notifications,
	payments,
} from "#/db/app-schema.ts";
import { formatMoney } from "#/lib/money.ts";
import { recomputeInvoice } from "./invoices.ts";
import { db, logActivity } from "./util.ts";

export const listPayments = createServerFn({ method: "GET" }).handler(
	async () => {
		const rows = await db
			.select({
				p: payments,
				invoiceNumber: invoices.number,
				customerName: customers.name,
			})
			.from(payments)
			.leftJoin(invoices, eq(payments.invoiceId, invoices.id))
			.leftJoin(customers, eq(payments.customerId, customers.id))
			.orderBy(desc(payments.paymentDate))
			.all();
		return rows.map((r) => ({
			...r.p,
			invoiceNumber: r.invoiceNumber,
			customerName: r.customerName,
		}));
	},
);

const createInput = z.object({
	invoiceId: z.string(),
	amount: z.number().int().min(1), // cents
	paymentDate: z.number(), // epoch ms
	method: z.enum([
		"cash",
		"bank_transfer",
		"cheque",
		"mobile_banking",
		"other",
	]),
	reference: z.string().optional().nullable(),
	receivingAccount: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
});

export const createPayment = createServerFn({ method: "POST" })
	.validator(createInput)
	.handler(async ({ data }) => {
		const invoice = await db
			.select()
			.from(invoices)
			.where(eq(invoices.id, data.invoiceId))
			.get();
		if (!invoice) throw new Error("Invoice not found");

		const row = await db
			.insert(payments)
			.values({
				invoiceId: data.invoiceId,
				customerId: invoice.customerId,
				amount: data.amount,
				paymentDate: new Date(data.paymentDate),
				method: data.method,
				reference: data.reference ?? null,
				receivingAccount: data.receivingAccount ?? null,
				notes: data.notes ?? null,
			})
			.returning()
			.get();

		await recomputeInvoice(data.invoiceId);

		await logActivity({
			type: "payment_recorded",
			entityType: "invoice",
			entityId: data.invoiceId,
			customerId: invoice.customerId,
			title: `Payment ${formatMoney(data.amount, invoice.currency)} on ${invoice.number}`,
			description: `Method: ${data.method.replace("_", " ")}`,
		});
		await db.insert(notifications).values({
			type: "payment_received",
			title: "Payment received",
			message: `${formatMoney(data.amount, invoice.currency)} received against ${invoice.number}`,
			relatedEntityType: "invoice",
			relatedEntityId: data.invoiceId,
		});
		return row;
	});

export const deletePayment = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		const payment = await db
			.select()
			.from(payments)
			.where(eq(payments.id, id))
			.get();
		if (!payment) return { ok: true };
		await db.delete(payments).where(eq(payments.id, id));
		await recomputeInvoice(payment.invoiceId);
		return { ok: true };
	});
