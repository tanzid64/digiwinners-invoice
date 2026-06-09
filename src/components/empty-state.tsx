import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
}: {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
			{Icon ? (
				<div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
					<Icon className="size-6" />
				</div>
			) : null}
			<div className="space-y-1">
				<p className="font-medium">{title}</p>
				{description ? (
					<p className="text-muted-foreground mx-auto max-w-sm text-sm">
						{description}
					</p>
				) : null}
			</div>
			{action ? <div className="mt-1">{action}</div> : null}
		</div>
	);
}
