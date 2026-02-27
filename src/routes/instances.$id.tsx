import { createFileRoute, Outlet } from "@tanstack/react-router";
import Sidebar from "../components/Sidebar";

export const Route = createFileRoute("/instances/$id")({
	component: InstanceLayout,
});

function InstanceLayout() {
	return (
		<div className="flex h-[calc(100vh-64px)] overflow-hidden">
			<Sidebar />
			<main className="flex-1 overflow-auto bg-background">
				<Outlet />
			</main>
		</div>
	);
}
