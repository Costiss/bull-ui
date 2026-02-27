import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Plus, Server, Trash2 } from "lucide-react";
import { useState } from "react";
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
		return <div className="p-8 text-center text-white">Loading...</div>;

	if (!session?.user) {
		return (
			<div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
				<div className="max-w-md w-full space-y-8 bg-slate-800 p-8 rounded-xl border border-slate-700">
					<h1 className="text-3xl font-bold">BullMQ UI</h1>
					<p className="text-slate-400">
						Please sign in to manage your queues.
					</p>
					<div className="space-y-4">
						<button
							type="button"
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
							className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-bold transition-colors"
						>
							Demo Login (demo@example.com)
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-900 text-white p-6 md:p-12">
			<div className="max-w-5xl mx-auto space-y-8">
				<header className="flex justify-between items-center">
					<h1 className="text-3xl font-bold">Redis Instances</h1>
					<div className="flex items-center gap-4">
						<span className="text-slate-400">Hi, {session.user.name}</span>
					</div>
				</header>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{instances?.map((instance) => (
						<div
							key={instance.id}
							className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4 hover:border-cyan-500/50 transition-all shadow-xl"
						>
							<div className="flex justify-between items-start">
								<div className="p-3 bg-slate-700 rounded-lg">
									<Server className="text-cyan-400" size={24} />
								</div>
								<button
									type="button"
									onClick={() => deleteInstance.mutate({ id: instance.id })}
									className="text-slate-500 hover:text-red-400 transition-colors"
								>
									<Trash2 size={18} />
								</button>
							</div>
							<div>
								<h3 className="text-xl font-bold">{instance.name}</h3>
								<p className="text-slate-400 text-sm font-mono">
									{instance.host}:{instance.port}
								</p>
							</div>
							<Link
								to="/instances/$id"
								params={{ id: instance.id.toString() }}
								className="flex items-center justify-center gap-2 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded font-medium transition-colors mt-4"
							>
								Explore Queues <ExternalLink size={16} />
							</Link>
						</div>
					))}

					<div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
						<Plus className="text-slate-500" size={32} />
						<div className="space-y-3 w-full">
							<input
								type="text"
								placeholder="Instance Name"
								className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
							/>
							<div className="flex gap-2">
								<input
									type="text"
									placeholder="Host"
									className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
									value={newHost}
									onChange={(e) => setNewHost(e.target.value)}
								/>
								<input
									type="number"
									placeholder="Port"
									className="w-24 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
									value={newPort}
									onChange={(e) => setNewPort(Number(e.target.value))}
								/>
							</div>
							<button
								type="button"
								disabled={!newName || !newHost}
								onClick={() => {
									addInstance.mutate({
										name: newName,
										host: newHost,
										port: newPort,
									});
									setNewName("");
								}}
								className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded font-bold transition-colors"
							>
								Add Instance
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
