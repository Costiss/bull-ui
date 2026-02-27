import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
	Activity,
	AlertCircle,
	ChevronDown,
	ChevronRight,
	Layers,
} from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "src/components/ui/scroll-area";
import { getContext } from "../integrations/tanstack-query/root-provider";

function QueueJobs({
	instanceId,
	queueName,
}: {
	instanceId: number;
	queueName: string;
}) {
	const { trpc } = getContext();

	const { data: activeJobs } = useQuery(
		trpc.bullmq.getJobs.queryOptions({
			instanceId,
			queueName,
			state: "active",
			limit: 5,
		}),
	);

	const { data: failedJobs } = useQuery(
		trpc.bullmq.getJobs.queryOptions({
			instanceId,
			queueName,
			state: "failed",
			limit: 5,
		}),
	);

	if (!activeJobs?.length && !failedJobs?.length) {
		return null;
	}

	return (
		<div className="pl-9 pr-3 py-1 space-y-2">
			{activeJobs && activeJobs.length > 0 && (
				<div className="space-y-1">
					<div className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wider">
						<Activity className="h-3 w-3" />
						Active
					</div>
					{activeJobs.map((job) => (
						<Link
							key={job.id}
							to="/instances/$id/queues/$queue/jobs/$jobId"
							params={{
								id: String(instanceId),
								queue: queueName,
								jobId: job.id || "",
							}}
							className="block text-[11px] truncate text-muted-foreground hover:text-primary transition-colors pl-4 border-l border-muted-foreground/20"
							activeProps={{
								className:
									"block text-[11px] truncate text-primary font-bold pl-4 border-l-2 border-primary",
							}}
						>
							{job.name || job.id}
						</Link>
					))}
				</div>
			)}
			{failedJobs && failedJobs.length > 0 && (
				<div className="space-y-1">
					<div className="flex items-center gap-1.5 text-[10px] font-bold text-destructive uppercase tracking-wider">
						<AlertCircle className="h-3 w-3" />
						Failed
					</div>
					{failedJobs.map((job) => (
						<Link
							key={job.id}
							to="/instances/$id/queues/$queue/jobs/$jobId"
							params={{
								id: String(instanceId),
								queue: queueName,
								jobId: job.id || "",
							}}
							className="block text-[11px] truncate text-muted-foreground hover:text-destructive transition-colors pl-4 border-l border-destructive/20"
							activeProps={{
								className:
									"block text-[11px] truncate text-destructive font-bold pl-4 border-l-2 border-destructive",
							}}
						>
							{job.name || job.id}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

export default function Sidebar() {
	const params = useParams({
		strict: false,
	}) as { id?: string; queue?: string };
	const id = params.id;
	const activeQueueName = params.queue;
	const { trpc } = getContext();
	const [expandedQueues, setExpandedQueues] = useState<Record<string, boolean>>(
		{},
	);

	const { data: queues } = useQuery(
		trpc.bullmq.getQueues.queryOptions({ instanceId: Number(id) }),
	);

	const toggleExpand = (queueName: string, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setExpandedQueues((prev) => ({
			...prev,
			[queueName]: !prev[queueName],
		}));
	};

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
					{queues?.map((queue) => {
						const isExpanded =
							expandedQueues[queue.name] || activeQueueName === queue.name;
						return (
							<div key={queue.name} className="space-y-1">
								<div className="group flex items-center gap-1">
									<button
										type="button"
										onClick={(e) => toggleExpand(queue.name, e)}
										className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
									>
										{isExpanded ? (
											<ChevronDown className="h-4 w-4" />
										) : (
											<ChevronRight className="h-4 w-4" />
										)}
									</button>
									<Link
										to="/instances/$id/queues/$queue"
										params={{ id: id || "", queue: queue.name }}
										className="flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted flex-1 min-w-0"
										activeProps={{
											className:
												"flex items-center gap-3 px-2 py-2 rounded-md text-sm font-bold bg-primary/10 text-primary transition-colors hover:bg-primary/20 flex-1 min-w-0",
										}}
									>
										<span className="truncate flex-1">{queue.name}</span>
										<span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-mono">
											{queue.counts.active + queue.counts.waiting}
										</span>
									</Link>
								</div>
								{isExpanded && (
									<QueueJobs instanceId={Number(id)} queueName={queue.name} />
								)}
							</div>
						);
					})}
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
