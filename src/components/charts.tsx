import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
} from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart.tsx";
import { formatMoney } from "#/lib/money.ts";

const MONEY_CONFIG = {
	value: { label: "Amount", color: "var(--chart-1)" },
} satisfies ChartConfig;

// Donut palette pulls from the brand chart token ramp.
const DONUT_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

/** Monthly revenue bars. data: {label, value(cents)}[] */
export function RevenueBars({
	data,
	className,
}: {
	data: { label: string; value: number }[];
	className?: string;
}) {
	return (
		<ChartContainer
			config={MONEY_CONFIG}
			className={className ?? "h-64 w-full"}
		>
			<BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					fontSize={11}
				/>
				<ChartTooltip
					content={
						<ChartTooltipContent
							formatter={(v) => formatMoney(Number(v))}
							hideLabel={false}
						/>
					}
				/>
				<Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
			</BarChart>
		</ChartContainer>
	);
}

/** Revenue trend area. data: {label, value(cents)}[] */
export function RevenueArea({
	data,
	className,
}: {
	data: { label: string; value: number }[];
	className?: string;
}) {
	return (
		<ChartContainer
			config={MONEY_CONFIG}
			className={className ?? "h-72 w-full"}
		>
			<AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
				<defs>
					<linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
						<stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
					</linearGradient>
				</defs>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					fontSize={11}
				/>
				<ChartTooltip
					content={
						<ChartTooltipContent formatter={(v) => formatMoney(Number(v))} />
					}
				/>
				<Area
					dataKey="value"
					type="monotone"
					stroke="var(--chart-1)"
					strokeWidth={2}
					fill="url(#revFill)"
				/>
			</AreaChart>
		</ChartContainer>
	);
}

/** Categorical donut. data: {name, value(cents)}[] */
export function CategoryDonut({
	data,
	className,
}: {
	data: { name: string; value: number }[];
	className?: string;
}) {
	const config: ChartConfig = Object.fromEntries(
		data.map((d, i) => [
			d.name,
			{ label: d.name, color: DONUT_COLORS[i % DONUT_COLORS.length] },
		]),
	);
	return (
		<ChartContainer
			config={config}
			className={className ?? "mx-auto aspect-square max-h-56"}
		>
			<PieChart>
				<ChartTooltip
					content={
						<ChartTooltipContent
							nameKey="name"
							formatter={(v) => formatMoney(Number(v))}
						/>
					}
				/>
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					innerRadius="55%"
					outerRadius="85%"
					paddingAngle={2}
				>
					{data.map((d, i) => (
						<Cell key={d.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}

/** Single-value progress donut with a centered percentage label. */
export function ProgressDonut({
	value,
	label = "Completed",
	size = 150,
}: {
	value: number;
	label?: string;
	size?: number;
}) {
	const pct = Math.max(0, Math.min(100, value));
	const data = [
		{ name: "done", value: pct },
		{ name: "rest", value: 100 - pct },
	];
	return (
		<div className="relative" style={{ width: size, height: size }}>
			<ChartContainer
				config={{ done: { label: "Done", color: "var(--chart-1)" } }}
				className="h-full w-full"
			>
				<PieChart>
					<Pie
						data={data}
						dataKey="value"
						innerRadius="72%"
						outerRadius="100%"
						startAngle={90}
						endAngle={-270}
						stroke="none"
					>
						<Cell fill="var(--chart-1)" />
						<Cell fill="var(--muted)" />
					</Pie>
				</PieChart>
			</ChartContainer>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="text-2xl font-bold tabular-nums">{pct}%</span>
				<span className="text-muted-foreground text-xs">{label}</span>
			</div>
		</div>
	);
}
