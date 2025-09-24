import path from "node:path";
import fs from "node:fs/promises";

type MountInfo = {
	mountPoint: string;
	fstype: string;
};

function isPathWithin(base: string, target: string): boolean {
	const rel = path.posix.relative(base, target);
	return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function unescapeMount(s: string): string {
	return s.replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

async function readMountInfo(): Promise<MountInfo[]> {
	const text = await fs.readFile("/proc/self/mountinfo", "utf-8");
	const result: MountInfo[] = [];

	for (const line of text.split("\n")) {
		if (!line) continue;
		const sep = line.indexOf(" - ");

		if (sep === -1) continue;

		const left = line.slice(0, sep).split(" ");
		const right = line.slice(sep + 3).split(" ");

		// [0]=mount ID, [1]=parent ID, [2]=major:minor, [3]=root, [4]=mount point, [5]=mount options, ...
		const mpRaw = left[4];
		const fstype = right[0];

		if (!mpRaw || !fstype) continue;

		result.push({ mountPoint: unescapeMount(mpRaw), fstype });
	}
	return result;
}

export async function getMountForPath(p: string): Promise<MountInfo | undefined> {
	const mounts = await readMountInfo();

	let best: MountInfo | undefined;
	for (const m of mounts) {
		if (!isPathWithin(m.mountPoint, p)) continue;
		if (!best || m.mountPoint.length > best.mountPoint.length) {
			best = m;
		}
	}
	return best;
}
