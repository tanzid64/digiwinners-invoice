import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "#/components/module-placeholder.tsx";

export const Route = createFileRoute("/_app/projects")({
	component: () => <ModulePlaceholder title="Projects" phase="Phase 4" />,
});
