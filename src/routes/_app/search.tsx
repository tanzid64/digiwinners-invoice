import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { StatusBadge } from "#/components/status-badge.tsx";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { formatMoney } from "#/lib/money.ts";
import { globalSearch } from "#/lib/server/search.ts";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/_app/search")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ q: search.q ?? "" }),
	loader: ({ deps }) => globalSearch({ data: deps.q }),
	component: SearchPage,
});

function SearchPage() {
	const results = Route.useLoaderData();
	const { q } = Route.useSearch();
	const navigate = useNavigate();
	const [query, setQuery] = useState(q ?? "");

	const total =
		results.customers.length +
		results.orders.length +
		results.invoices.length +
		results.quotations.length +
		results.payments.length +
		results.projects.length;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Search</h1>
				<p className="text-muted-foreground">
					Across customers, orders, invoices, quotations, payments, projects.
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					navigate({ to: "/search", search: { q: query } });
				}}
				className="relative max-w-xl"
			>
				<Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
				<Input
					autoFocus
					placeholder="Search… (name, number, reference)"
					className="pl-9"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</form>

			{q ? (
				<p className="text-muted-foreground text-sm">
					{total} result{total === 1 ? "" : "s"} for “{q}”
				</p>
			) : null}

			<div className="grid gap-6 md:grid-cols-2">
				<Group title="Customers" show={results.customers.length > 0}>
					{results.customers.map((c) => (
						<Row
							key={c.id}
							to="/customers/$customerId"
							params={{ customerId: c.id }}
							left={c.name}
							right={<StatusBadge status={c.status} />}
						/>
					))}
				</Group>
				<Group title="Invoices" show={results.invoices.length > 0}>
					{results.invoices.map((i) => (
						<Row
							key={i.id}
							to="/invoices/$invoiceId"
							params={{ invoiceId: i.id }}
							left={`${i.number} · ${i.customerName ?? ""}`}
							right={formatMoney(i.dueAmount, i.currency)}
						/>
					))}
				</Group>
				<Group title="Orders" show={results.orders.length > 0}>
					{results.orders.map((o) => (
						<Row
							key={o.id}
							to="/orders/$orderId"
							params={{ orderId: o.id }}
							left={`${o.number} · ${o.customerName ?? ""}`}
							right={<StatusBadge status={o.status} />}
						/>
					))}
				</Group>
				<Group title="Quotations" show={results.quotations.length > 0}>
					{results.quotations.map((qo) => (
						<Row
							key={qo.id}
							to="/quotations/$quotationId"
							params={{ quotationId: qo.id }}
							left={`${qo.number} · ${qo.customerName ?? ""}`}
							right={<StatusBadge status={qo.status} />}
						/>
					))}
				</Group>
				<Group title="Projects" show={results.projects.length > 0}>
					{results.projects.map((p) => (
						<Row
							key={p.id}
							to="/projects/$projectId"
							params={{ projectId: p.id }}
							left={p.name}
							right={<StatusBadge status={p.status} />}
						/>
					))}
				</Group>
				<Group title="Payments" show={results.payments.length > 0}>
					{results.payments.map((p) => (
						<Row
							key={p.id}
							to="/invoices/$invoiceId"
							params={{ invoiceId: p.invoiceId }}
							left={`${p.reference ?? "—"} · ${p.invoiceNumber ?? ""}`}
							right={formatMoney(p.amount)}
						/>
					))}
				</Group>
			</div>
		</div>
	);
}

function Group({
	title,
	show,
	children,
}: {
	title: string;
	show: boolean;
	children: React.ReactNode;
}) {
	if (!show) return null;
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{title}</CardTitle>
			</CardHeader>
			<CardContent className="divide-y p-0">{children}</CardContent>
		</Card>
	);
}

function Row({
	to,
	params,
	left,
	right,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: thin Link wrapper over varied routes
	to: any;
	// biome-ignore lint/suspicious/noExplicitAny: route params vary per group
	params: any;
	left: React.ReactNode;
	right: React.ReactNode;
}) {
	return (
		<Link
			to={to}
			params={params}
			className="hover:bg-muted/50 flex items-center justify-between gap-3 px-6 py-3 text-sm"
		>
			<span className="min-w-0 truncate font-medium">{left}</span>
			<span className="shrink-0">{right}</span>
		</Link>
	);
}
