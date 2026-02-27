import { Link } from "@tanstack/react-router";
import { Home, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "src/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "src/components/ui/sheet";
import BetterAuthHeader from "../integrations/better-auth/header-user.tsx";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-8">
			<div className="flex h-16 items-center gap-4">
				<Sheet open={isOpen} onOpenChange={setIsOpen}>
					<SheetTrigger asChild>
						<Button variant="ghost" size="icon" className="md:hidden">
							<Menu className="h-5 w-5" />
							<span className="sr-only">Toggle menu</span>
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-80 p-0">
						<div className="flex flex-col h-full bg-background border-r">
							<SheetHeader className="p-6 border-b">
								<SheetTitle className="text-xl font-bold">
									Navigation
								</SheetTitle>
							</SheetHeader>

							<nav className="flex-1 p-4">
								<Link
									to="/"
									onClick={() => setIsOpen(false)}
									className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors mb-2"
									activeProps={{
										className:
											"flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors mb-2 font-medium",
									}}
								>
									<Home size={20} />
									<span>Home</span>
								</Link>
							</nav>

							<div className="p-6 border-t bg-muted/30">
								<BetterAuthHeader />
							</div>
						</div>
					</SheetContent>
				</Sheet>

				<div className="flex items-center gap-2">
					<Link to="/" className="flex items-center gap-2">
						<img
							src="/tanstack-word-logo-white.svg"
							alt="BullMQ UI Logo"
							className="h-8 dark:invert-0 invert"
						/>
						<span className="hidden font-bold sm:inline-block">BullMQ UI</span>
					</Link>
				</div>

				<nav className="hidden md:flex flex-1 items-center gap-6 text-sm font-medium px-6">
					<Link
						to="/"
						className="text-muted-foreground transition-colors hover:text-foreground"
						activeProps={{ className: "text-foreground font-bold" }}
					>
						Instances
					</Link>
				</nav>

				<div className="hidden md:block">
					<BetterAuthHeader />
				</div>
			</div>
		</header>
	);
}
