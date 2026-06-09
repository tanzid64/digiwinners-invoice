import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
	AlertTriangle,
	Bell,
	CheckCheck,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { fmtDate } from "#/lib/format.ts";
import {
	deleteNotification,
	generateNotifications,
	listNotifications,
	markAllRead,
	markRead,
} from "#/lib/server/notifications.ts";

export const Route = createFileRoute("/_app/notifications/")({
	loader: () => listNotifications(),
	component: Notifications,
});

const ICON: Record<string, typeof Bell> = {
	invoice_due: Bell,
	invoice_overdue: AlertTriangle,
	payment_received: CheckCheck,
	project_completion: CheckCheck,
};

function Notifications() {
	const rows = Route.useLoaderData();
	const router = useRouter();
	const unread = rows.filter((r) => !r.read).length;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
					<p className="text-muted-foreground">{unread} unread</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={async () => {
							await generateNotifications();
							router.invalidate();
						}}
					>
						<RefreshCw className="size-4" /> Scan invoices
					</Button>
					<Button
						variant="outline"
						onClick={async () => {
							await markAllRead();
							router.invalidate();
						}}
					>
						<CheckCheck className="size-4" /> Mark all read
					</Button>
				</div>
			</div>

			<Card>
				<CardContent className="p-0">
					{rows.length === 0 ? (
						<p className="text-muted-foreground py-12 text-center">
							No notifications. Use “Scan invoices” to detect due & overdue
							invoices.
						</p>
					) : (
						<ul className="divide-y">
							{rows.map((n) => {
								const Icon = ICON[n.type] ?? Bell;
								return (
									<li
										key={n.id}
										className={`flex items-start gap-3 p-4 ${n.read ? "" : "bg-accent/40"}`}
									>
										<Icon
											className={`mt-0.5 size-5 shrink-0 ${
												n.type === "invoice_overdue"
													? "text-destructive"
													: "text-primary"
											}`}
										/>
										<div className="min-w-0 flex-1">
											<p className="font-medium">{n.title}</p>
											{n.message ? (
												<p className="text-muted-foreground text-sm">
													{n.message}
												</p>
											) : null}
											<p className="text-muted-foreground text-xs">
												{fmtDate(n.createdAt)}
												{n.relatedEntityType === "invoice" &&
												n.relatedEntityId ? (
													<>
														{" · "}
														<Link
															to="/invoices/$invoiceId"
															params={{ invoiceId: n.relatedEntityId }}
															className="hover:underline"
														>
															View invoice
														</Link>
													</>
												) : null}
											</p>
										</div>
										<div className="flex gap-1">
											{!n.read && (
												<Button
													variant="ghost"
													size="sm"
													onClick={async () => {
														await markRead({ data: n.id });
														router.invalidate();
													}}
												>
													Read
												</Button>
											)}
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={async () => {
													await deleteNotification({ data: n.id });
													router.invalidate();
												}}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
