import { createServerFn } from "@tanstack/react-start";
import { desc, eq, inArray } from "drizzle-orm";
import { invoices, notifications } from "#/db/app-schema.ts";
import { formatMoney } from "#/lib/money.ts";
import { db } from "./util.ts";

export const listNotifications = createServerFn({ method: "GET" }).handler(
	async () =>
		db
			.select()
			.from(notifications)
			.orderBy(desc(notifications.createdAt))
			.limit(100)
			.all(),
);

export const unreadCount = createServerFn({ method: "GET" }).handler(
	async () => {
		const rows = await db
			.select({ id: notifications.id })
			.from(notifications)
			.where(eq(notifications.read, false))
			.all();
		return rows.length;
	},
);

export const markRead = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db
			.update(notifications)
			.set({ read: true })
			.where(eq(notifications.id, id));
		return { ok: true };
	});

export const markAllRead = createServerFn({ method: "POST" }).handler(
	async () => {
		await db.update(notifications).set({ read: true });
		return { ok: true };
	},
);

/**
 * Scan invoices and (re)generate due-soon / overdue notifications. Marks past-
 * due invoices overdue. Idempotent: clears prior due/overdue alerts first.
 */
export const generateNotifications = createServerFn({ method: "POST" }).handler(
	async () => {
		const now = Date.now();
		const soon = new Date(now + 7 * 86400000);

		await db
			.delete(notifications)
			.where(inArray(notifications.type, ["invoice_due", "invoice_overdue"]));

		// Mark past-due unpaid invoices overdue.
		const open = await db
			.select()
			.from(invoices)
			.where(inArray(invoices.status, ["sent", "partially_paid", "overdue"]))
			.all();

		let due = 0;
		let overdue = 0;
		for (const inv of open) {
			if (inv.dueAmount <= 0) continue;
			if (inv.dueDate.getTime() < now) {
				overdue++;
				if (inv.status !== "overdue") {
					await db
						.update(invoices)
						.set({ status: "overdue" })
						.where(eq(invoices.id, inv.id));
				}
				await db.insert(notifications).values({
					type: "invoice_overdue",
					title: `Overdue: ${inv.number}`,
					message: `${formatMoney(inv.dueAmount, inv.currency)} overdue since ${inv.dueDate.toLocaleDateString()}`,
					relatedEntityType: "invoice",
					relatedEntityId: inv.id,
				});
			} else if (inv.dueDate <= soon) {
				due++;
				await db.insert(notifications).values({
					type: "invoice_due",
					title: `Due soon: ${inv.number}`,
					message: `${formatMoney(inv.dueAmount, inv.currency)} due ${inv.dueDate.toLocaleDateString()}`,
					relatedEntityType: "invoice",
					relatedEntityId: inv.id,
				});
			}
		}
		return { due, overdue };
	},
);

export const deleteNotification = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(notifications).where(eq(notifications.id, id));
		return { ok: true };
	});
