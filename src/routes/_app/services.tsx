import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, Wrench, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "#/components/empty-state.tsx";
import { PageHeader } from "#/components/page-header.tsx";
import { StatusBadge } from "#/components/status-badge.tsx";
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
import { Switch } from "#/components/ui/switch.tsx";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { formatMoney, fromCents, toCents } from "#/lib/money.ts";
import {
	createCategory,
	createService,
	deleteCategory,
	deleteService,
	listCategories,
	listServices,
	updateService,
} from "#/lib/server/services.ts";

export const Route = createFileRoute("/_app/services")({
	loader: async () => ({
		categories: await listCategories(),
		services: await listServices(),
	}),
	component: ServicesPage,
});

type ServiceRow = Awaited<ReturnType<typeof listServices>>[number];

const emptyService = {
	id: "",
	name: "",
	categoryId: "",
	price: "",
	description: "",
	deliverables: "",
	active: true,
};

function ServicesPage() {
	const { categories, services } = Route.useLoaderData();
	const router = useRouter();
	const [catName, setCatName] = useState("");
	const [form, setForm] = useState({ ...emptyService });
	const [busy, setBusy] = useState(false);

	const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
		setForm((p) => ({ ...p, [k]: v }));
	const editing = form.id !== "";

	async function addCategory() {
		if (!catName.trim()) return;
		await createCategory({ data: { name: catName } });
		setCatName("");
		toast.success("Category added");
		router.invalidate();
	}

	function editService(s: ServiceRow) {
		setForm({
			id: s.id,
			name: s.name,
			categoryId: s.categoryId ?? "",
			price: String(fromCents(s.unitPrice)),
			description: s.description ?? "",
			deliverables: s.deliverables ?? "",
			active: s.active,
		});
	}

	async function submitService() {
		if (!form.name.trim()) return;
		setBusy(true);
		try {
			const payload = {
				name: form.name,
				categoryId: form.categoryId || null,
				unitPrice: toCents(form.price || "0"),
				description: form.description || null,
				deliverables: form.deliverables || null,
				active: form.active,
			};
			if (editing) {
				await updateService({ data: { ...payload, id: form.id } });
			} else {
				await createService({ data: payload });
			}
			setForm({ ...emptyService });
			toast.success(editing ? "Service updated" : "Service added");
			router.invalidate();
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Service Catalog"
				description="Reusable services and categories for quotations, orders, and invoices."
			/>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Categories */}
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>Categories</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-2">
							<Input
								placeholder="New category"
								value={catName}
								onChange={(e) => setCatName(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && addCategory()}
							/>
							<Button size="icon" onClick={addCategory}>
								<Plus className="size-4" />
							</Button>
						</div>
						{categories.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No categories yet.
							</p>
						) : (
							<ul className="divide-y">
								{categories.map((c) => (
									<li
										key={c.id}
										className="flex items-center justify-between py-2"
									>
										<span>{c.name}</span>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={async () => {
												await deleteCategory({ data: c.id });
												toast.success("Category deleted");
												router.invalidate();
											}}
										>
											<Trash2 className="size-4" />
										</Button>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				{/* Service editor */}
				<Card className="lg:col-span-2">
					<CardHeader className="flex-row items-center justify-between">
						<CardTitle>{editing ? "Edit service" : "Add service"}</CardTitle>
						{editing && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setForm({ ...emptyService })}
							>
								<X className="size-4" /> Cancel
							</Button>
						)}
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>Name *</Label>
							<Input
								value={form.name}
								onChange={(e) => set("name", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Category</Label>
							<Select
								value={form.categoryId || "none"}
								onValueChange={(v) => set("categoryId", v === "none" ? "" : v)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Uncategorized" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Uncategorized</SelectItem>
									{categories.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Default price (USD)</Label>
							<Input
								type="number"
								min="0"
								step="0.01"
								value={form.price}
								onChange={(e) => set("price", e.target.value)}
							/>
						</div>
						<div className="flex items-end gap-2 pb-2">
							<Switch
								checked={form.active}
								onCheckedChange={(v) => set("active", v)}
							/>
							<Label>Active</Label>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label>Description</Label>
							<Textarea
								rows={2}
								value={form.description}
								onChange={(e) => set("description", e.target.value)}
							/>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label>Deliverables</Label>
							<Textarea
								rows={2}
								value={form.deliverables}
								onChange={(e) => set("deliverables", e.target.value)}
							/>
						</div>
						<div className="sm:col-span-2">
							<Button onClick={submitService} disabled={busy}>
								{busy ? "Saving…" : editing ? "Save changes" : "Add service"}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Service</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Price</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{services.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="p-0">
									<EmptyState
										icon={Wrench}
										title="No services yet"
										description="Add reusable services to speed up quotations and invoices."
									/>
								</TableCell>
							</TableRow>
						) : (
							services.map((s) => (
								<TableRow key={s.id}>
									<TableCell className="font-medium">{s.name}</TableCell>
									<TableCell>{s.categoryName || "—"}</TableCell>
									<TableCell>{formatMoney(s.unitPrice)}</TableCell>
									<TableCell>
										<StatusBadge status={s.active ? "active" : "inactive"} />
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => editService(s)}
										>
											<Pencil className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={async () => {
												await deleteService({ data: s.id });
												toast.success("Service deleted");
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
