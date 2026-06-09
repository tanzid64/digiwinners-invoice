import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { serviceCategories, services } from "#/db/app-schema.ts";
import { db } from "./util.ts";

// ---- Categories ----------------------------------------------------------

export const listCategories = createServerFn({ method: "GET" }).handler(
	async () =>
		db
			.select()
			.from(serviceCategories)
			.orderBy(asc(serviceCategories.name))
			.all(),
);

const categoryInput = z.object({
	name: z.string().min(1, "Name required"),
	description: z.string().optional().nullable(),
});

export const createCategory = createServerFn({ method: "POST" })
	.validator(categoryInput)
	.handler(async ({ data }) =>
		db.insert(serviceCategories).values(data).returning().get(),
	);

export const updateCategory = createServerFn({ method: "POST" })
	.validator(categoryInput.extend({ id: z.string() }))
	.handler(async ({ data }) => {
		const { id, ...rest } = data;
		return db
			.update(serviceCategories)
			.set(rest)
			.where(eq(serviceCategories.id, id))
			.returning()
			.get();
	});

export const deleteCategory = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
		return { ok: true };
	});

// ---- Services ------------------------------------------------------------

export const listServices = createServerFn({ method: "GET" }).handler(
	async () => {
		const rows = await db
			.select({
				service: services,
				categoryName: serviceCategories.name,
			})
			.from(services)
			.leftJoin(
				serviceCategories,
				eq(services.categoryId, serviceCategories.id),
			)
			.orderBy(asc(services.name))
			.all();
		return rows.map((r) => ({ ...r.service, categoryName: r.categoryName }));
	},
);

const serviceInput = z.object({
	categoryId: z.string().optional().nullable(),
	name: z.string().min(1, "Name required"),
	description: z.string().optional().nullable(),
	deliverables: z.string().optional().nullable(),
	unitPrice: z.number().int().min(0).default(0), // cents
	active: z.boolean().default(true),
});

export const createService = createServerFn({ method: "POST" })
	.validator(serviceInput)
	.handler(async ({ data }) =>
		db
			.insert(services)
			.values({ ...data, categoryId: data.categoryId || null })
			.returning()
			.get(),
	);

export const updateService = createServerFn({ method: "POST" })
	.validator(serviceInput.extend({ id: z.string() }))
	.handler(async ({ data }) => {
		const { id, ...rest } = data;
		return db
			.update(services)
			.set({ ...rest, categoryId: rest.categoryId || null })
			.where(eq(services.id, id))
			.returning()
			.get();
	});

export const deleteService = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(services).where(eq(services.id, id));
		return { ok: true };
	});
