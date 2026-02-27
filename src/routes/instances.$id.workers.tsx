import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "src/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "src/components/ui/table";
import { getContext } from "../integrations/tanstack-query/root-provider";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/instances/$id/workers")({
	component: WorkersPage,
});

function WorkersPage() {
	const { id } = Route.useParams();
	const { data: session } = authClient.useSession();
	const { trpc } = getContext();

	const [selectedQueue, setSelectedQueue] = useState<string | null>(null);

	const { data: queues, isLoading: isQueuesLoading } = useQuery(
		trpc.bullmq.getQueues.queryOptions({ instanceId: Number(id) }),
	);

	const { data: workers, isLoading: isWorkersLoading } = useQuery({
		...trpc.bullmq.getWorkers.queryOptions({
			instanceId: Number(id),
			queueName: selectedQueue || "",
		}),
		enabled: !!selectedQueue,
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
								Workers for {selectedQueue}
							</h1>
							<p className="text-sm text-muted-foreground">
								Active workers processing jobs
							</p>
						</div>
					</header>

					<div className="rounded-md border bg-card shadow-sm">
						{isWorkersLoading ? (
							<div className="p-4">Loading workers...</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>ID</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Concurrency</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{workers?.map((worker) => (
										<TableRow key={worker.id}>
											<TableCell className="font-mono text-xs">
												{worker.id}
											</TableCell>
											<TableCell className="font-medium">
												{worker.name || "Unnamed"}
											</TableCell>
											<TableCell>
												{(worker.opts as { concurrency?: number })
													?.concurrency || 1}
											</TableCell>
											<TableCell>
												<Badge
													variant="secondary"
													className="bg-green-500/10 text-green-600"
												>
													Active
												</Badge>
											</TableCell>
										</TableRow>
									))}
									{(!workers || workers.length === 0) && (
										<TableRow>
											<TableCell
												colSpan={4}
												className="h-24 text-center text-muted-foreground"
											>
												No active workers found for this queue.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-6 text-foreground md:p-12">
			<div className="mx-auto max-w-5xl space-y-8">
				<header className="flex items-center gap-4">
					<div className="rounded-lg bg-muted p-2">
						<Users className="h-6 w-6 text-primary" />
					</div>
					<div className="flex flex-col">
						<h1 className="text-3xl font-bold tracking-tight">Workers</h1>
						<p className="text-sm text-muted-foreground">
							Monitor BullMQ workers across all queues
						</p>
					</div>
				</header>

				{isQueuesLoading ? (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div className="animate-pulse h-[200px] bg-muted rounded-lg"></div>
						<div className="animate-pulse h-[200px] bg-muted rounded-lg"></div>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{queues?.map((queue) => (
							<Card
								key={queue.name}
								className="overflow-hidden transition-all hover:border-primary/50"
							>
								<CardHeader>
									<CardTitle className="text-xl">{queue.name}</CardTitle>
									<CardDescription>
										{queue.workers.length} active workers
									</CardDescription>
								</CardHeader>
								<CardContent>
									<Button
										className="w-full"
										variant="secondary"
										onClick={() => setSelectedQueue(queue.name)}
										disabled={queue.workers.length === 0}
									>
										View Workers
									</Button>
								</CardContent>
							</Card>
						))}

						{queues?.length === 0 && (
							<div className="col-span-full flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/50 p-12 text-center">
								<Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
								<p className="text-lg font-medium text-muted-foreground">
									No queues found
								</p>
								<p className="text-sm text-muted-foreground/60">
									Workers are associated with queues.
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
