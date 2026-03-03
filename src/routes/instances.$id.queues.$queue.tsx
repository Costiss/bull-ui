import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import {
	Activity,
	ArrowLeft,
	CheckCircle2,
	Clock,
	RotateCw,
	Settings2,
	Trash2,
	XCircle,
} from "lucide-react";
import { useState } from "react";
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

	const { data: jobs, isLoading: isJobsLoading } = useQuery({
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

	if (!session?.user)
		return <div className="p-8 text-center">Unauthorized</div>;

	return (
		<div className="min-h-screen bg-background p-6 text-foreground md:p-12">
			<div className="mx-auto max-w-6xl space-y-8">
				<header className="flex items-center gap-4">
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
						<h1 className="text-3xl font-bold tracking-tight">{queueName}</h1>
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
						<TabsTrigger value="completed" className="flex items-center gap-2">
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
											<TableCell className="font-medium">{job.name}</TableCell>
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
																	retryMutation.mutate({ jobId: job.id || "" })
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
																	removeMutation.mutate({ jobId: job.id || "" })
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
	);
}
