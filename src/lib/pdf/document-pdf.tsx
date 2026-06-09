import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatMoney } from "#/lib/money.ts";

export interface DocPdfItem {
	name: string;
	description?: string | null;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
}

export interface DocPdfData {
	kind: "INVOICE" | "QUOTATION";
	number: string;
	status: string;
	currency: string;
	issueDate: string;
	secondaryDateLabel: string; // "Due" | "Valid until"
	secondaryDate: string;
	customer: {
		name: string;
		companyName?: string | null;
		email?: string | null;
		phone?: string | null;
		address?: string | null;
	};
	items: DocPdfItem[];
	subtotal: number;
	discountAmount: number;
	taxAmount: number;
	total: number;
	amountPaid?: number;
	dueAmount?: number;
	notes?: string | null;
	terms?: string | null;
}

const NAVY = "#0a4da0";
const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontSize: 10,
		color: "#1a2433",
		fontFamily: "Helvetica",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 24,
	},
	brand: { fontSize: 20, fontWeight: "bold", color: NAVY },
	docTitle: {
		fontSize: 22,
		fontWeight: "bold",
		color: NAVY,
		textAlign: "right",
	},
	muted: { color: "#6b7787" },
	section: { marginBottom: 16 },
	row: { flexDirection: "row", justifyContent: "space-between" },
	label: { color: "#6b7787", fontSize: 9, textTransform: "uppercase" },
	tableHead: {
		flexDirection: "row",
		backgroundColor: NAVY,
		color: "#ffffff",
		paddingVertical: 6,
		paddingHorizontal: 8,
		fontSize: 9,
	},
	tr: {
		flexDirection: "row",
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#e2e8f0",
	},
	cName: { flex: 4 },
	cQty: { flex: 1, textAlign: "right" },
	cPrice: { flex: 1.5, textAlign: "right" },
	cTotal: { flex: 1.5, textAlign: "right" },
	totals: { marginTop: 12, alignSelf: "flex-end", width: 220 },
	totalRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 2,
	},
	grandTotal: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 6,
		marginTop: 4,
		borderTopWidth: 1,
		borderTopColor: NAVY,
		fontSize: 12,
		fontWeight: "bold",
		color: NAVY,
	},
	notes: { marginTop: 24, fontSize: 9, color: "#44515f" },
});

export function DocumentPdf(data: DocPdfData) {
	const m = (c: number) => formatMoney(c, data.currency);
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					<View>
						<Text style={styles.brand}>DigiWinners</Text>
						<Text style={styles.muted}>IT Services</Text>
					</View>
					<View>
						<Text style={styles.docTitle}>{data.kind}</Text>
						<Text style={[styles.muted, { textAlign: "right" }]}>
							{data.number}
						</Text>
						<Text style={[styles.muted, { textAlign: "right" }]}>
							{data.status.replace("_", " ").toUpperCase()}
						</Text>
					</View>
				</View>

				<View style={[styles.row, styles.section]}>
					<View style={{ maxWidth: 240 }}>
						<Text style={styles.label}>Bill to</Text>
						<Text style={{ fontWeight: "bold" }}>{data.customer.name}</Text>
						{data.customer.companyName ? (
							<Text>{data.customer.companyName}</Text>
						) : null}
						{data.customer.address ? (
							<Text style={styles.muted}>{data.customer.address}</Text>
						) : null}
						{data.customer.email ? (
							<Text style={styles.muted}>{data.customer.email}</Text>
						) : null}
						{data.customer.phone ? (
							<Text style={styles.muted}>{data.customer.phone}</Text>
						) : null}
					</View>
					<View style={{ textAlign: "right" }}>
						<Text style={styles.label}>Issue date</Text>
						<Text>{data.issueDate}</Text>
						<Text style={[styles.label, { marginTop: 6 }]}>
							{data.secondaryDateLabel}
						</Text>
						<Text>{data.secondaryDate}</Text>
					</View>
				</View>

				<View>
					<View style={styles.tableHead}>
						<Text style={styles.cName}>Item</Text>
						<Text style={styles.cQty}>Qty</Text>
						<Text style={styles.cPrice}>Unit</Text>
						<Text style={styles.cTotal}>Total</Text>
					</View>
					{data.items.map((it, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static print rows
						<View style={styles.tr} key={i}>
							<View style={styles.cName}>
								<Text>{it.name}</Text>
								{it.description ? (
									<Text style={styles.muted}>{it.description}</Text>
								) : null}
							</View>
							<Text style={styles.cQty}>{it.quantity}</Text>
							<Text style={styles.cPrice}>{m(it.unitPrice)}</Text>
							<Text style={styles.cTotal}>{m(it.lineTotal)}</Text>
						</View>
					))}
				</View>

				<View style={styles.totals}>
					<View style={styles.totalRow}>
						<Text style={styles.muted}>Subtotal</Text>
						<Text>{m(data.subtotal)}</Text>
					</View>
					{data.discountAmount > 0 ? (
						<View style={styles.totalRow}>
							<Text style={styles.muted}>Discount</Text>
							<Text>− {m(data.discountAmount)}</Text>
						</View>
					) : null}
					<View style={styles.totalRow}>
						<Text style={styles.muted}>Tax</Text>
						<Text>{m(data.taxAmount)}</Text>
					</View>
					<View style={styles.grandTotal}>
						<Text>Total</Text>
						<Text>{m(data.total)}</Text>
					</View>
					{data.amountPaid !== undefined ? (
						<>
							<View style={styles.totalRow}>
								<Text style={styles.muted}>Paid</Text>
								<Text>{m(data.amountPaid)}</Text>
							</View>
							<View style={styles.totalRow}>
								<Text style={{ fontWeight: "bold" }}>Balance due</Text>
								<Text style={{ fontWeight: "bold" }}>
									{m(data.dueAmount ?? 0)}
								</Text>
							</View>
						</>
					) : null}
				</View>

				{data.notes ? (
					<View style={styles.notes}>
						<Text style={styles.label}>Notes</Text>
						<Text>{data.notes}</Text>
					</View>
				) : null}
				{data.terms ? (
					<View style={styles.notes}>
						<Text style={styles.label}>Terms</Text>
						<Text>{data.terms}</Text>
					</View>
				) : null}
			</Page>
		</Document>
	);
}
