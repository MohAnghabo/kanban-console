import { createFileRoute } from "@tanstack/react-router";

import { KanbanConsoleMock } from "../components/KanbanConsoleMock";
import { SidebarProvider } from "../components/ui/sidebar";

function KanbanRouteView() {
  return (
    <SidebarProvider defaultOpen={false}>
      <KanbanConsoleMock />
    </SidebarProvider>
  );
}

export const Route = createFileRoute("/kanban")({
  component: KanbanRouteView,
});
