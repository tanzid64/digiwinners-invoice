import {
	createFileRoute,
	Link,
	Outlet,
	useRouter,
} from "@tanstack/react-router";
import {
	BarChart3,
	FileText,
	FolderKanban,
	LayoutDashboard,
	LogOut,
	Menu,
	Package,
	Receipt,
	Users,
	Wallet,
	Wrench,
} from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button.tsx";
import { signOut } from "#/lib/auth-client.ts";
import { cn } from "#/lib/utils.ts";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

const NAV = [
	{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ to: "/customers", label: "Customers", icon: Users },
	{ to: "/services", label: "Services", icon: Wrench },
	{ to: "/quotations", label: "Quotations", icon: FileText },
	{ to: "/orders", label: "Orders", icon: Package },
	{ to: "/projects", label: "Projects", icon: FolderKanban },
	{ to: "/invoices", label: "Invoices", icon: Receipt },
	{ to: "/payments", label: "Payments", icon: Wallet },
	{ to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

function AppLayout() {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	async function handleSignOut() {
		await signOut();
		await router.navigate({ to: "/login" });
	}

	return (
		<div className="flex min-h-svh">
			{/* Sidebar */}
			<aside
				className={cn(
					"bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r transition-transform md:translate-x-0",
					open ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="flex h-16 items-center gap-2 border-b px-5">
					<img
						src="/logo/digiwinners.png"
						alt="DigiWinners"
						className="h-8 w-auto"
					/>
				</div>
				<nav className="flex-1 space-y-1 overflow-y-auto p-3">
					{NAV.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							onClick={() => setOpen(false)}
							className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
							activeProps={{
								className:
									"!bg-sidebar-primary !text-sidebar-primary-foreground hover:!bg-sidebar-primary",
							}}
						>
							<item.icon className="size-4 shrink-0" />
							{item.label}
						</Link>
					))}
				</nav>
				<div className="border-t p-3">
					<Button
						variant="ghost"
						className="w-full justify-start gap-3 text-sidebar-foreground/80"
						onClick={handleSignOut}
					>
						<LogOut className="size-4" />
						Sign out
					</Button>
				</div>
			</aside>

			{/* Mobile overlay */}
			{open && (
				<button
					type="button"
					aria-label="Close menu"
					className="fixed inset-0 z-30 bg-black/40 md:hidden"
					onClick={() => setOpen(false)}
				/>
			)}

			{/* Main */}
			<div className="flex min-w-0 flex-1 flex-col md:pl-64">
				<header className="bg-background/80 sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 backdrop-blur md:px-8">
					<Button
						variant="ghost"
						size="icon"
						className="md:hidden"
						onClick={() => setOpen(true)}
					>
						<Menu className="size-5" />
					</Button>
					<div className="font-semibold">DigiWinners Console</div>
				</header>
				<main className="flex-1 p-4 md:p-8">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
