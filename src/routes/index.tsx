import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Plus, Server, Trash2 } from "lucide-react";
import { useId, useState } from "react";
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

	const setupNameId = useId();
	const setupEmailId = useId();
	const setupPasswordId = useId();
	const loginEmailId = useId();
	const loginPasswordId = useId();

	const { data: isInitialSetup, isLoading: isSetupLoading } = useQuery(
		trpcInstance.setup.isInitialSetup.queryOptions(),
	);

	const createInitialAdmin = useMutation(
		trpcInstance.setup.createInitialAdmin.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({
					queryKey: trpcInstance.setup.isInitialSetup.queryKey(),
				}),
		}),
	);

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

	const [loginEmail, setLoginEmail] = useState("");
	const [loginPassword, setLoginPassword] = useState("");
	const [loginError, setLoginError] = useState("");

	if (isSessionPending || isSetupLoading)
		return (
			<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
				<p className="animate-pulse text-lg">Loading...</p>
			</div>
		);

	if (isInitialSetup) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
				<Card className="w-full max-w-md border-border bg-card shadow-lg">
					<CardHeader className="text-center">
						<CardTitle className="text-3xl font-bold">Welcome!</CardTitle>
						<p className="text-sm text-muted-foreground mt-2">
							Let's set up your first admin account to get started.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label htmlFor={setupNameId} className="text-sm font-medium">
								Name
							</label>
							<Input
								id={setupNameId}
								placeholder="Admin Name"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor={setupEmailId} className="text-sm font-medium">
								Email
							</label>
							<Input
								id={setupEmailId}
								type="email"
								placeholder="admin@example.com"
								value={loginEmail}
								onChange={(e) => setLoginEmail(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor={setupPasswordId} className="text-sm font-medium">
								Password
							</label>
							<Input
								id={setupPasswordId}
								type="password"
								placeholder="********"
								value={loginPassword}
								onChange={(e) => setLoginPassword(e.target.value)}
							/>
						</div>
						<Button
							className="w-full"
							disabled={
								!newName ||
								!loginEmail ||
								loginPassword.length < 8 ||
								createInitialAdmin.isPending
							}
							onClick={async () => {
								try {
									await createInitialAdmin.mutateAsync({
										name: newName,
										email: loginEmail,
										password: loginPassword,
									});
									await authClient.signIn.email({
										email: loginEmail,
										password: loginPassword,
									});
								} catch (err) {
									console.error(err);
								}
							}}
						>
							{createInitialAdmin.isPending
								? "Creating..."
								: "Create Admin Account"}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

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
						<div className="space-y-2">
							<label htmlFor={loginEmailId} className="text-sm font-medium">
								Email
							</label>
							<Input
								id={loginEmailId}
								type="email"
								placeholder="admin@example.com"
								value={loginEmail}
								onChange={(e) => setLoginEmail(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor={loginPasswordId} className="text-sm font-medium">
								Password
							</label>
							<Input
								id={loginPasswordId}
								type="password"
								placeholder="********"
								value={loginPassword}
								onChange={(e) => setLoginPassword(e.target.value)}
							/>
						</div>
						{loginError && (
							<p className="text-xs text-destructive">{loginError}</p>
						)}
						<Button
							className="w-full"
							onClick={async () => {
								setLoginError("");
								await authClient.signIn.email(
									{
										email: loginEmail,
										password: loginPassword,
									},
									{
										onError: (ctx) => {
											setLoginError(ctx.error.message || "Login failed");
										},
									},
								);
							}}
						>
							Sign In
						</Button>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-card px-2 text-muted-foreground">Demo</span>
							</div>
						</div>

						<Button
							variant="outline"
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

	const isAdmin = session.user.role === "admin";

	return (
		<div className="min-h-screen bg-background p-6 text-foreground md:p-12">
			<div className="mx-auto max-w-5xl space-y-8">
				<header className="flex items-center justify-between">
					<h1 className="text-3xl font-bold tracking-tight">Redis Instances</h1>
					<div className="flex items-center gap-4">
						<Badge variant="outline" className="px-3 py-1">
							Hi, {session.user.name} ({session.user.role})
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
								{isAdmin && (
									<Button
										variant="ghost"
										size="icon"
										className="text-muted-foreground hover:text-destructive"
										onClick={() => deleteInstance.mutate({ id: instance.id })}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
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

					{isAdmin && (
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
					)}
				</div>
			</div>
		</div>
	);
}
