import { redirect, type MiddlewareFunction } from "react-router";
import { getMe, getStatus } from "~/client/api-client";
import { appContext } from "~/context";

export const authMiddleware: MiddlewareFunction = async ({ context, request }) => {
	const session = await getMe();

	const isAuthRoute = ["/login", "/onboarding"].includes(new URL(request.url).pathname);

	if (!session.data?.user?.id && !isAuthRoute) {
		const status = await getStatus();
		if (!status.data?.hasUsers) {
			throw redirect("/onboarding");
		}

		throw redirect("/login");
	}

	if (session.data?.user?.id) {
		context.set(appContext, { user: session.data.user, hasUsers: true });

		if (isAuthRoute) {
			throw redirect("/");
		}
	}
};
