import { createServerFn } from "@tanstack/react-start";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	customers,
	deliveries,
	milestones,
	notifications,
	orders,
	projects,
} from "#/db/app-schema.ts";
import { db, logActivity } from "./util.ts";

export const listProjects = createServerFn({ method: "GET" }).handler(
	async () => {
		const rows = await db
			.select({
				p: projects,
				orderNumber: orders.number,
				customerName: customers.name,
			})
			.from(projects)
			.leftJoin(orders, eq(projects.orderId, orders.id))
			.leftJoin(customers, eq(orders.customerId, customers.id))
			.orderBy(desc(projects.createdAt))
			.all();
		return rows.map((r) => ({
			...r.p,
			orderNumber: r.orderNumber,
			customerName: r.customerName,
		}));
	},
);

export const getProject = createServerFn({ method: "GET" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		const project = await db
			.select()
			.from(projects)
			.where(eq(projects.id, id))
			.get();
		if (!project) return null;
		const [projectMilestones, projectDeliveries, order] = await Promise.all([
			db
				.select()
				.from(milestones)
				.where(eq(milestones.projectId, id))
				.orderBy(asc(milestones.sortOrder))
				.all(),
			db
				.select()
				.from(deliveries)
				.where(eq(deliveries.projectId, id))
				.orderBy(desc(deliveries.deliveredAt))
				.all(),
			db.select().from(orders).where(eq(orders.id, project.orderId)).get(),
		]);
		return {
			project,
			milestones: projectMilestones,
			deliveries: projectDeliveries,
			order,
		};
	});

/** Orders that don't yet have a project — selectable when creating one. */
export const listOrdersWithoutProject = createServerFn({
	method: "GET",
}).handler(async () => {
	const all = await db
		.select({ id: orders.id, number: orders.number })
		.from(orders)
		.all();
	const existing = await db
		.select({ orderId: projects.orderId })
		.from(projects)
		.all();
	const taken = new Set(existing.map((e) => e.orderId));
	return all.filter((o) => !taken.has(o.id));
});

export const createProject = createServerFn({ method: "POST" })
	.validator(
		z.object({
			orderId: z.string(),
			name: z.string().min(1),
			startDate: z.number().optional().nullable(),
			endDate: z.number().optional().nullable(),
		}),
	)
	.handler(async ({ data }) => {
		const row = await db
			.insert(projects)
			.values({
				orderId: data.orderId,
				name: data.name,
				status: "not_started",
				startDate: data.startDate ? new Date(data.startDate) : null,
				endDate: data.endDate ? new Date(data.endDate) : null,
				progress: 0,
			})
			.returning()
			.get();
		await logActivity({
			type: "project_updated",
			entityType: "project",
			entityId: row.id,
			title: `Project created: ${row.name}`,
		});
		return row;
	});

export const updateProject = createServerFn({ method: "POST" })
	.validator(
		z.object({
			id: z.string(),
			status: z.enum([
				"not_started",
				"in_progress",
				"on_hold",
				"completed",
				"cancelled",
			]),
			progress: z.number().int().min(0).max(100),
			startDate: z.number().optional().nullable(),
			endDate: z.number().optional().nullable(),
			notes: z.string().optional().nullable(),
		}),
	)
	.handler(async ({ data }) => {
		const progress = data.status === "completed" ? 100 : data.progress;
		const row = await db
			.update(projects)
			.set({
				status: data.status,
				progress,
				startDate: data.startDate ? new Date(data.startDate) : null,
				endDate: data.endDate ? new Date(data.endDate) : null,
				notes: data.notes ?? null,
			})
			.where(eq(projects.id, data.id))
			.returning()
			.get();
		await logActivity({
			type: "project_updated",
			entityType: "project",
			entityId: data.id,
			title: `Project ${row.name} → ${data.status.replace("_", " ")} (${progress}%)`,
		});
		if (data.status === "completed") {
			await db.insert(notifications).values({
				type: "project_completion",
				title: "Project completed",
				message: `${row.name} marked complete`,
				relatedEntityType: "project",
				relatedEntityId: data.id,
			});
		}
		return { ok: true };
	});

export const deleteProject = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(projects).where(eq(projects.id, id));
		return { ok: true };
	});

// ---- Milestones ----------------------------------------------------------

export const addMilestone = createServerFn({ method: "POST" })
	.validator(
		z.object({
			projectId: z.string(),
			title: z.string().min(1),
			description: z.string().optional().nullable(),
			dueDate: z.number().optional().nullable(),
		}),
	)
	.handler(async ({ data }) =>
		db
			.insert(milestones)
			.values({
				projectId: data.projectId,
				title: data.title,
				description: data.description ?? null,
				dueDate: data.dueDate ? new Date(data.dueDate) : null,
			})
			.returning()
			.get(),
	);

export const toggleMilestone = createServerFn({ method: "POST" })
	.validator(z.object({ id: z.string(), completed: z.boolean() }))
	.handler(async ({ data }) => {
		await db
			.update(milestones)
			.set({
				completed: data.completed,
				completedAt: data.completed ? new Date() : null,
			})
			.where(eq(milestones.id, data.id));
		return { ok: true };
	});

export const deleteMilestone = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(milestones).where(eq(milestones.id, id));
		return { ok: true };
	});

// ---- Deliveries ----------------------------------------------------------

export const addDelivery = createServerFn({ method: "POST" })
	.validator(
		z.object({
			projectId: z.string(),
			title: z.string().min(1),
			description: z.string().optional().nullable(),
			notes: z.string().optional().nullable(),
		}),
	)
	.handler(async ({ data }) =>
		db
			.insert(deliveries)
			.values({
				projectId: data.projectId,
				title: data.title,
				description: data.description ?? null,
				notes: data.notes ?? null,
			})
			.returning()
			.get(),
	);

export const deleteDelivery = createServerFn({ method: "POST" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		await db.delete(deliveries).where(eq(deliveries.id, id));
		return { ok: true };
	});
