import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "#/components/module-placeholder.tsx";

export const Route = createFileRoute("/_app/quotations")({
	component: () => <ModulePlaceholder title="Quotations" phase="Phase 3" />,
});
