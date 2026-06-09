import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "#/components/module-placeholder.tsx";

export const Route = createFileRoute("/_app/orders")({
	component: () => <ModulePlaceholder title="Orders" phase="Phase 3" />,
});
