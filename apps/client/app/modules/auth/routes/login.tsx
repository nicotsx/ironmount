import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { loginMutation } from "~/api-client/@tanstack/react-query.gen";
import { AuthLayout } from "~/components/auth-layout";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { authMiddleware } from "~/middleware/auth";

export const clientMiddleware = [authMiddleware];

const loginSchema = type({
	username: "2<=string<=50",
	password: "string>=1",
});

type LoginFormValues = typeof loginSchema.inferIn;

export default function LoginPage() {
	const navigate = useNavigate();

	const form = useForm<LoginFormValues>({
		resolver: arktypeResolver(loginSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	const login = useMutation({
		...loginMutation(),
		onSuccess: async () => {
			navigate("/volumes");
		},
		onError: (error) => {
			console.error(error);
			toast.error("Login failed", { description: error.message });
		},
	});

	const onSubmit = (values: LoginFormValues) => {
		login.mutate({
			body: {
				username: values.username.trim(),
				password: values.password.trim(),
			},
		});
	};

	return (
		<AuthLayout title="Login to your account" description="Enter your credentials below to login to your account">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="username"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Username</FormLabel>
								<FormControl>
									<Input {...field} type="text" placeholder="admin" disabled={login.isPending} autoFocus />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-center justify-between">
									<FormLabel>Password</FormLabel>
									<button
										type="button"
										className="text-xs text-muted-foreground hover:underline"
										onClick={() => toast.info("Password reset not implemented")}
									>
										Forgot your password?
									</button>
								</div>
								<FormControl>
									<Input {...field} type="password" disabled={login.isPending} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="w-full" loading={login.isPending}>
						Login
					</Button>
				</form>
			</Form>
		</AuthLayout>
	);
}
