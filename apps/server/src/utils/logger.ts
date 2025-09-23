import { createLogger, format, transports } from "winston";

const { printf, combine, colorize } = format;

const printConsole = printf((info) => `${info.level} > ${info.message}`);
const consoleFormat = combine(colorize(), printConsole);

const winstonLogger = createLogger({
	level: "info",
	format: format.json(),
	transports: [new transports.Console({ level: "info", format: consoleFormat })],
});

const log = (level: "info" | "warn" | "error", messages: unknown[]) => {
	const stringMessages = messages.flatMap((m) => {
		if (m instanceof Error) {
			return [m.message, m.stack];
		}

		if (typeof m === "object") {
			return JSON.stringify(m, null, 2);
		}

		return m;
	});

	winstonLogger.log(level, stringMessages.join(" | "));
};

export const logger = {
	info: (...messages: unknown[]) => log("info", messages),
	warn: (...messages: unknown[]) => log("warn", messages),
	error: (...messages: unknown[]) => log("error", messages),
};
