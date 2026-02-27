import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { ScrollArea } from "src/components/ui/scroll-area";
import { getContext } from "../integrations/tanstack-query/root-provider";

export default function Sidebar() {
	const { id } = useParams({ from: "/instances/$id" });
	const { trpc } = getContext();

	const { data: queues } = useQuery(
		trpc.bullmq.getQueues.queryOptions({ instanceId: Number(id) }),
	);

	return (
		<div className="flex flex-col h-full border-r bg-muted/30 w-64 hidden md:flex">
			<div className="p-6 border-b">
				<h2 className="text-lg font-semibold flex items-center gap-2">
					<Layers className="h-5 w-5 text-primary" />
					Queues
				</h2>
			</div>
			<ScrollArea className="flex-1 px-3 py-4">
				<div className="space-y-1">
					{queues?.map((queue) => (
						<div key={queue.name} className="space-y-1">
							<Link
								to="/instances/$id/queues/$queue"
								params={{ id: id || "", queue: queue.name }}
								className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted"
								activeProps={{
									className:
										"flex items-center gap-3 px-3 py-2 rounded-md text-sm font-bold bg-primary/10 text-primary transition-colors hover:bg-primary/20",
								}}
							>
								<span className="truncate flex-1">{queue.name}</span>
								<span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-mono">
									{queue.counts.active + queue.counts.waiting}
								</span>
							</Link>
						</div>
					))}
					{queues?.length === 0 && (
						<p className="px-3 py-2 text-sm text-muted-foreground italic">
							No queues found
						</p>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
