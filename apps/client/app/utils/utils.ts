export const getCronExpression = (frequency: string, dailyTime?: string, weeklyDay?: string): string => {
	if (frequency === "hourly") {
		return "0 * * * *";
	}

	if (!dailyTime) {
		dailyTime = "02:00";
	}

	const [hours, minutes] = dailyTime.split(":");

	if (frequency === "daily") {
		return `${minutes} ${hours} * * *`;
	}

	return `${minutes} ${hours} * * ${weeklyDay ?? "0"}`;
};
