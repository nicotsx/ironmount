class TimeoutError extends Error {
	code = "ETIMEOUT";
	constructor(message: string) {
		super(message);
		this.name = "TimeoutError";
	}
}

export async function withTimeout<T>(promise: Promise<T>, ms: number, label = "operation"): Promise<T> {
	let timer: NodeJS.Timeout | undefined;
	const timeout = new Promise<T>((_, reject) => {
		timer = setTimeout(() => reject(new TimeoutError(`${label} timed out after ${ms}ms`)), ms);
	});
	return Promise.race([promise, timeout]).finally(() => {
		if (timer) clearTimeout(timer);
	});
}
