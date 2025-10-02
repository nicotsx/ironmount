import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { registerMutation } from "~/api-client/@tanstack/react-query.gen";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function OnboardingPage() {
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const usernameId = useId();
	const passwordId = useId();
	const confirmPasswordId = useId();

	const register = useMutation({
		...registerMutation(),
		onSuccess: async () => {
			toast.success("Admin user created successfully!");
			navigate("/");
		},
		onError: (error) => {
			console.error(error);
			toast.error("Failed to create admin user");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim() || !password.trim()) {
			toast.error("Username and password are required");
			return;
		}

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		register.mutate({
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
					<CardTitle className="text-2xl font-bold">Welcome to IronMount</CardTitle>
					<CardDescription>Create the admin user to get started</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={usernameId}>Username</Label>
							<Input
								id={usernameId}
								type="text"
								placeholder="admin"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								disabled={register.isPending}
								autoFocus
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={passwordId}>Password</Label>
							<Input
								id={passwordId}
								type="password"
								placeholder="Enter a secure password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={register.isPending}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={confirmPasswordId}>Confirm Password</Label>
							<Input
								id={confirmPasswordId}
								type="password"
								placeholder="Re-enter your password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								disabled={register.isPending}
								required
							/>
						</div>
						<Button type="submit" className="w-full" disabled={register.isPending}>
							{register.isPending ? "Creating..." : "Create Admin User"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
