import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import { Skeleton } from "src/components/ui/skeleton";
import { authClient } from "../../lib/auth-client";

export default function BetterAuthHeader() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-24 rounded-md" />;
	}

	if (session?.user) {
		return (
			<div className="flex items-center gap-3">
				<div className="hidden lg:flex flex-col items-end">
					<span className="text-xs font-bold leading-none">
						{session.user.name}
					</span>
					<Badge
						variant="outline"
						className="text-[10px] h-4 px-1 font-mono uppercase text-muted-foreground mt-1"
					>
						{session.user.role || "user"}
					</Badge>
				</div>
				<div className="h-8 w-8 rounded-full border bg-muted flex items-center justify-center overflow-hidden">
					{session.user.image ? (
						<img
							src={session.user.image}
							alt={session.user.name}
							className="h-full w-full object-cover"
						/>
					) : (
						<UserIcon className="h-4 w-4 text-muted-foreground" />
					)}
				</div>
				<Button
					variant="ghost"
					size="icon"
					title="Sign out"
					onClick={() => {
						void authClient.signOut();
					}}
					className="text-muted-foreground hover:text-destructive"
				>
					<LogOut className="h-4 w-4" />
				</Button>
			</div>
		);
	}

	return (
		<Button asChild variant="outline" size="sm">
			<Link to="/">
				<LogIn className="mr-2 h-4 w-4" />
				Sign in
			</Link>
		</Button>
	);
}
