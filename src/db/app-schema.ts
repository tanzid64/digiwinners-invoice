import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Conventions
// - Primary keys: text UUID, generated app-side via crypto.randomUUID().
// - Money: integer MINOR units (cents). Never floats. See #/lib/money.ts.
// - Timestamps: integer epoch (Date via drizzle 'timestamp' mode).
// - Enums: text columns narrowed with $type<Union>() — sqlite has no enums.
// ---------------------------------------------------------------------------

const pk = () =>
	text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
	integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date());

const updatedAt = () =>
	integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date());

// ---------------------------------------------------------------------------
// Customers & contacts
// ---------------------------------------------------------------------------

export type CustomerType = "individual" | "company";
export type CustomerStatus = "active" | "inactive";

export const customers = sqliteTable("customers", {
	id: pk(),
	type: text("type").$type<CustomerType>().notNull().default("individual"),
	name: text("name").notNull(),
	companyName: text("company_name"),
	email: text("email"),
	phone: text("phone"),
	address: text("address"),
	taxId: text("tax_id"),
	website: text("website"),
	status: text("status").$type<CustomerStatus>().notNull().default("active"),
	notes: text("notes"),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

export const contacts = sqliteTable("contacts", {
	id: pk(),
	customerId: text("customer_id")
		.notNull()
		.references(() => customers.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	role: text("role"),
	email: text("email"),
	phone: text("phone"),
	isPrimary: integer("is_primary", { mode: "boolean" })
		.notNull()
		.default(false),
	notes: text("notes"),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// Service catalog
// ---------------------------------------------------------------------------

export const serviceCategories = sqliteTable("service_categories", {
	id: pk(),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

export const services = sqliteTable("services", {
	id: pk(),
	categoryId: text("category_id").references(() => serviceCategories.id, {
		onDelete: "set null",
	}),
	name: text("name").notNull(),
	description: text("description"),
	deliverables: text("deliverables"),
	// Default unit price in cents.
	unitPrice: integer("unit_price").notNull().default(0),
	active: integer("active", { mode: "boolean" }).notNull().default(true),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// Shared money fields for documents with line items (quotation/order/invoice)
// All amounts are cents. discount: percent (basis points) or fixed (cents).
// ---------------------------------------------------------------------------

export type DiscountType = "none" | "percent" | "fixed";

// ---------------------------------------------------------------------------
// Quotations
// ---------------------------------------------------------------------------

export type QuotationStatus =
	| "draft"
	| "sent"
	| "accepted"
	| "rejected"
	| "expired";

export const quotations = sqliteTable("quotations", {
	id: pk(),
	number: text("number").notNull().unique(),
	customerId: text("customer_id")
		.notNull()
		.references(() => customers.id, { onDelete: "restrict" }),
	status: text("status").$type<QuotationStatus>().notNull().default("draft"),
	currency: text("currency").notNull().default("USD"),
	issueDate: integer("issue_date", { mode: "timestamp" }).notNull(),
	validUntil: integer("valid_until", { mode: "timestamp" }),
	subtotal: integer("subtotal").notNull().default(0),
	discountType: text("discount_type")
		.$type<DiscountType>()
		.notNull()
		.default("none"),
	// percent stored as basis points (e.g. 1500 = 15%); fixed stored as cents.
	discountValue: integer("discount_value").notNull().default(0),
	discountAmount: integer("discount_amount").notNull().default(0),
	taxRate: integer("tax_rate").notNull().default(0), // basis points
	taxAmount: integer("tax_amount").notNull().default(0),
	total: integer("total").notNull().default(0),
	notes: text("notes"),
	terms: text("terms"),
	convertedOrderId: text("converted_order_id"),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

export const quotationItems = sqliteTable("quotation_items", {
	id: pk(),
	quotationId: text("quotation_id")
		.notNull()
		.references(() => quotations.id, { onDelete: "cascade" }),
	serviceId: text("service_id").references(() => services.id, {
		onDelete: "set null",
	}),
	name: text("name").notNull(),
	description: text("description"),
	quantity: integer("quantity").notNull().default(1),
	unitPrice: integer("unit_price").notNull().default(0), // cents
	lineTotal: integer("line_total").notNull().default(0), // cents
	sortOrder: integer("sort_order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type OrderStatus =
	| "draft"
	| "pending"
	| "approved"
	| "in_progress"
	| "on_hold"
	| "completed"
	| "cancelled";

export type OrderPriority = "low" | "medium" | "high" | "urgent";

export const orders = sqliteTable("orders", {
	id: pk(),
	number: text("number").notNull().unique(),
	customerId: text("customer_id")
		.notNull()
		.references(() => customers.id, { onDelete: "restrict" }),
	quotationId: text("quotation_id").references(() => quotations.id, {
		onDelete: "set null",
	}),
	status: text("status").$type<OrderStatus>().notNull().default("draft"),
	priority: text("priority").$type<OrderPriority>().notNull().default("medium"),
	currency: text("currency").notNull().default("USD"),
	value: integer("value").notNull().default(0), // cents
	expectedDelivery: integer("expected_delivery", { mode: "timestamp" }),
	notes: text("notes"),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

export const orderItems = sqliteTable("order_items", {
	id: pk(),
	orderId: text("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	serviceId: text("service_id").references(() => services.id, {
		onDelete: "set null",
	}),
	name: text("name").notNull(),
	description: text("description"),
	quantity: integer("quantity").notNull().default(1),
	unitPrice: integer("unit_price").notNull().default(0),
	lineTotal: integer("line_total").notNull().default(0),
	sortOrder: integer("sort_order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export type ProjectStatus =
	| "not_started"
	| "in_progress"
	| "on_hold"
	| "completed"
	| "cancelled";

export const projects = sqliteTable("projects", {
	id: pk(),
	orderId: text("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	status: text("status")
		.$type<ProjectStatus>()
		.notNull()
		.default("not_started"),
	startDate: integer("start_date", { mode: "timestamp" }),
	endDate: integer("end_date", { mode: "timestamp" }),
	progress: integer("progress").notNull().default(0), // 0-100
	notes: text("notes"),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

export const milestones = sqliteTable("milestones", {
	id: pk(),
	projectId: text("project_id")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	description: text("description"),
	dueDate: integer("due_date", { mode: "timestamp" }),
	completed: integer("completed", { mode: "boolean" }).notNull().default(false),
	completedAt: integer("completed_at", { mode: "timestamp" }),
	sortOrder: integer("sort_order").notNull().default(0),
});

export const deliveries = sqliteTable("deliveries", {
	id: pk(),
	projectId: text("project_id")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	description: text("description"),
	deliveredAt: integer("delivered_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	notes: text("notes"),
});

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export type InvoiceStatus =
	| "draft"
	| "sent"
	| "partially_paid"
	| "paid"
	| "overdue"
	| "cancelled";

export const invoices = sqliteTable("invoices", {
	id: pk(),
	number: text("number").notNull().unique(),
	customerId: text("customer_id")
		.notNull()
		.references(() => customers.id, { onDelete: "restrict" }),
	orderId: text("order_id").references(() => orders.id, {
		onDelete: "set null",
	}),
	status: text("status").$type<InvoiceStatus>().notNull().default("draft"),
	currency: text("currency").notNull().default("USD"),
	issueDate: integer("issue_date", { mode: "timestamp" }).notNull(),
	dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
	subtotal: integer("subtotal").notNull().default(0),
	discountType: text("discount_type")
		.$type<DiscountType>()
		.notNull()
		.default("none"),
	discountValue: integer("discount_value").notNull().default(0),
	discountAmount: integer("discount_amount").notNull().default(0),
	taxRate: integer("tax_rate").notNull().default(0), // basis points
	taxAmount: integer("tax_amount").notNull().default(0),
	total: integer("total").notNull().default(0), // cents
	amountPaid: integer("amount_paid").notNull().default(0), // cents
	// dueAmount is derived (total - amountPaid) but stored for fast querying.
	dueAmount: integer("due_amount").notNull().default(0),
	notes: text("notes"),
	terms: text("terms"),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

export const invoiceItems = sqliteTable("invoice_items", {
	id: pk(),
	invoiceId: text("invoice_id")
		.notNull()
		.references(() => invoices.id, { onDelete: "cascade" }),
	serviceId: text("service_id").references(() => services.id, {
		onDelete: "set null",
	}),
	name: text("name").notNull(),
	description: text("description"),
	quantity: integer("quantity").notNull().default(1),
	unitPrice: integer("unit_price").notNull().default(0),
	lineTotal: integer("line_total").notNull().default(0),
	sortOrder: integer("sort_order").notNull().default(0),
});

// ---------------------------------------------------------------------------
// Payments (all received manually)
// ---------------------------------------------------------------------------

export type PaymentMethod =
	| "cash"
	| "bank_transfer"
	| "cheque"
	| "mobile_banking"
	| "other";

export const payments = sqliteTable("payments", {
	id: pk(),
	invoiceId: text("invoice_id")
		.notNull()
		.references(() => invoices.id, { onDelete: "cascade" }),
	customerId: text("customer_id")
		.notNull()
		.references(() => customers.id, { onDelete: "restrict" }),
	amount: integer("amount").notNull(), // cents
	paymentDate: integer("payment_date", { mode: "timestamp" }).notNull(),
	method: text("method").$type<PaymentMethod>().notNull().default("cash"),
	reference: text("reference"),
	receivingAccount: text("receiving_account"),
	notes: text("notes"),
	proofDocumentId: text("proof_document_id"),
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// Documents (metadata only for now; R2 upload wired in a later phase)
// ---------------------------------------------------------------------------

export type DocumentType =
	| "quotation"
	| "invoice"
	| "contract"
	| "payment_proof"
	| "customer_document";

export const documents = sqliteTable("documents", {
	id: pk(),
	type: text("type").$type<DocumentType>().notNull(),
	customerId: text("customer_id").references(() => customers.id, {
		onDelete: "cascade",
	}),
	relatedEntityType: text("related_entity_type"),
	relatedEntityId: text("related_entity_id"),
	name: text("name").notNull(),
	mimeType: text("mime_type"),
	sizeBytes: integer("size_bytes"),
	storageKey: text("storage_key"), // R2 object key (null until uploads wired)
	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// Activity timeline (global)
// ---------------------------------------------------------------------------

export type ActivityType =
	| "customer_created"
	| "customer_updated"
	| "order_created"
	| "order_updated"
	| "quotation_created"
	| "quotation_updated"
	| "invoice_created"
	| "invoice_updated"
	| "payment_recorded"
	| "project_updated";

export const activities = sqliteTable("activities", {
	id: pk(),
	type: text("type").$type<ActivityType>().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	customerId: text("customer_id").references(() => customers.id, {
		onDelete: "cascade",
	}),
	title: text("title").notNull(),
	description: text("description"),
	actorUserId: text("actor_user_id"),
	createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationType =
	| "invoice_due"
	| "invoice_overdue"
	| "payment_received"
	| "project_completion";

export const notifications = sqliteTable("notifications", {
	id: pk(),
	type: text("type").$type<NotificationType>().notNull(),
	title: text("title").notNull(),
	message: text("message"),
	relatedEntityType: text("related_entity_type"),
	relatedEntityId: text("related_entity_id"),
	read: integer("read", { mode: "boolean" }).notNull().default(false),
	createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Counters — sequential document numbering (INV-0001, QUO-0001, ORD-0001)
// ---------------------------------------------------------------------------

export const counters = sqliteTable("counters", {
	name: text("name").primaryKey(),
	prefix: text("prefix").notNull(),
	value: integer("value").notNull().default(0),
	padding: integer("padding").notNull().default(4),
});
