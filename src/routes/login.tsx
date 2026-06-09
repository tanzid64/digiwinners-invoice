import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { getSession } from "#/lib/auth.functions.ts";
import { signIn } from "#/lib/auth-client.ts";
import { useAppForm } from "#/lib/form.tsx";

const searchSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
	validateSearch: searchSchema,
	beforeLoad: async ({ search }) => {
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
	const [error, setError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setError(null);
			const { error } = await signIn.email(value);
			if (error) {
				setError(error.message || "Invalid email or password");
				return;
			}
			await router.navigate({ to: search.redirect || "/" });
		},
	});

	return (
		<div className="bg-muted/30 flex min-h-svh items-center justify-center p-4">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="bg-card w-full max-w-sm space-y-6 rounded-xl border p-8 shadow-sm"
			>
				<div className="flex flex-col items-center gap-2">
					<img
						src="/logo/digiwinners.png"
						alt="DigiWinners"
						className="h-12 w-auto"
					/>
					<h1 className="text-xl font-semibold">Sign in</h1>
					<p className="text-muted-foreground text-sm">
						DigiWinners management console
					</p>
				</div>

				<form.AppField
					name="email"
					validators={{ onBlur: z.string().email("Enter a valid email") }}
				>
					{(f) => (
						<f.TextField label="Email" type="email" autoComplete="email" />
					)}
				</form.AppField>

				<form.AppField
					name="password"
					validators={{ onBlur: z.string().min(1, "Password required") }}
				>
					{(f) => (
						<f.TextField
							label="Password"
							type="password"
							autoComplete="current-password"
						/>
					)}
				</form.AppField>

				{error && <p className="text-destructive text-sm">{error}</p>}

				<form.AppForm>
					<form.SubmitButton label="Sign in" className="w-full" />
				</form.AppForm>
			</form>
		</div>
	);
}
