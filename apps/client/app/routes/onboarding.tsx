import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { registerMutation } from "~/api-client/@tanstack/react-query.gen";
import { GridBackground } from "~/components/grid-background";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";

const onboardingSchema = type({
	username: "2<=string<=50",
	password: "string>=8",
	confirmPassword: "string>=1",
});

type OnboardingFormValues = typeof onboardingSchema.inferIn;

export default function OnboardingPage() {
	const navigate = useNavigate();

	const form = useForm<OnboardingFormValues>({
		resolver: arktypeResolver(onboardingSchema),
		defaultValues: {
			username: "",
			password: "",
			confirmPassword: "",
		},
	});

	const registerUser = useMutation({
		...registerMutation(),
		onSuccess: async () => {
			toast.success("Admin user created successfully!");
			navigate("/volumes");
		},
		onError: (error) => {
			console.error(error);
			toast.error("Failed to create admin user");
		},
	});

	const onSubmit = (values: OnboardingFormValues) => {
		if (values.password !== values.confirmPassword) {
			form.setError("confirmPassword", {
				type: "manual",
				message: "Passwords do not match",
			});
			return;
		}

		registerUser.mutate({
			body: {
				username: values.username.trim(),
				password: values.password.trim(),
			},
		});
	};

	return (
		<GridBackground className="flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl font-bold">Welcome to Ironmount</CardTitle>
					<CardDescription>Create the admin user to get started</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Username</FormLabel>
										<FormControl>
											<Input {...field} type="text" placeholder="admin" disabled={registerUser.isPending} autoFocus />
										</FormControl>
										<FormDescription>Choose a username for the admin account</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="password"
												placeholder="Enter a secure password"
												disabled={registerUser.isPending}
											/>
										</FormControl>
										<FormDescription>Password must be at least 8 characters long.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm Password</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="password"
												placeholder="Re-enter your password"
												disabled={registerUser.isPending}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" className="w-full" loading={registerUser.isPending}>
								Create Admin User
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</GridBackground>
	);
}
