import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "#/components/status-badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table.tsx";
import { formatMoney } from "#/lib/money.ts";
import {
	addContact,
	deleteContact,
	deleteCustomer,
	getCustomer,
} from "#/lib/server/customers.ts";

export const Route = createFileRoute("/_app/customers/$customerId")({
	loader: ({ params }) => getCustomer({ data: params.customerId }),
	component: CustomerDetail,
});

function fmtDate(d: Date | string | number | null) {
	if (!d) return "—";
	return new Date(d).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function CustomerDetail() {
	const data = Route.useLoaderData();
	const router = useRouter();

	if (!data) {
		return (
			<div className="space-y-4">
				<p>Customer not found.</p>
				<Button asChild variant="outline">
					<Link to="/customers">Back to customers</Link>
				</Button>
			</div>
		);
	}

	const { customer, contacts, timeline, orders, invoices } = data;

	async function handleDelete() {
		if (!confirm(`Delete ${customer.name}? This cannot be undone.`)) return;
		await deleteCustomer({ data: customer.id });
		toast.success("Customer deleted");
		await router.navigate({ to: "/customers" });
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button asChild variant="ghost" size="icon">
						<Link to="/customers">
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold tracking-tight">
								{customer.name}
							</h1>
							<StatusBadge status={customer.status} />
						</div>
						<p className="text-muted-foreground capitalize">
							{customer.type}
							{customer.companyName ? ` · ${customer.companyName}` : ""}
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button asChild variant="outline">
						<Link
							to="/customers/$customerId/edit"
							params={{ customerId: customer.id }}
						>
							<Pencil className="size-4" /> Edit
						</Link>
					</Button>
					<Button variant="destructive" onClick={handleDelete}>
						<Trash2 className="size-4" /> Delete
					</Button>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Details</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
							<Field label="Email" value={customer.email} />
							<Field label="Phone" value={customer.phone} />
							<Field label="Website" value={customer.website} />
							<Field label="Tax ID" value={customer.taxId} />
							<Field
								label="Address"
								value={customer.address}
								className="sm:col-span-2"
							/>
							<Field
								label="Notes"
								value={customer.notes}
								className="sm:col-span-2"
							/>
						</CardContent>
					</Card>

					<ContactsCard
						customerId={customer.id}
						contacts={contacts}
						onChange={() => router.invalidate()}
					/>

					<Card>
						<CardHeader>
							<CardTitle>Orders ({orders.length})</CardTitle>
						</CardHeader>
						<CardContent className="px-0">
							<MiniTable
								rows={orders.map((o) => ({
									id: o.id,
									a: o.number,
									b: <StatusBadge status={o.status} />,
									c: formatMoney(o.value, o.currency),
								}))}
								cols={["Number", "Status", "Value"]}
								empty="No orders yet."
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Invoices ({invoices.length})</CardTitle>
						</CardHeader>
						<CardContent className="px-0">
							<MiniTable
								rows={invoices.map((i) => ({
									id: i.id,
									a: i.number,
									b: <StatusBadge status={i.status} />,
									c: formatMoney(i.dueAmount, i.currency),
								}))}
								cols={["Number", "Status", "Due"]}
								empty="No invoices yet."
							/>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Activity</CardTitle>
					</CardHeader>
					<CardContent>
						{timeline.length === 0 ? (
							<p className="text-muted-foreground text-sm">No activity yet.</p>
						) : (
							<ol className="space-y-4">
								{timeline.map((t) => (
									<li key={t.id} className="flex gap-3">
										<div className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
										<div className="min-w-0">
											<p className="text-sm font-medium">{t.title}</p>
											{t.description ? (
												<p className="text-muted-foreground text-sm">
													{t.description}
												</p>
											) : null}
											<p className="text-muted-foreground text-xs">
												{fmtDate(t.createdAt)}
											</p>
										</div>
									</li>
								))}
							</ol>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function Field({
	label,
	value,
	className,
}: {
	label: string;
	value?: string | null;
	className?: string;
}) {
	return (
		<div className={className}>
			<dt className="text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</dt>
			<dd className="mt-0.5 break-words">{value || "—"}</dd>
		</div>
	);
}

function MiniTable({
	rows,
	cols,
	empty,
}: {
	rows: {
		id: string;
		a: React.ReactNode;
		b: React.ReactNode;
		c: React.ReactNode;
	}[];
	cols: [string, string, string];
	empty: string;
}) {
	if (rows.length === 0)
		return <p className="text-muted-foreground px-6 py-4 text-sm">{empty}</p>;
	return (
		<Table>
			<TableHeader>
				<TableRow>
					{cols.map((c) => (
						<TableHead key={c}>{c}</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{rows.map((r) => (
					<TableRow key={r.id}>
						<TableCell className="font-medium">{r.a}</TableCell>
						<TableCell>{r.b}</TableCell>
						<TableCell>{r.c}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function ContactsCard({
	customerId,
	contacts,
	onChange,
}: {
	customerId: string;
	contacts: {
		id: string;
		name: string;
		role: string | null;
		email: string | null;
		phone: string | null;
	}[];
	onChange: () => void;
}) {
	const [adding, setAdding] = useState(false);
	const [name, setName] = useState("");
	const [role, setRole] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [busy, setBusy] = useState(false);

	async function add() {
		if (!name.trim()) return;
		setBusy(true);
		try {
			await addContact({
				data: { customerId, name, role, email, phone, isPrimary: false },
			});
			setName("");
			setRole("");
			setEmail("");
			setPhone("");
			setAdding(false);
			toast.success("Contact added");
			onChange();
		} finally {
			setBusy(false);
		}
	}

	async function remove(id: string) {
		await deleteContact({ data: id });
		toast.success("Contact removed");
		onChange();
	}

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between">
				<CardTitle>Contacts ({contacts.length})</CardTitle>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setAdding((s) => !s)}
				>
					<Plus className="size-4" /> Add
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				{adding && (
					<div className="bg-muted/40 grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
						<Input
							placeholder="Name *"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
						<Input
							placeholder="Role"
							value={role}
							onChange={(e) => setRole(e.target.value)}
						/>
						<Input
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<Input
							placeholder="Phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
						/>
						<div className="sm:col-span-2">
							<Button size="sm" onClick={add} disabled={busy}>
								{busy ? "Adding…" : "Save contact"}
							</Button>
						</div>
					</div>
				)}
				{contacts.length === 0 ? (
					<p className="text-muted-foreground text-sm">No contacts.</p>
				) : (
					<ul className="divide-y">
						{contacts.map((c) => (
							<li
								key={c.id}
								className="flex items-center justify-between gap-3 py-2"
							>
								<div className="min-w-0">
									<p className="font-medium">
										{c.name}
										{c.role ? (
											<span className="text-muted-foreground"> · {c.role}</span>
										) : null}
									</p>
									<p className="text-muted-foreground truncate text-sm">
										{[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => remove(c.id)}
								>
									<Trash2 className="size-4" />
								</Button>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
