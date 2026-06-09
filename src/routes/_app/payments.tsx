import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "#/components/module-placeholder.tsx";

export const Route = createFileRoute("/_app/payments")({
	component: () => <ModulePlaceholder title="Payments" phase="Phase 3" />,
});
