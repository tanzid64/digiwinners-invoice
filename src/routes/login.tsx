import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { getSession } from "#/lib/auth.functions.ts";
import { signIn } from "#/lib/auth-client.ts";

const searchSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
	validateSearch: searchSchema,
	beforeLoad: async ({ search }) => {
		// Already signed in → skip the login page.
		const session = await getSession();
		if (session) {
			throw redirect({ to: search.redirect || "/" });
		}
	},
	component: Login,
});

function Login() {
	const router = useRouter();
	const search = Route.useSearch();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setPending(true);

		const { error } = await signIn.email({ email, password });

		setPending(false);
		if (error) {
			setError(error.message || "Invalid email or password");
			return;
		}
		await router.navigate({ to: search.redirect || "/" });
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-4">
			<form
				onSubmit={onSubmit}
				className="w-full max-w-sm space-y-6 rounded-xl border p-8 shadow-sm"
			>
				<div className="flex flex-col items-center gap-2">
					<img
						src="/logo/digiwinners.png"
						alt="DigiWinners"
						className="h-12 w-auto"
					/>
					<h1 className="text-xl font-semibold">Sign in</h1>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<Input
						id="password"
						type="password"
						autoComplete="current-password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>

				{error && <p className="text-sm text-red-500">{error}</p>}

				<Button type="submit" className="w-full" disabled={pending}>
					{pending ? "Signing in…" : "Sign in"}
				</Button>
			</form>
		</div>
	);
}
