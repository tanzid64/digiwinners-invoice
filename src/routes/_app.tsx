import {
	createFileRoute,
	Link,
	Outlet,
	useRouter,
	useRouterState,
} from "@tanstack/react-router";
import {
	BarChart3,
	Bell,
	ChevronsUpDown,
	FileArchive,
	FileText,
	FolderKanban,
	LayoutDashboard,
	LogOut,
	Monitor,
	Moon,
	Package,
	Receipt,
	Search,
	Sun,
	Users,
	Wallet,
	Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar.tsx";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#/components/ui/breadcrumb.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Separator } from "#/components/ui/separator.tsx";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarRail,
	SidebarTrigger,
} from "#/components/ui/sidebar.tsx";
import { signOut } from "#/lib/auth-client.ts";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

const NAV_GROUPS = [
	{
		label: "Overview",
		items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
	},
	{
		label: "Sales",
		items: [
			{ to: "/customers", label: "Customers", icon: Users },
			{ to: "/services", label: "Services", icon: Wrench },
			{ to: "/quotations", label: "Quotations", icon: FileText },
			{ to: "/orders", label: "Orders", icon: Package },
			{ to: "/projects", label: "Projects", icon: FolderKanban },
		],
	},
	{
		label: "Billing",
		items: [
			{ to: "/invoices", label: "Invoices", icon: Receipt },
			{ to: "/payments", label: "Payments", icon: Wallet },
		],
	},
	{
		label: "Insights",
		items: [
			{ to: "/reports", label: "Reports", icon: BarChart3 },
			{ to: "/documents", label: "Documents", icon: FileArchive },
		],
	},
] as const;

const TITLES: Record<string, string> = {
	dashboard: "Dashboard",
	customers: "Customers",
	services: "Services",
	quotations: "Quotations",
	orders: "Orders",
	projects: "Projects",
	invoices: "Invoices",
	payments: "Payments",
	reports: "Reports",
	documents: "Documents",
	notifications: "Notifications",
	search: "Search",
	new: "New",
	edit: "Edit",
};

function AppLayout() {
	const pathname = useRouterState({
		select: (s) => s.location.pathname,
	});

	return (
		<SidebarProvider>
			<AppSidebar pathname={pathname} />
			<SidebarInset>
				<AppHeader pathname={pathname} />
				<main className="flex-1 p-4 md:p-6 lg:p-8">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

function AppSidebar({ pathname }: { pathname: string }) {
	const ctx = Route.useRouteContext() as {
		session?: { user?: { name?: string; email?: string } };
	};
	const user = ctx.session?.user;
	const router = useRouter();

	async function handleSignOut() {
		await signOut();
		await router.navigate({ to: "/login" });
	}

	const initials = (user?.name ?? user?.email ?? "U")
		.split(" ")
		.map((s) => s[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link to="/dashboard">
								<div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
									<Receipt className="size-4" />
								</div>
								<div className="grid flex-1 text-left leading-tight">
									<span className="truncate font-semibold">DigiWinners</span>
									<span className="text-muted-foreground truncate text-xs">
										IT Services
									</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{NAV_GROUPS.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarMenu>
							{group.items.map((item) => (
								<SidebarMenuItem key={item.to}>
									<SidebarMenuButton
										asChild
										isActive={pathname.startsWith(item.to)}
										tooltip={item.label}
									>
										<Link to={item.to}>
											<item.icon />
											<span>{item.label}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton size="lg">
									<Avatar className="size-8 rounded-lg">
										<AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground rounded-lg text-xs">
											{initials}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left leading-tight">
										<span className="truncate font-medium">
											{user?.name ?? "Account"}
										</span>
										<span className="text-muted-foreground truncate text-xs">
											{user?.email}
										</span>
									</div>
									<ChevronsUpDown className="ml-auto size-4" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top" align="start" className="w-56">
								<DropdownMenuLabel className="truncate">
									{user?.email}
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleSignOut}>
									<LogOut className="size-4" /> Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}

function AppHeader({ pathname }: { pathname: string }) {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const segments = pathname.split("/").filter(Boolean);
	const crumbs = segments
		.map((s) => TITLES[s] ?? null)
		.filter(Boolean) as string[];

	return (
		<header className="bg-background/80 sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur print:hidden">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mr-1 h-5" />
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage className="text-muted-foreground">
							DigiWinners
						</BreadcrumbPage>
					</BreadcrumbItem>
					{crumbs.slice(0, 1).map((c) => (
						<span key={c} className="flex items-center gap-2">
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{c}</BreadcrumbPage>
							</BreadcrumbItem>
						</span>
					))}
				</BreadcrumbList>
			</Breadcrumb>

			<form
				className="relative ml-auto hidden sm:block sm:w-56 lg:w-72"
				onSubmit={(e) => {
					e.preventDefault();
					router.navigate({ to: "/search", search: { q: query } });
				}}
			>
				<Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
				<Input
					placeholder="Search everything…"
					className="bg-muted/50 h-9 pl-9"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</form>

			<ThemeToggle />

			<Button asChild variant="ghost" size="icon" className="ml-1">
				<Link to="/notifications">
					<Bell className="size-5" />
				</Link>
			</Button>
		</header>
	);
}

function ThemeToggle() {
	const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

	useEffect(() => {
		const stored = localStorage.getItem("theme") as typeof theme | null;
		if (stored) setTheme(stored);
	}, []);

	useEffect(() => {
		const root = document.documentElement;
		const isDark =
			theme === "dark" ||
			(theme === "system" &&
				window.matchMedia("(prefers-color-scheme: dark)").matches);
		root.classList.toggle("dark", isDark);
		if (theme === "system") localStorage.removeItem("theme");
		else localStorage.setItem("theme", theme);
	}, [theme]);

	const next =
		theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
	const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => setTheme(next)}
			title={`Theme: ${theme}`}
		>
			<Icon className="size-5" />
		</Button>
	);
}
