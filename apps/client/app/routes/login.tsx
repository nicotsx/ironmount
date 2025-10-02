import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { loginMutation } from "~/api-client/@tanstack/react-query.gen";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function LoginPage() {
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const usernameId = useId();
	const passwordId = useId();

	const login = useMutation({
		...loginMutation(),
		onSuccess: async () => {
			navigate("/");
		},
		onError: (error) => {
			console.error(error);
			toast.error("Login failed");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim() || !password.trim()) {
			toast.error("Username and password are required");
			return;
		}

		login.mutate({
			body: {
				username: username.trim(),
				password: password.trim(),
			},
		});
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
					<CardDescription>Sign in to your account</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={usernameId}>Username</Label>
							<Input
								id={usernameId}
								type="text"
								placeholder="Enter your username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								disabled={login.isPending}
								autoFocus
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={passwordId}>Password</Label>
							<Input
								id={passwordId}
								type="password"
								placeholder="Enter your password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={login.isPending}
								required
							/>
						</div>
						<Button type="submit" className="w-full" loading={login.isPending}>
							Sign In
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
