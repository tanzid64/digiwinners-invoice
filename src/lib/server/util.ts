import { eq } from "drizzle-orm";
import { type ActivityType, activities, counters } from "#/db/app-schema.ts";
import { db } from "#/db/index.ts";

export { db };

/**
 * Atomically allocate the next sequential document number for a counter
 * (e.g. "INV", "QUO", "ORD"). Creates the counter on first use.
 */
export async function nextNumber(
	name: string,
	prefix: string,
	padding = 4,
): Promise<string> {
	const existing = await db
		.select()
		.from(counters)
		.where(eq(counters.name, name))
		.get();

	let value: number;
	if (!existing) {
		value = 1;
		await db.insert(counters).values({ name, prefix, value, padding });
	} else {
		value = existing.value + 1;
		await db.update(counters).set({ value }).where(eq(counters.name, name));
	}

	return `${prefix}-${String(value).padStart(padding, "0")}`;
}

interface LogActivityInput {
	type: ActivityType;
	entityType: string;
	entityId: string;
	customerId?: string | null;
	title: string;
	description?: string | null;
	actorUserId?: string | null;
}

/** Append an entry to the global activity timeline. */
export async function logActivity(input: LogActivityInput): Promise<void> {
	await db.insert(activities).values({
		type: input.type,
		entityType: input.entityType,
		entityId: input.entityId,
		customerId: input.customerId ?? null,
		title: input.title,
		description: input.description ?? null,
		actorUserId: input.actorUserId ?? null,
	});
}
