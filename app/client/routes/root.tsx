import { redirect } from "react-router";

export const clientLoader = async () => {
	return redirect("/volumes");
};

export const loader = async () => {
	return redirect("/volumes");
};
