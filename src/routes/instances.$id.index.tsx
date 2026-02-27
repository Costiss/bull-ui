import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Layers, Pause, Play, RefreshCw, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "src/components/ui/alert-dialog";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "src/components/ui/card";
import { Skeleton } from "src/components/ui/skeleton";
import {
	getContext,
	trpcClient,
} from "../integrations/tanstack-query/root-provider";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/instances/$id/")({
	component: InstanceIndex,
});

function InstanceIndex() {
	const { id } = Route.useParams();
	const { data: session } = authClient.useSession();
	const isAdmin = session?.user.role === "admin";
	const { trpc, queryClient } = getContext();
	const navigate = useNavigate();

	const [confirmAction, setConfirmAction] = useState<{
		queueName: string;
		action: "pause" | "resume" | "clean";
	} | null>(null);

	const {
		data: queues,
		isLoading: isQueuesLoading,
		refetch: refetchQueues,
		isRefetching: isQueuesRefetching,
	} = useQuery(trpc.bullmq.getQueues.queryOptions({ instanceId: Number(id) }));

	useEffect(() => {
		const eventSource = new EventSource(`/api/events?instanceId=${id}`);
		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === "metrics") {
					queryClient.setQueryData(
						trpc.bullmq.getQueues.queryKey({ instanceId: Number(id) }),
						data.queues,
					);
				}
			} catch (error) {
				console.error("Error parsing SSE data:", error);
			}
		};
		return () => eventSource.close();
	}, [id, queryClient, trpc.bullmq.getQueues]);

	const controlQueue = useMutation({
		mutationFn: (input: {
			instanceId: number;
			queueName: string;
			action: "pause" | "resume" | "clean";
		}) => trpcClient.bullmq.controlQueue.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.bullmq.getQueues.queryFilter({ instanceId: Number(id) }),
			);
			setConfirmAction(null);
		},
	});

	if (!session?.user)
		return <div className="p-8 text-center">Unauthorized</div>;

	return (
		<div className="min-h-screen bg-background p-6 text-foreground md:p-12">
			<div className="mx-auto max-w-5xl space-y-8">
				<header className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="rounded-lg bg-muted p-2">
							<Layers className="h-6 w-6 text-primary" />
						</div>
						<div className="flex flex-col">
							<h1 className="text-3xl font-bold tracking-tight">Queues</h1>
							<p className="text-sm text-muted-foreground">
								Monitoring BullMQ queues for this instance
							</p>
						</div>
					</div>
					<Button
						variant="outline"
						size="icon"
						onClick={() => refetchQueues()}
						className={isQueuesRefetching ? "animate-spin" : ""}
					>
						<RefreshCw className="h-4 w-4" />
					</Button>
				</header>

				{isQueuesLoading ? (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<Skeleton className="h-[300px] w-full" />
						<Skeleton className="h-[300px] w-full" />
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{queues?.map((queue) => (
							<Card
								key={queue.name}
								className="overflow-hidden transition-all hover:border-primary/50"
							>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<div>
										<CardTitle className="text-xl">{queue.name}</CardTitle>
										<CardDescription className="flex items-center gap-1">
											{queue.isPaused ? (
												<Badge
													variant="secondary"
													className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
												>
													Paused
												</Badge>
											) : (
												<Badge
													variant="secondary"
													className="bg-green-500/10 text-green-600 dark:text-green-400"
												>
													Active
												</Badge>
											)}
										</CardDescription>
									</div>
									{isAdmin && (
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon"
												title={queue.isPaused ? "Resume" : "Pause"}
												onClick={() =>
													setConfirmAction({
														queueName: queue.name,
														action: queue.isPaused ? "resume" : "pause",
													})
												}
											>
												{queue.isPaused ? (
													<Play className="h-4 w-4" />
												) : (
													<Pause className="h-4 w-4" />
												)}
											</Button>
											<Button
												variant="ghost"
												size="icon"
												title="Clean Completed"
												onClick={() =>
													setConfirmAction({
														queueName: queue.name,
														action: "clean",
													})
												}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									)}
								</CardHeader>
								<CardContent className="space-y-4 pt-4">
									<div className="grid grid-cols-2 gap-4">
										<div className="flex flex-col rounded-md border bg-muted/50 p-3">
											<span className="text-xs font-semibold uppercase text-muted-foreground">
												Waiting
											</span>
											<span className="text-2xl font-bold text-cyan-500">
												{queue.counts.waiting}
											</span>
										</div>
										<div className="flex flex-col rounded-md border bg-muted/50 p-3">
											<span className="text-xs font-semibold uppercase text-muted-foreground">
												Active
											</span>
											<span className="text-2xl font-bold text-yellow-500">
												{queue.counts.active}
											</span>
										</div>
										<div className="flex flex-col rounded-md border bg-muted/50 p-3">
											<span className="text-xs font-semibold uppercase text-muted-foreground">
												Completed
											</span>
											<span className="text-2xl font-bold text-green-500">
												{queue.counts.completed}
											</span>
										</div>
										<div className="flex flex-col rounded-md border bg-muted/50 p-3">
											<span className="text-xs font-semibold uppercase text-muted-foreground">
												Failed
											</span>
											<span className="text-2xl font-bold text-destructive">
												{queue.counts.failed}
											</span>
										</div>
									</div>

									<div className="flex flex-col gap-2">
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Users className="h-4 w-4" />
											<span>{queue.workers.length} Workers Active</span>
										</div>
										<Button
											className="w-full"
											variant="secondary"
											onClick={() =>
												navigate({
													to: "/instances/$id/queues/$queue",
													params: { id, queue: queue.name },
												})
											}
										>
											Inspect Jobs
										</Button>
										{queue.workers.length > 0 && (
											<Button
												className="w-full mt-2"
												variant="outline"
												onClick={() =>
													navigate({
														to: "/instances/$id/workers",
														params: { id },
													})
												}
											>
												View Workers
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						))}

						{queues?.length === 0 && (
							<div className="col-span-full flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/50 p-12 text-center">
								<Layers className="mb-4 h-12 w-12 text-muted-foreground/50" />
								<p className="text-lg font-medium text-muted-foreground">
									No BullMQ queues found
								</p>
								<p className="text-sm text-muted-foreground/60">
									Make sure your workers are connected to this Redis instance.
								</p>
							</div>
						)}
					</div>
				)}
			</div>

			<AlertDialog
				open={!!confirmAction}
				onOpenChange={(open) => !open && setConfirmAction(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will {confirmAction?.action} the queue{" "}
							<strong>{confirmAction?.queueName}</strong>.
							{confirmAction?.action === "clean" &&
								" This action will remove all completed jobs from the queue."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className={
								confirmAction?.action === "clean"
									? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
									: ""
							}
							onClick={() => {
								if (confirmAction) {
									controlQueue.mutate({
										instanceId: Number(id),
										queueName: confirmAction.queueName,
										action: confirmAction.action,
									});
								}
							}}
						>
							{controlQueue.isPending ? "Processing..." : "Continue"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
