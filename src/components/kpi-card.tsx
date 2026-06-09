import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { cn } from "#/lib/utils.ts";

const TONES = {
	primary: "bg-primary/10 text-primary",
	success: "bg-emerald-500/10 text-emerald-600",
	warning: "bg-amber-500/10 text-amber-600",
	danger: "bg-destructive/10 text-destructive",
	info: "bg-sky-500/10 text-sky-600",
} as const;

export function KpiCard({
	label,
	value,
	icon: Icon,
	sub,
	tone = "primary",
}: {
	label: string;
	value: string | number;
	icon?: LucideIcon;
	sub?: ReactNode;
	tone?: keyof typeof TONES;
}) {
	return (
		<Card className="py-0">
			<CardContent className="flex items-center gap-4 p-5">
				{Icon ? (
					<div
						className={cn(
							"flex size-11 shrink-0 items-center justify-center rounded-xl",
							TONES[tone],
						)}
					>
						<Icon className="size-5" />
					</div>
				) : null}
				<div className="min-w-0">
					<p className="text-muted-foreground text-sm">{label}</p>
					<p className="mt-0.5 truncate text-2xl font-bold tabular-nums">
						{value}
					</p>
					{sub ? <div className="mt-1 text-xs">{sub}</div> : null}
				</div>
			</CardContent>
		</Card>
	);
}
