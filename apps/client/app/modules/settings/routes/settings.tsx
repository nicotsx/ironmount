import { useMutation } from "@tanstack/react-query";
import { KeyRound, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { changePasswordMutation, logoutMutation } from "~/api-client/@tanstack/react-query.gen";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { appContext } from "~/context";
import type { Route } from "./+types/settings";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Settings - Ironmount" },
		{
			name: "description",
			content: "Manage your account settings and preferences.",
		},
	];
}

export async function clientLoader({ context }: Route.LoaderArgs) {
	const ctx = context.get(appContext);
	return ctx;
}

export default function Settings({ loaderData }: Route.ComponentProps) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const navigate = useNavigate();

	const logout = useMutation({
		...logoutMutation(),
		onSuccess: () => {
			navigate("/login", { replace: true });
		},
	});

	const changePassword = useMutation({
		...changePasswordMutation(),
		onSuccess: (data) => {
			if (data.success) {
				toast.success("Password changed successfully. You will be logged out.");
				setTimeout(() => {
					logout.mutate({});
				}, 1500);
			} else {
				toast.error("Failed to change password", { description: data.message });
			}
		},
		onError: (error) => {
			toast.error("Failed to change password", { description: error.message });
		},
	});

	const handleChangePassword = (e: React.FormEvent) => {
		e.preventDefault();

		if (newPassword !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		if (newPassword.length < 8) {
			toast.error("Password must be at least 8 characters long");
			return;
		}

		changePassword.mutate({
			body: {
				currentPassword,
				newPassword,
			},
		});
	};

	return (
		<Card className="p-0 gap-0">
			<div className="border-b border-border/50 bg-card-header p-6">
				<CardTitle className="flex items-center gap-2">
					<User className="size-5" />
					Account Information
				</CardTitle>
				<CardDescription className="mt-1.5">Your account details</CardDescription>
			</div>
			<CardContent className="p-6 space-y-4">
				<div className="space-y-2">
					<Label>Username</Label>
					<Input value={loaderData.user?.username || ""} disabled className="max-w-md" />
				</div>
			</CardContent>

			<div className="border-t border-border/50 bg-card-header p-6">
				<CardTitle className="flex items-center gap-2">
					<KeyRound className="size-5" />
					Change Password
				</CardTitle>
				<CardDescription className="mt-1.5">Update your password to keep your account secure</CardDescription>
			</div>
			<CardContent className="p-6">
				<form onSubmit={handleChangePassword} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="current-password">Current Password</Label>
						<Input
							id="current-password"
							type="password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							className="max-w-md"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="new-password">New Password</Label>
						<Input
							id="new-password"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="max-w-md"
							required
							minLength={8}
						/>
						<p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirm-password">Confirm New Password</Label>
						<Input
							id="confirm-password"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="max-w-md"
							required
							minLength={8}
						/>
					</div>
					<Button type="submit" loading={changePassword.isPending} className="mt-4">
						Change Password
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
