import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
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
import { fmtDate } from "#/lib/format.ts";
import { listCustomers } from "#/lib/server/customers.ts";
import {
	createDocument,
	deleteDocument,
	listDocuments,
} from "#/lib/server/documents.ts";

export const Route = createFileRoute("/_app/documents/")({
	loader: async () => ({
		documents: await listDocuments(),
		customers: await listCustomers({ data: {} }),
	}),
	component: Documents,
});

const TYPES = [
	"contract",
	"customer_document",
	"payment_proof",
	"quotation",
	"invoice",
] as const;

function Documents() {
	const { documents, customers } = Route.useLoaderData();
	const router = useRouter();
	const [type, setType] = useState<(typeof TYPES)[number]>("contract");
	const [name, setName] = useState("");
	const [customerId, setCustomerId] = useState("");
	const [busy, setBusy] = useState(false);

	async function add() {
		if (!name.trim()) return;
		setBusy(true);
		try {
			await createDocument({
				data: { type, name, customerId: customerId || null },
			});
			setName("");
			setCustomerId("");
			router.invalidate();
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Documents</h1>
				<p className="text-muted-foreground">
					Register of contracts, customer documents and proofs. File uploads
					(R2) land in a later phase — invoice & quotation PDFs are generated
					from their detail pages.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Add document</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-4">
					<div className="space-y-1">
						<Label>Type</Label>
						<Select
							value={type}
							onValueChange={(v) => setType(v as typeof type)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TYPES.map((t) => (
									<SelectItem key={t} value={t} className="capitalize">
										{t.replace("_", " ")}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1 sm:col-span-2">
						<Label>Name</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div className="space-y-1">
						<Label>Customer</Label>
						<Select
							value={customerId || "none"}
							onValueChange={(v) => setCustomerId(v === "none" ? "" : v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="None" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None</SelectItem>
								{customers.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="sm:col-span-4">
						<Button onClick={add} disabled={busy}>
							<Plus className="size-4" /> {busy ? "Adding…" : "Add document"}
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card className="py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Added</TableHead>
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{documents.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-muted-foreground py-10 text-center"
								>
									No documents registered.
								</TableCell>
							</TableRow>
						) : (
							documents.map((d) => (
								<TableRow key={d.id}>
									<TableCell className="font-medium">{d.name}</TableCell>
									<TableCell>
										<Badge variant="muted" className="capitalize">
											{d.type.replace("_", " ")}
										</Badge>
									</TableCell>
									<TableCell>{d.customerName ?? "—"}</TableCell>
									<TableCell>{fmtDate(d.createdAt)}</TableCell>
									<TableCell>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={async () => {
												await deleteDocument({ data: d.id });
												router.invalidate();
											}}
										>
											<Trash2 className="size-4" />
										</Button>
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
