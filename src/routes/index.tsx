import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Plus, Server, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "src/components/ui/card";
import { Input } from "src/components/ui/input";
import { useTRPC } from "../integrations/trpc/react";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const trpcInstance = useTRPC();
	const queryClient = useQueryClient();

	const { data: instances } = useQuery({
		...trpcInstance.redis.list.queryOptions(undefined),
		enabled: !!session?.user,
	});

	const addInstance = useMutation(
		trpcInstance.redis.add.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({
					queryKey: trpcInstance.redis.list.queryKey(),
				}),
		}),
	);

	const deleteInstance = useMutation(
		trpcInstance.redis.delete.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({
					queryKey: trpcInstance.redis.list.queryKey(),
				}),
		}),
	);

	const [newName, setNewName] = useState("");
	const [newHost, setNewHost] = useState("localhost");
	const [newPort, setNewPort] = useState(6379);

	if (isSessionPending)
		return (
			<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
				<p className="animate-pulse text-lg">Loading...</p>
			</div>
		);

	if (!session?.user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
				<Card className="w-full max-w-md border-border bg-card shadow-lg">
					<CardHeader className="text-center">
						<CardTitle className="text-3xl font-bold">BullMQ UI</CardTitle>
						<p className="text-sm text-muted-foreground">
							Please sign in to manage your queues.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<Button
							className="w-full"
							onClick={async () => {
								await authClient.signIn.email(
									{
										email: "demo@example.com",
										password: "password123",
									},
									{
										onError: async () => {
											// Auto register for demo
											await authClient.signUp.email({
												email: "demo@example.com",
												password: "password123",
												name: "Demo User",
											});
										},
									},
								);
							}}
						>
							Demo Login (demo@example.com)
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-6 text-foreground md:p-12">
			<div className="mx-auto max-w-5xl space-y-8">
				<header className="flex items-center justify-between">
					<h1 className="text-3xl font-bold tracking-tight">Redis Instances</h1>
					<div className="flex items-center gap-4">
						<Badge variant="outline" className="px-3 py-1">
							Hi, {session.user.name}
						</Badge>
					</div>
				</header>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{instances?.map((instance) => (
						<Card
							key={instance.id}
							className="overflow-hidden transition-all hover:border-primary/50"
						>
							<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
								<div className="rounded-lg bg-muted p-2">
									<Server className="h-5 w-5 text-primary" />
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="text-muted-foreground hover:text-destructive"
									onClick={() => deleteInstance.mutate({ id: instance.id })}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</CardHeader>
							<CardContent>
								<CardTitle className="text-xl">{instance.name}</CardTitle>
								<p className="text-sm font-mono text-muted-foreground">
									{instance.host}:{instance.port}
								</p>
							</CardContent>
							<CardFooter>
								<Button asChild className="w-full" variant="secondary">
									<Link
										to="/instances/$id"
										params={{ id: instance.id.toString() }}
									>
										Explore Queues <ExternalLink className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</CardFooter>
						</Card>
					))}

					<Card className="flex min-h-[200px] flex-col items-center justify-center border-2 border-dashed bg-muted/50 p-6">
						<Plus className="mb-4 h-8 w-8 text-muted-foreground" />
						<div className="w-full space-y-3">
							<Input
								placeholder="Instance Name"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
							/>
							<div className="flex gap-2">
								<Input
									placeholder="Host"
									className="flex-1"
									value={newHost}
									onChange={(e) => setNewHost(e.target.value)}
								/>
								<Input
									type="number"
									placeholder="Port"
									className="w-24"
									value={newPort}
									onChange={(e) => setNewPort(Number(e.target.value))}
								/>
							</div>
							<Button
								className="w-full"
								disabled={!newName || !newHost || addInstance.isPending}
								onClick={() => {
									addInstance.mutate({
										name: newName,
										host: newHost,
										port: newPort,
									});
									setNewName("");
								}}
							>
								{addInstance.isPending ? "Adding..." : "Add Instance"}
							</Button>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
