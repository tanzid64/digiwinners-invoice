import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "#/components/status-badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card } from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table.tsx";
import { listCustomers } from "#/lib/server/customers.ts";

export const Route = createFileRoute("/_app/customers/")({
	loader: () => listCustomers({ data: {} }),
	component: CustomersList,
});

function CustomersList() {
	const customers = Route.useLoaderData();
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return customers.filter((c) => {
			if (status !== "all" && c.status !== status) return false;
			if (!q) return true;
			return [c.name, c.companyName, c.email, c.phone]
				.filter(Boolean)
				.some((f) => f?.toLowerCase().includes(q));
		});
	}, [customers, search, status]);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Customers</h1>
					<p className="text-muted-foreground">
						{customers.length} total · {filtered.length} shown
					</p>
				</div>
				<Button asChild>
					<Link to="/customers/new">
						<Plus className="size-4" /> New customer
					</Link>
				</Button>
			</div>

			<div className="flex flex-wrap gap-3">
				<div className="relative max-w-xs flex-1">
					<Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
					<Input
						placeholder="Search name, email, phone…"
						className="pl-9"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<Select
					value={status}
					onValueChange={(v) => setStatus(v as typeof status)}
				>
					<SelectTrigger className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						<SelectItem value="active">Active</SelectItem>
						<SelectItem value="inactive">Inactive</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<Card className="py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-muted-foreground py-10 text-center"
								>
									No customers found.
								</TableCell>
							</TableRow>
						) : (
							filtered.map((c) => (
								<TableRow key={c.id} className="cursor-pointer">
									<TableCell className="font-medium">
										<Link
											to="/customers/$customerId"
											params={{ customerId: c.id }}
											className="hover:underline"
										>
											{c.name}
											{c.companyName ? (
												<span className="text-muted-foreground">
													{" "}
													· {c.companyName}
												</span>
											) : null}
										</Link>
									</TableCell>
									<TableCell className="capitalize">{c.type}</TableCell>
									<TableCell>{c.email || "—"}</TableCell>
									<TableCell>{c.phone || "—"}</TableCell>
									<TableCell>
										<StatusBadge status={c.status} />
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
}
