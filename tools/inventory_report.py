"""Generate simple inventory reports for the InvenTrack demo data.

Usage:
    python tools/inventory_report.py
    python tools/inventory_report.py --csv reports/inventory.csv --summary reports/summary.md
"""

from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from pathlib import Path


SUPPLIERS = {
    "s1": "Nova Tech Distributors",
    "s2": "GreenLeaf Wholesale",
    "s3": "Metro Office Supplies",
}

PRODUCTS = [
    {"name": "Wireless Keyboard", "sku": "ELEC-001", "category": "Electronics", "quantity": 28, "reorder": 10, "cost": 1250, "price": 1899, "supplierId": "s1"},
    {"name": "USB-C Hub 7-in-1", "sku": "ELEC-014", "category": "Electronics", "quantity": 7, "reorder": 8, "cost": 1750, "price": 2499, "supplierId": "s1"},
    {"name": "A4 Premium Paper", "sku": "STAT-021", "category": "Stationery", "quantity": 64, "reorder": 15, "cost": 245, "price": 349, "supplierId": "s3"},
    {"name": "Ergonomic Office Chair", "sku": "FURN-005", "category": "Furniture", "quantity": 4, "reorder": 5, "cost": 7200, "price": 9999, "supplierId": "s3"},
    {"name": "Organic Green Tea", "sku": "PAN-032", "category": "Pantry", "quantity": 42, "reorder": 12, "cost": 180, "price": 275, "supplierId": "s2"},
    {"name": "Desk Organizer", "sku": "STAT-044", "category": "Stationery", "quantity": 0, "reorder": 6, "cost": 320, "price": 499, "supplierId": "s3"},
]


@dataclass(frozen=True)
class Summary:
    products: int
    units: int
    inventory_value: int
    potential_margin: int
    low_stock: int
    out_of_stock: int


def rupees(amount: int) -> str:
    return f"Rs. {amount:,.0f}"


def product_status(product: dict) -> str:
    if product["quantity"] == 0:
        return "Out of stock"
    if product["quantity"] <= product["reorder"]:
        return "Low stock"
    return "In stock"


def suggested_reorder_qty(product: dict) -> int:
    if product["quantity"] > product["reorder"]:
        return 0
    return max(product["reorder"] * 2 - product["quantity"], product["reorder"] - product["quantity"])


def build_summary() -> Summary:
    return Summary(
        products=len(PRODUCTS),
        units=sum(product["quantity"] for product in PRODUCTS),
        inventory_value=sum(product["quantity"] * product["cost"] for product in PRODUCTS),
        potential_margin=sum(product["quantity"] * (product["price"] - product["cost"]) for product in PRODUCTS),
        low_stock=sum(1 for product in PRODUCTS if product["quantity"] <= product["reorder"]),
        out_of_stock=sum(1 for product in PRODUCTS if product["quantity"] == 0),
    )


def write_csv(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Name", "SKU", "Category", "Quantity", "Reorder Level", "Suggested Reorder", "Cost", "Price", "Value", "Margin", "Supplier", "Status"])
        for product in PRODUCTS:
            writer.writerow([
                product["name"],
                product["sku"],
                product["category"],
                product["quantity"],
                product["reorder"],
                suggested_reorder_qty(product),
                product["cost"],
                product["price"],
                product["quantity"] * product["cost"],
                product["quantity"] * (product["price"] - product["cost"]),
                SUPPLIERS.get(product["supplierId"], ""),
                product_status(product),
            ])


def write_summary(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    summary = build_summary()
    low_stock = [product for product in PRODUCTS if product["quantity"] <= product["reorder"]]
    reorder_units = sum(suggested_reorder_qty(product) for product in low_stock)
    reorder_cost = sum(suggested_reorder_qty(product) * product["cost"] for product in low_stock)
    lines = [
        "# InvenTrack Inventory Summary",
        "",
        f"- Total products: {summary.products}",
        f"- Units in stock: {summary.units}",
        f"- Inventory value: {rupees(summary.inventory_value)}",
        f"- Potential gross margin: {rupees(summary.potential_margin)}",
        f"- Low-stock products: {summary.low_stock}",
        f"- Out-of-stock products: {summary.out_of_stock}",
        f"- Suggested reorder units: {reorder_units}",
        f"- Estimated reorder budget: {rupees(reorder_cost)}",
        "",
        "## Reorder Attention",
        "",
    ]
    if low_stock:
        lines.extend(f"- {product['name']} ({product['sku']}): order {suggested_reorder_qty(product)} units from {SUPPLIERS.get(product['supplierId'], 'Unassigned supplier')}" for product in low_stock)
    else:
        lines.append("- No products need reordering.")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate CSV and Markdown reports for the InvenTrack demo inventory.")
    parser.add_argument("--csv", default="reports/inventory.csv", help="CSV output path.")
    parser.add_argument("--summary", default="reports/summary.md", help="Markdown summary output path.")
    args = parser.parse_args()

    write_csv(Path(args.csv))
    write_summary(Path(args.summary))
    summary = build_summary()
    print(f"Generated reports for {summary.products} products.")
    print(f"Inventory value: {rupees(summary.inventory_value)}")
    print(f"Potential gross margin: {rupees(summary.potential_margin)}")


if __name__ == "__main__":
    main()
