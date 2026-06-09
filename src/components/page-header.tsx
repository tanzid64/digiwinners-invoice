import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button.tsx";

export function PageHeader({
	title,
	description,
	actions,
	backTo,
	backParams,
}: {
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
	// biome-ignore lint/suspicious/noExplicitAny: generic back-link target
	backTo?: any;
	// biome-ignore lint/suspicious/noExplicitAny: route params vary
	backParams?: any;
}) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-3">
			<div className="flex items-center gap-3">
				{backTo ? (
					<Button asChild variant="ghost" size="icon" className="shrink-0">
						<Link to={backTo} params={backParams}>
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
				) : null}
				<div>
					<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
					{description ? (
						<p className="text-muted-foreground mt-0.5 text-sm">
							{description}
						</p>
					) : null}
				</div>
			</div>
			{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
		</div>
	);
}
