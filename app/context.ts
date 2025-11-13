import { createContext } from "react-router";
import type { User } from "./client/lib/types";

type AppContext = {
	user: User | null;
	hasUsers: boolean;
};

export const appContext = createContext<AppContext>({
	user: null,
	hasUsers: false,
});
