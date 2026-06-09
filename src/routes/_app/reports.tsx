import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "#/components/module-placeholder.tsx";

export const Route = createFileRoute("/_app/reports")({
	component: () => <ModulePlaceholder title="Reports" phase="Phase 5" />,
});
