import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RotateCw, Trash2 } from "lucide-react";
import { Button } from "src/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "src/components/ui/sheet";
import { Skeleton } from "src/components/ui/skeleton";
import {
	getContext,
	trpcClient,
} from "../integrations/tanstack-query/root-provider";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute(
	"/instances/$id/queues/$queue/jobs/$jobId",
)({
	component: JobDetailsRoute,
});

function JobDetailsRoute() {
	const { id, queue, jobId } = Route.useParams();
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const isAdmin = session?.user.role === "admin";
	const { trpc, queryClient } = getContext();

	const { data: job, isLoading: isJobLoading } = useQuery(
		trpc.bullmq.getJob.queryOptions({
			instanceId: Number(id),
			queueName: queue,
			jobId,
		}),
	);

	const retryMutation = useMutation({
		mutationFn: () =>
			trpcClient.bullmq.retryJob.mutate({
				instanceId: Number(id),
				queueName: queue,
				jobId,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.bullmq.getJobs.queryFilter({
					instanceId: Number(id),
					queueName: queue,
				}),
			);
			handleClose();
		},
	});

	const removeMutation = useMutation({
		mutationFn: () =>
			trpcClient.bullmq.removeJob.mutate({
				instanceId: Number(id),
				queueName: queue,
				jobId,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries(
				trpc.bullmq.getJobs.queryFilter({
					instanceId: Number(id),
					queueName: queue,
				}),
			);
			handleClose();
		},
	});

	const handleClose = () => {
		navigate({
			to: "/instances/$id/queues/$queue",
			params: { id, queue },
		});
	};

	return (
		<Sheet open={true} onOpenChange={(open) => !open && handleClose()}>
			<SheetContent className="w-full sm:max-w-4xl p-0">
				<SheetHeader className="p-6 border-b bg-muted/10">
					<SheetTitle className="text-2xl font-bold flex items-center gap-2">
						Job #{jobId}
					</SheetTitle>
					<SheetDescription>
						Detailed view for job payload, logs and stacktrace.
					</SheetDescription>
				</SheetHeader>

				{isJobLoading ? (
					<div className="space-y-4 p-4">
						<Skeleton className="h-8 w-3/4" />
						<Skeleton className="h-32 w-full" />
						<Skeleton className="h-32 w-full" />
					</div>
				) : !job ? (
					<div className="p-4">Job not found</div>
				) : (
					<div className="flex flex-col h-full">
						<div className="flex-1">
							<div className="space-y-6 p-6">
								<div className="space-y-2">
									<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
										Payload Data
									</h3>
									<pre className="p-4 rounded-md bg-muted font-mono text-xs overflow-auto max-h-[300px] w-full max-w-full box-border whitespace-pre-wrap break-words break-all">
										{JSON.stringify(job.data, null, 2)}
									</pre>
								</div>

								{job.returnvalue && (
									<div className="space-y-2">
										<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
											Return Value
										</h3>
										<pre className="p-4 rounded-md bg-muted font-mono text-xs overflow-auto max-h-[300px] w-full max-w-full box-border whitespace-pre-wrap break-words break-all">
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
										<pre className="p-4 rounded-md bg-muted font-mono text-xs w-full max-w-full box-border whitespace-pre-wrap break-words overflow-auto max-h-[300px]">
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
											job.logs.map((log) => (
												<div
													key={log}
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
						</div>
						<div className="p-6 border-t bg-muted/20 flex gap-3">
							{isAdmin && (
								<>
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
								</>
							)}
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
