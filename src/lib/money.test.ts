import { describe, expect, it } from "vitest";
import { computeTotals, formatMoney, toCents } from "./money.ts";

describe("toCents", () => {
	it("parses strings and numbers to integer cents", () => {
		expect(toCents("12.50")).toBe(1250);
		expect(toCents("1,250.00")).toBe(125000);
		expect(toCents(99.99)).toBe(9999);
		expect(toCents("")).toBe(0);
		expect(toCents("abc")).toBe(0);
	});
});

describe("computeTotals", () => {
	const items = [
		{ quantity: 2, unitPrice: 5000 }, // 100.00
		{ quantity: 1, unitPrice: 2500 }, // 25.00
	];

	it("sums line items into subtotal", () => {
		const t = computeTotals({
			items,
			discountType: "none",
			discountValue: 0,
			taxRate: 0,
		});
		expect(t.subtotal).toBe(12500);
		expect(t.total).toBe(12500);
	});

	it("applies a percent discount (basis points)", () => {
		const t = computeTotals({
			items,
			discountType: "percent",
			discountValue: 1000, // 10%
			taxRate: 0,
		});
		expect(t.discountAmount).toBe(1250);
		expect(t.total).toBe(11250);
	});

	it("applies a fixed discount in cents, clamped to subtotal", () => {
		const t = computeTotals({
			items,
			discountType: "fixed",
			discountValue: 99999,
			taxRate: 0,
		});
		expect(t.discountAmount).toBe(12500);
		expect(t.total).toBe(0);
	});

	it("taxes the post-discount amount", () => {
		const t = computeTotals({
			items,
			discountType: "percent",
			discountValue: 2000, // 20% -> 10000 taxable
			taxRate: 1500, // 15%
		});
		expect(t.subtotal).toBe(12500);
		expect(t.discountAmount).toBe(2500);
		expect(t.taxAmount).toBe(1500);
		expect(t.total).toBe(11500);
	});
});

describe("formatMoney", () => {
	it("formats cents as currency", () => {
		expect(formatMoney(125000, "USD")).toBe("$1,250.00");
	});
});
