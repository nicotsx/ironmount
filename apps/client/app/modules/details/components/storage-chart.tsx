"use client";

import { HardDrive, Unplug } from "lucide-react";
import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import { ByteSize } from "~/components/bytes-size";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "~/components/ui/chart";
import type { StatFs } from "~/lib/types";

type Props = {
	statfs: StatFs;
};

export function StorageChart({ statfs }: Props) {
	const chartData = React.useMemo(
		() => [
			{
				name: "Used",
				value: statfs.used,
				fill: "blue",
			},
			{
				name: "Free",
				value: statfs.free,
				fill: "lightgray",
			},
		],
		[statfs],
	);

	const chartConfig = {
		value: {
			label: "Storage",
		},
		used: {
			label: "Used",
			color: "hsl(var(--destructive))",
		},
		free: {
			label: "Free",
			color: "hsl(var(--primary))",
		},
	} satisfies ChartConfig;

	const usagePercentage = React.useMemo(() => {
		return Math.round((statfs.used / statfs.total) * 100);
	}, [statfs]);

	const isEmpty = !statfs.total;

	if (isEmpty) {
		return (
			<Card className="flex flex-col h-full text-sm">
				<CardHeader className="items-center pb-0">
					<CardTitle className="flex items-center gap-2">
						<HardDrive className="h-4 w-4" />
						Storage Usage
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 pb-10 flex flex-col items-center justify-center text-center">
					<Unplug className="mb-4 h-5 w-5 text-muted-foreground" />
					<p className="text-muted-foreground">No storage data available. Mount the volume to see usage statistics.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col h-full text-sm">
			<CardHeader className="items-center pb-0">
				<CardTitle className="flex items-center gap-2">
					<HardDrive className="h-4 w-4" />
					Storage Usage
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									hideLabel
									formatter={(value, name) => [<ByteSize key={name} bytes={value as number} />, name]}
								/>
							}
						/>
						<Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
							<Label
								content={({ viewBox }) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										return (
											<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
												<tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
													{usagePercentage}%
												</tspan>
												<tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
													Used
												</tspan>
											</text>
										);
									}
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
