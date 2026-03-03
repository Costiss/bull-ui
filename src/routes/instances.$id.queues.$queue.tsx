import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import {
	Activity,
	ArrowLeft,
	CheckCircle2,
	Clock,
	Pause,
	Play,
	RefreshCw,
	RotateCw,
	Settings2,
	Trash2,
	XCircle,
} from "lucide-react";
import { useState } from "react";
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
import { Button } from "src/components/ui/button";
import { Skeleton } from "src/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "src/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "src/components/ui/tabs";
import {
	getContext,
	trpcClient,
} from "../integrations/tanstack-query/root-provider";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/instances/$id/queues/$queue")({
	component: QueueDetails,
});

function QueueDetails() {
	const { id, queue: queueName } = Route.useParams();
	const { data: session } = authClient.useSession();
	const { trpc, queryClient } = getContext();
	const navigate = useNavigate();

	const [jobState, setJobState] = useState<
		"active" | "waiting" | "completed" | "failed" | "delayed"
	>("active");

	const {
		data: jobs,
		isLoading: isJobsLoading,
		refetch: refetchJobs,
		isRefetching: isJobsRefetching,
	} = useQuery({
		...trpc.bullmq.getJobs.queryOptions({
			instanceId: Number(id),
			queueName: queueName,
			state: jobState,
		}),
	});

	const retryMutation = useMutation({
		mutationFn: ({ jobId }: { jobId: string }) =>
			trpcClient.bullmq.retryJob.mutate({
				instanceId: Number(id),
				queueName: queueName,
				jobId,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.bullmq.getJobs.queryFilter({
					instanceId: Number(id),
					queueName: queueName,
				}),
			);
		},
	});

	const removeMutation = useMutation({
		mutationFn: ({ jobId }: { jobId: string }) =>
			trpcClient.bullmq.removeJob.mutate({
				instanceId: Number(id),
				queueName: queueName,
				jobId,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.bullmq.getJobs.queryFilter({
					instanceId: Number(id),
					queueName: queueName,
				}),
			);
		},
	});

	const [confirmAction, setConfirmAction] = useState<{
		queueName: string;
		action: "pause" | "resume" | "clean" | "purge";
	} | null>(null);

	const controlQueue = useMutation({
		mutationFn: (input: {
			instanceId: number;
			queueName: string;
			action: "pause" | "resume" | "clean" | "purge";
		}) => trpcClient.bullmq.controlQueue.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.bullmq.getQueues.queryFilter({ instanceId: Number(id) }),
			);
			queryClient.invalidateQueries(
				trpc.bullmq.getJobs.queryFilter({ instanceId: Number(id), queueName }),
			);
			setConfirmAction(null);
		},
	});

	if (!session?.user)
		return <div className="p-8 text-center">Unauthorized</div>;

	// read queue state from cache (if available) to show proper control icon
	const queuesCache = queryClient.getQueryData(
		trpc.bullmq.getQueues.queryKey({ instanceId: Number(id) }),
	) as Array<{ name: string; isPaused?: boolean }> | undefined;
	const thisQueue = queuesCache?.find((q) => q.name === queueName);
	const isQueuePaused = !!thisQueue?.isPaused;

	return (
		<>
			<div className="min-h-screen bg-background p-6 text-foreground md:p-12">
				<div className="mx-auto max-w-6xl space-y-8">
					<header className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-5">
							<Button
								variant="outline"
								size="icon"
								onClick={() =>
									navigate({
										to: "/instances/$id",
										params: { id },
									})
								}
							>
								<ArrowLeft className="h-4 w-4" />
							</Button>
							<div className="flex flex-col">
								<h1 className="text-3xl font-bold tracking-tight">
									{queueName}
								</h1>
								<p className="text-sm text-muted-foreground">
									Job inspection and management
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								onClick={() => refetchJobs?.()}
								className={isJobsRefetching ? "animate-spin" : ""}
								title="Refresh"
							>
								<RefreshCw className="h-4 w-4" />
							</Button>

							{session?.user.role === "admin" && (
								<div className="flex gap-1">
									<Button
										variant="ghost"
										size="icon"
										title={isQueuePaused ? "Resume" : "Pause"}
										onClick={() =>
											setConfirmAction({
												queueName,
												action: isQueuePaused ? "resume" : "pause",
											})
										}
									>
										{isQueuePaused ? (
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
											setConfirmAction({ queueName, action: "clean" })
										}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										title="Purge All"
										className="text-destructive"
										onClick={() =>
											setConfirmAction({ queueName, action: "purge" })
										}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							)}
						</div>
					</header>

					<Tabs
						value={jobState}
						onValueChange={(v) => setJobState(v as typeof jobState)}
					>
						<TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
							<TabsTrigger value="active" className="flex items-center gap-2">
								<Activity className="h-4 w-4" />
								<span className="hidden sm:inline">Active</span>
							</TabsTrigger>
							<TabsTrigger value="waiting" className="flex items-center gap-2">
								<Clock className="h-4 w-4" />
								<span className="hidden sm:inline">Waiting</span>
							</TabsTrigger>
							<TabsTrigger
								value="completed"
								className="flex items-center gap-2"
							>
								<CheckCircle2 className="h-4 w-4" />
								<span className="hidden sm:inline">Completed</span>
							</TabsTrigger>
							<TabsTrigger value="failed" className="flex items-center gap-2">
								<XCircle className="h-4 w-4" />
								<span className="hidden sm:inline">Failed</span>
							</TabsTrigger>
							<TabsTrigger value="delayed" className="flex items-center gap-2">
								<Settings2 className="h-4 w-4" />
								<span className="hidden sm:inline">Delayed</span>
							</TabsTrigger>
						</TabsList>

						<div className="mt-6 rounded-md border bg-card shadow-sm">
							{isJobsLoading ? (
								<div className="space-y-4 p-4">
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[100px]">ID</TableHead>
											<TableHead>Name</TableHead>
											<TableHead>Attempts</TableHead>
											<TableHead>Priority</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{jobs?.map((job) => (
											<TableRow key={job.id}>
												<TableCell className="font-mono text-xs">
													{job.id}
												</TableCell>
												<TableCell className="font-medium">
													{job.name}
												</TableCell>
												<TableCell>{job.attemptsMade}</TableCell>
												<TableCell>
													<span className="inline-block rounded px-2 py-1 text-xs font-mono bg-muted">
														{typeof job.opts?.priority === "number"
															? job.opts.priority
															: "-"}
													</span>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() =>
																navigate({
																	to: "/instances/$id/queues/$queue/jobs/$jobId",
																	params: {
																		id,
																		queue: queueName,
																		jobId: job.id || "",
																	},
																})
															}
														>
															Details
														</Button>
														{session?.user.role === "admin" && (
															<>
																<Button
																	variant="outline"
																	size="sm"
																	disabled={retryMutation.isPending}
																	onClick={() =>
																		retryMutation.mutate({
																			jobId: job.id || "",
																		})
																	}
																>
																	<RotateCw
																		className={`mr-2 h-4 w-4 ${retryMutation.isPending ? "animate-spin" : ""}`}
																	/>
																	Retry
																</Button>
																<Button
																	variant="destructive"
																	size="sm"
																	disabled={removeMutation.isPending}
																	onClick={() =>
																		removeMutation.mutate({
																			jobId: job.id || "",
																		})
																	}
																>
																	<Trash2 className="mr-2 h-4 w-4" />
																	Remove
																</Button>
															</>
														)}
													</div>
												</TableCell>
											</TableRow>
										))}
										{jobs?.length === 0 && (
											<TableRow>
												<TableCell
													colSpan={5}
													className="h-24 text-center text-muted-foreground"
												>
													No jobs found in this state.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							)}
						</div>
					</Tabs>
				</div>

				<Outlet />
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
							<br />
							<br />
							{confirmAction?.action === "clean" && (
								<>
									Clean will <strong>remove</strong> all{" "}
									<strong>completed</strong> jobs from the queue.
								</>
							)}
							{confirmAction?.action === "purge" && (
								<>
									Purge will <strong>💀obliterate💀</strong> the entire queue,
									removing all jobs regardless of their state.{" "}
									<strong>Use with caution! ⚠️</strong>
								</>
							)}
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
		</>
	);
}
