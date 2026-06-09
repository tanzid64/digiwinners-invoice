import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
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
import { Label } from "#/components/ui/label.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { fmtDate } from "#/lib/format.ts";
import {
	addDelivery,
	addMilestone,
	deleteDelivery,
	deleteMilestone,
	deleteProject,
	getProject,
	toggleMilestone,
	updateProject,
} from "#/lib/server/projects.ts";
import { ProgressBar } from "#/routes/_app/projects/index.tsx";

export const Route = createFileRoute("/_app/projects/$projectId")({
	loader: ({ params }) => getProject({ data: params.projectId }),
	component: ProjectDetail,
});

const STATUSES = [
	"not_started",
	"in_progress",
	"on_hold",
	"completed",
	"cancelled",
] as const;

function toDateInput(d: Date | string | number | null | undefined) {
	if (!d) return "";
	return new Date(d).toISOString().slice(0, 10);
}

function ProjectDetail() {
	const data = Route.useLoaderData();
	const router = useRouter();

	const [status, setStatus] = useState(data?.project.status ?? "not_started");
	const [progress, setProgress] = useState(data?.project.progress ?? 0);
	const [start, setStart] = useState(toDateInput(data?.project.startDate));
	const [end, setEnd] = useState(toDateInput(data?.project.endDate));
	const [notes, setNotes] = useState(data?.project.notes ?? "");
	const [saving, setSaving] = useState(false);

	if (!data) return <p>Project not found.</p>;
	const { project: p, milestones, deliveries, order } = data;

	async function save() {
		setSaving(true);
		try {
			await updateProject({
				data: {
					id: p.id,
					status,
					progress,
					startDate: start ? new Date(start).getTime() : null,
					endDate: end ? new Date(end).getTime() : null,
					notes,
				},
			});
			toast.success("Project updated");
			router.invalidate();
		} finally {
			setSaving(false);
		}
	}
	async function remove() {
		if (!confirm(`Delete project ${p.name}?`)) return;
		await deleteProject({ data: p.id });
		toast.success("Project deleted");
		await router.navigate({ to: "/projects" });
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button asChild variant="ghost" size="icon">
						<Link to="/projects">
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight">{p.name}</h1>
						<StatusBadge status={p.status} />
					</div>
				</div>
				<div className="flex gap-2">
					{order ? (
						<Button asChild variant="outline">
							<Link to="/orders/$orderId" params={{ orderId: order.id }}>
								Order {order.number}
							</Link>
						</Button>
					) : null}
					<Button variant="destructive" size="icon" onClick={remove}>
						<Trash2 className="size-4" />
					</Button>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>Status & progress</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<ProgressBar value={p.progress} />
						<div className="space-y-2">
							<Label>Status</Label>
							<Select
								value={status}
								onValueChange={(v) => setStatus(v as typeof status)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{STATUSES.map((s) => (
										<SelectItem key={s} value={s} className="capitalize">
											{s.replace("_", " ")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Progress: {progress}%</Label>
							<Input
								type="range"
								min="0"
								max="100"
								step="5"
								value={progress}
								onChange={(e) => setProgress(Number(e.target.value))}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label>Start</Label>
								<Input
									type="date"
									value={start}
									onChange={(e) => setStart(e.target.value)}
								/>
							</div>
							<div className="space-y-1">
								<Label>End</Label>
								<Input
									type="date"
									value={end}
									onChange={(e) => setEnd(e.target.value)}
								/>
							</div>
						</div>
						<div className="space-y-1">
							<Label>Notes / update</Label>
							<Textarea
								rows={3}
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</div>
						<Button className="w-full" onClick={save} disabled={saving}>
							{saving ? "Saving…" : "Save update"}
						</Button>
					</CardContent>
				</Card>

				<div className="space-y-6 lg:col-span-2">
					<Milestones
						projectId={p.id}
						items={milestones}
						onChange={() => router.invalidate()}
					/>
					<Deliveries
						projectId={p.id}
						items={deliveries}
						onChange={() => router.invalidate()}
					/>
				</div>
			</div>
		</div>
	);
}

function Milestones({
	projectId,
	items,
	onChange,
}: {
	projectId: string;
	items: {
		id: string;
		title: string;
		description: string | null;
		dueDate: Date | null;
		completed: boolean;
	}[];
	onChange: () => void;
}) {
	const [title, setTitle] = useState("");
	const [due, setDue] = useState("");
	const done = items.filter((m) => m.completed).length;

	async function add() {
		if (!title.trim()) return;
		await addMilestone({
			data: {
				projectId,
				title,
				dueDate: due ? new Date(due).getTime() : null,
			},
		});
		setTitle("");
		setDue("");
		onChange();
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					Milestones ({done}/{items.length})
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-2">
					<Input
						className="flex-1"
						placeholder="Milestone title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
					<Input
						type="date"
						className="w-40"
						value={due}
						onChange={(e) => setDue(e.target.value)}
					/>
					<Button onClick={add}>
						<Plus className="size-4" /> Add
					</Button>
				</div>
				{items.length === 0 ? (
					<p className="text-muted-foreground text-sm">No milestones.</p>
				) : (
					<ul className="divide-y">
						{items.map((m) => (
							<li key={m.id} className="flex items-center gap-3 py-2">
								<Button
									variant={m.completed ? "default" : "outline"}
									size="icon-sm"
									onClick={async () => {
										await toggleMilestone({
											data: { id: m.id, completed: !m.completed },
										});
										onChange();
									}}
								>
									<Check className="size-4" />
								</Button>
								<div className="min-w-0 flex-1">
									<p
										className={`font-medium ${m.completed ? "text-muted-foreground line-through" : ""}`}
									>
										{m.title}
									</p>
									{m.dueDate ? (
										<p className="text-muted-foreground text-xs">
											Due {fmtDate(m.dueDate)}
										</p>
									) : null}
								</div>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={async () => {
										await deleteMilestone({ data: m.id });
										onChange();
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
	);
}

function Deliveries({
	projectId,
	items,
	onChange,
}: {
	projectId: string;
	items: {
		id: string;
		title: string;
		description: string | null;
		deliveredAt: Date;
		notes: string | null;
	}[];
	onChange: () => void;
}) {
	const [title, setTitle] = useState("");

	async function add() {
		if (!title.trim()) return;
		await addDelivery({ data: { projectId, title } });
		setTitle("");
		onChange();
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Deliveries ({items.length})</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex gap-2">
					<Input
						placeholder="Delivery record (e.g. v1 deployed)"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
					<Button onClick={add}>
						<Plus className="size-4" /> Log
					</Button>
				</div>
				{items.length === 0 ? (
					<p className="text-muted-foreground text-sm">No deliveries logged.</p>
				) : (
					<ul className="divide-y">
						{items.map((d) => (
							<li key={d.id} className="flex items-center justify-between py-2">
								<div>
									<p className="font-medium">{d.title}</p>
									<p className="text-muted-foreground text-xs">
										{fmtDate(d.deliveredAt)}
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={async () => {
										await deleteDelivery({ data: d.id });
										onChange();
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
	);
}
