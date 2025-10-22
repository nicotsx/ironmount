import { redirect } from "react-router";

export const clientLoader = async () => {
	return redirect("/volumes");
};
