import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { customers, documents } from "#/db/app-schema.ts";
import { db } from "./util.ts";

export const listDocuments = createServerFn({ method: "GET" }).handler(
	async () => {
		const rows = await db
			.select({ d: documents, customerName: customers.name })
			.from(documents)
			.leftJoin(customers, eq(documents.customerId, customers.id))
			.orderBy(desc(documents.createdAt))
			.all();
		return rows.map((r) => ({ ...r.d, customerName: r.customerName }));
	},
);

export const createDocument = createServerFn({ method: "POST" })
	.validator(
		z.object({
			type: z.enum([
				"quotation",
				"invoice",
				"contract",
				"payment_proof",
				"customer_document",
			]),
			name: z.string().min(1),
			customerId: z.string().optional().nullable(),
			relatedEntityType: z.string().optional().nullable(),
			relatedEntityId: z.string().optional().nullable(),
		}),
	)
	.handler(async ({ data }) =>
		db
			.insert(documents)
			.values({
				type: data.type,
				name: data.name,
				customerId: data.customerId || null,
				relatedEntityType: data.relatedEntityType ?? null,
				relatedEntityId: data.relatedEntityId ?? null,
			})
			.returning()
			.get(),
	);

export const deleteDocument = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(documents).where(eq(documents.id, id));
		return { ok: true };
	});
