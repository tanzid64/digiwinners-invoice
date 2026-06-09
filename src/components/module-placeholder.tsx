import { Card, CardContent } from "#/components/ui/card.tsx";

export function ModulePlaceholder({
	title,
	phase,
}: {
	title: string;
	phase: string;
}) {
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
			<Card>
				<CardContent className="text-muted-foreground py-12 text-center">
					{title} module arrives in {phase}.
				</CardContent>
			</Card>
		</div>
	);
}
