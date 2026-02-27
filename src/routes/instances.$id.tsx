import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Activity,
	ArrowLeft,
	CheckCircle2,
	Clock,
	Layers,
	Pause,
	Play,
	RefreshCw,
	RotateCw,
	Settings2,
	Trash2,
	Users,
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
} from "#/components/ui/alert-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { ScrollArea } from "#/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { Skeleton } from "#/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
	getContext,
	trpcClient,
} from "../integrations/tanstack-query/root-provider";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/instances/$id")({
	component: InstanceDetails,
});

function JobDetails({
	instanceId,
	queueName,
	jobId,
	onClose,
}: {
	instanceId: number;
	queueName: string;
	jobId: string;
	onClose: () => void;
}) {
	const { trpc, queryClient } = getContext();

	const { data: job, isLoading: isJobLoading } = useQuery(
		trpc.bullmq.getJob.queryOptions({ instanceId, queueName, jobId }),
	);

	const retryMutation = useMutation({
		mutationFn: () =>
			trpcClient.bullmq.retryJob.mutate({ instanceId, queueName, jobId }),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.bullmq.getJobs.queryFilter({ instanceId, queueName }),
			);
			onClose();
		},
	});

	const removeMutation = useMutation({
		mutationFn: () =>
			trpcClient.bullmq.removeJob.mutate({ instanceId, queueName, jobId }),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.bullmq.getJobs.queryFilter({ instanceId, queueName }),
			);
			onClose();
		},
	});

	if (isJobLoading) {
		return (
			<div className="space-y-4 p-4">
				<Skeleton className="h-8 w-3/4" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-32 w-full" />
			</div>
		);
	}

	if (!job) return <div className="p-4">Job not found</div>;

	return (
		<div className="flex flex-col h-full">
			<ScrollArea className="flex-1">
				<div className="space-y-6 p-6">
					<div className="space-y-2">
						<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
							Payload Data
						</h3>
						<pre className="p-4 rounded-md bg-muted font-mono text-xs overflow-auto max-h-[300px]">
							{JSON.stringify(job.data, null, 2)}
						</pre>
					</div>

					{job.returnvalue && (
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
								Return Value
							</h3>
							<pre className="p-4 rounded-md bg-muted font-mono text-xs overflow-auto max-h-[300px]">
								{JSON.stringify(job.returnvalue, null, 2)}
							</pre>
						</div>
					)}

					{job.failedReason && (
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-destructive uppercase tracking-wider">
								Failed Reason
							</h3>
							<div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
								{job.failedReason}
							</div>
						</div>
					)}

					{job.stacktrace && job.stacktrace.length > 0 && (
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
								Stacktrace
							</h3>
							<pre className="p-4 rounded-md bg-muted font-mono text-xs overflow-auto">
								{job.stacktrace.join("\n")}
							</pre>
						</div>
					)}

					<div className="space-y-2">
						<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
							Logs
						</h3>
						<div className="p-4 rounded-md bg-muted font-mono text-xs space-y-1">
							{job.logs.length === 0 ? (
								<span className="text-muted-foreground italic">
									No logs available
								</span>
							) : (
								job.logs.map((log, i) => (
									<div
										key={i}
										className="border-b border-border/50 pb-1 last:border-0"
									>
										{log}
									</div>
								))
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<span className="text-[10px] text-muted-foreground uppercase font-bold">
								Processed On
							</span>
							<p className="text-xs font-mono">
								{job.processedOn
									? new Date(job.processedOn).toLocaleString()
									: "-"}
							</p>
						</div>
						<div className="space-y-1">
							<span className="text-[10px] text-muted-foreground uppercase font-bold">
								Finished On
							</span>
							<p className="text-xs font-mono">
								{job.finishedOn
									? new Date(job.finishedOn).toLocaleString()
									: "-"}
							</p>
						</div>
						<div className="space-y-1">
							<span className="text-[10px] text-muted-foreground uppercase font-bold">
								Attempts
							</span>
							<p className="text-xs font-mono">{job.attemptsMade}</p>
						</div>
					</div>
				</div>
			</ScrollArea>
			<div className="p-6 border-t bg-muted/20 flex gap-3">
				<Button
					variant="outline"
					className="flex-1"
					disabled={retryMutation.isPending}
					onClick={() => retryMutation.mutate()}
				>
					<RotateCw
						className={`mr-2 h-4 w-4 ${retryMutation.isPending ? "animate-spin" : ""}`}
					/>
					Retry
				</Button>
				<Button
					variant="destructive"
					className="flex-1"
					disabled={removeMutation.isPending}
					onClick={() => removeMutation.mutate()}
				>
					<Trash2 className="mr-2 h-4 w-4" />
					Remove
				</Button>
			</div>
		</div>
	);
}

function InstanceDetails() {
	const { id } = Route.useParams();
	const { data: session } = authClient.useSession();
	const { trpc, queryClient } = getContext();

	const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
	const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
	const [jobState, setJobState] = useState<
		"active" | "waiting" | "completed" | "failed" | "delayed"
	>("active");

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

	const { data: jobs, isLoading: isJobsLoading } = useQuery({
		...trpc.bullmq.getJobs.queryOptions({
			instanceId: Number(id),
			queueName: selectedQueue || "",
			state: jobState,
		}),
		enabled: !!selectedQueue,
	});

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

	if (selectedQueue) {
		return (
			<div className="min-h-screen bg-background p-6 text-foreground md:p-12">
				<div className="mx-auto max-w-6xl space-y-8">
					<header className="flex items-center gap-4">
						<Button
							variant="outline"
							size="icon"
							onClick={() => setSelectedQueue(null)}
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<div className="flex flex-col">
							<h1 className="text-3xl font-bold tracking-tight">
								{selectedQueue}
							</h1>
							<p className="text-sm text-muted-foreground">
								Job inspection and management
							</p>
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
											<TableHead>Progress</TableHead>
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
													<div className="h-2 w-full max-w-[100px] overflow-hidden rounded-full bg-muted">
														<div
															className="h-full bg-primary"
															style={{
																width: `${typeof job.progress === "number" ? job.progress : 0}%`,
															}}
														/>
													</div>
												</TableCell>
												<TableCell className="text-right">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setSelectedJobId(job.id || null)}
													>
														Details
													</Button>
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

				<Sheet
					open={!!selectedJobId}
					onOpenChange={(open) => !open && setSelectedJobId(null)}
				>
					<SheetContent className="w-full sm:max-w-xl p-0">
						<SheetHeader className="p-6 border-b bg-muted/10">
							<SheetTitle className="text-2xl font-bold flex items-center gap-2">
								Job #{selectedJobId}
							</SheetTitle>
							<SheetDescription>
								Detailed view for job payload, logs and stacktrace.
							</SheetDescription>
						</SheetHeader>
						{selectedJobId && (
							<JobDetails
								instanceId={Number(id)}
								queueName={selectedQueue!}
								jobId={selectedJobId}
								onClose={() => setSelectedJobId(null)}
							/>
						)}
					</SheetContent>
				</Sheet>
			</div>
		);
	}

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
											onClick={() => setSelectedQueue(queue.name)}
										>
											Inspect Jobs
										</Button>
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
