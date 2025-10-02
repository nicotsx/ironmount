import { redirect, type MiddlewareFunction } from "react-router";
import { getMe, getStatus } from "~/api-client";
import { appContext } from "~/context";

export const authMiddleware: MiddlewareFunction = async ({ context }) => {
	const session = await getMe();

	if (!session.data?.user.id) {
		const status = await getStatus();
		if (!status.data?.hasUsers) {
			throw redirect("/register");
		}

		throw redirect("/login");
	}

	context.set(appContext, { user: session.data.user, hasUsers: true });
};
