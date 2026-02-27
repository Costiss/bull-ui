import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Layers, Pause, Play, RefreshCw, Trash2, Users } from "lucide-react";
import {
	getContext,
	trpcClient,
} from "../integrations/tanstack-query/root-provider";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/instances/$id")({
	component: InstanceDetails,
});

function InstanceDetails() {
	const { id } = Route.useParams();
	const { data: session } = authClient.useSession();
	const { trpc, queryClient } = getContext();

	const {
		data: queues,
		isLoading,
		refetch,
		isRefetching,
	} = useQuery(trpc.bullmq.getQueues.queryOptions({ instanceId: Number(id) }));

	const controlQueue = useMutation({
		mutationFn: (input: {
			instanceId: number;
			queueName: string;
			action: "pause" | "resume" | "clean";
		}) => trpcClient.bullmq.controlQueue.mutate(input),
		onSuccess: () =>
			queryClient.invalidateQueries(
				trpc.bullmq.getQueues.queryFilter({ instanceId: Number(id) }),
			),
	});

	if (!session?.user) return <div>Unauthorized</div>;

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6 md:p-12">
			<div className="max-w-5xl mx-auto space-y-8">
				<header className="flex justify-between items-center">
					<div className="flex items-center gap-4">
						<div className="p-2 bg-slate-700 rounded-lg">
							<Layers className="text-cyan-400" size={24} />
						</div>
						<h1 className="text-3xl font-bold">Queues</h1>
					</div>
					<button
						type="button"
						onClick={() => refetch()}
						className={`p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all ${isRefetching ? "animate-spin" : ""}`}
					>
						<RefreshCw size={20} />
					</button>
				</header>

				{isLoading ? (
					<div className="text-center py-12 text-slate-400">
						Loading queues...
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{queues?.map((queue) => (
							<div
								key={queue.name}
								className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl"
							>
								<div className="p-6 border-b border-slate-700 flex justify-between items-center">
									<h3 className="text-xl font-bold">{queue.name}</h3>
									<div className="flex gap-2">
										<button
											type="button"
											title={queue.isPaused ? "Resume" : "Pause"}
											onClick={() =>
												controlQueue.mutate({
													instanceId: Number(id),
													queueName: queue.name,
													action: queue.isPaused ? "resume" : "pause",
												})
											}
											className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-slate-300"
										>
											{queue.isPaused ? (
												<Play size={16} />
											) : (
												<Pause size={16} />
											)}
										</button>
										<button
											type="button"
											title="Clean Completed"
											onClick={() =>
												controlQueue.mutate({
													instanceId: Number(id),
													queueName: queue.name,
													action: "clean",
												})
											}
											className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-slate-300"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
								<div className="p-6 grid grid-cols-2 gap-4">
									<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
										<p className="text-xs text-slate-500 uppercase font-bold mb-1">
											Waiting
										</p>
										<p className="text-2xl font-mono text-cyan-400">
											{queue.counts.waiting}
										</p>
									</div>
									<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
										<p className="text-xs text-slate-500 uppercase font-bold mb-1">
											Active
										</p>
										<p className="text-2xl font-mono text-yellow-400">
											{queue.counts.active}
										</p>
									</div>
									<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
										<p className="text-xs text-slate-500 uppercase font-bold mb-1">
											Completed
										</p>
										<p className="text-2xl font-mono text-green-400">
											{queue.counts.completed}
										</p>
									</div>
									<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
										<p className="text-xs text-slate-500 uppercase font-bold mb-1">
											Failed
										</p>
										<p className="text-2xl font-mono text-red-400">
											{queue.counts.failed}
										</p>
									</div>
								</div>
								<div className="px-6 pb-6 space-y-3">
									<div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
										<Users size={14} className="text-slate-500" />
										<span>{queue.workers.length} Workers Active</span>
									</div>
									{queue.workers.length > 0 && (
										<div className="flex flex-wrap gap-2">
											{queue.workers.map((worker) => (
												<div
													key={worker.id}
													className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-slate-400"
													title={worker.id}
												>
													{worker.name || worker.id.slice(0, 8)}
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						))}

						{queues?.length === 0 && (
							<div className="col-span-full text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed text-slate-400">
								No BullMQ queues found in this instance.
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
