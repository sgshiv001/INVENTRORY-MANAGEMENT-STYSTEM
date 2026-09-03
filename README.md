# InvenTrack - Inventory Management System

InvenTrack is a browser-based inventory management application developed as an MCA academic mini project. It demonstrates how core web technologies can be used to manage products, suppliers, stock levels, and inventory transactions without requiring a backend server.

## Project details

| Field | Details |
| --- | --- |
| Programme | Master of Computer Applications (MCA) |
| Project type | Academic mini project |
| Domain | Inventory and stock management |
| Version | 1.0 |
| Academic year | 2026 |

> Before your final college submission, add your name, university roll number, college name, guide name, and GitHub repository URL to this section.

## Problem statement

Manual inventory registers are difficult to search, update, and audit. They can result in duplicate records, incorrect stock balances, and delayed reordering. InvenTrack provides a simple digital workflow with input validation, automatic calculations, low-stock alerts, and a stock movement history.

## Objectives

- Maintain a structured catalogue of products and unique SKUs.
- Record stock-in, stock-out, and quantity adjustments.
- Prevent stock-out transactions that exceed available quantity.
- Connect products with supplier contact records.
- Identify low-stock and out-of-stock products immediately.
- Calculate current inventory value automatically.
- Export product data as a CSV report.

## Modules

1. **Dashboard** - Displays product count, total units, low-stock alerts, inventory value, gross margin, category totals, and recent activity.
2. **Product management** - Supports adding, editing, deleting, searching, and filtering products.
3. **Reorder planning** - Calculates purchase quantities and estimated cost for products at or below reorder level.
4. **Stock movement management** - Maintains an audit trail for incoming stock, outgoing stock, and manual adjustments.
5. **Supplier management** - Stores supplier companies, contact details, and product relationships.
6. **Reports** - Exports the current product catalogue and stock data as CSV.
7. **Project overview** - Explains the objective, modules, data model, and normal workflow inside the application.

## Main features

- Responsive dashboard for desktop, tablet, and mobile
- Product search and category/stock filters
- Unique SKU validation
- Automatic low-stock and out-of-stock status
- Inventory valuation in Indian rupees
- Gross margin and stock health indicators
- Suggested reorder quantities with supplier names
- Stock availability validation
- Complete inventory movement ledger
- Supplier-to-product relationships
- CSV export
- CSV import for replacing the current product catalogue
- Persistent browser storage
- Demo data reset for classroom presentation

## Technology stack

| Technology | Purpose |
| --- | --- |
| HTML5 | Semantic application structure and forms |
| CSS3 | Responsive layout, components, and visual design |
| JavaScript (ES6+) | Application logic, validation, filtering, and rendering |
| Python 3 | Generates CSV and Markdown inventory reports from demo data |
| Web Storage API | Local persistence using `localStorage` |
| Git and GitHub | Version control and project hosting |

No external framework, library, database server, or package installation is required.

## Data model

The application uses three related collections:

- **Supplier:** `id`, `name`, `contact`, `phone`, `email`, `address`
- **Product:** `id`, `name`, `sku`, `category`, `quantity`, `reorder`, `cost`, `price`, `supplierId`
- **Movement:** `id`, `productId`, `type`, `quantity`, `balance`, `reference`, `notes`, `date`

Relationship summary:

```text
Supplier (1) -------- (N) Product (1) -------- (N) Stock Movement
```

## Run locally

1. Clone or download this repository.
2. Open the project folder.
3. Double-click `index.html`, or open it in any modern web browser.

The application starts with realistic sample data. Changes are saved in the current browser under the key `inventrack_mca_v1`.

## How to use

1. Open **Suppliers** and create a supplier record.
2. Open **Products** and add a product with its SKU, quantity, prices, and reorder level.
3. Use **Stock Movements** to record incoming or outgoing inventory.
4. Open **Reorder Plan** to review suggested purchase quantities and estimated cost.
5. Review alerts and totals on the **Dashboard**.
6. Select **Export CSV** to download the current inventory report.
7. Select **Import CSV** to load a product catalogue with the same product columns used by the export file.
8. Open **About Project** and use **Reset demo data** before a classroom demonstration if needed.

## Python report generator

The repository includes a small Python utility for preparing project-submission reports from the demo inventory.

```bash
python tools/inventory_report.py
```

By default, it creates:

- `reports/inventory.csv`
- `reports/summary.md`

You can also choose custom output paths:

```bash
python tools/inventory_report.py --csv reports/custom.csv --summary reports/custom-summary.md
```

## Project structure

```text
inventrack/
|-- index.html     # Application screens, dialogs, and semantic structure
|-- styles.css     # Design system and responsive layouts
|-- app.js         # Data model, business rules, storage, and rendering
|-- tools/         # Python reporting utility
|-- reports/       # Generated CSV and Markdown inventory reports
|-- README.md      # Project documentation
`-- .gitattributes # Repository text-file settings
```

## Validation and business rules

- Product name, SKU, category, quantity, reorder level, and prices are required.
- Every SKU must be unique, regardless of letter case.
- Quantity and price fields cannot contain negative values.
- A stock-out transaction cannot exceed the available stock.
- Editing a product does not directly change its quantity; quantity changes must be recorded as movements.
- Deleting a supplier safely removes its association from related products.
- User-entered text is escaped before it is added to generated table/card markup.
- Imported CSV files must include Name, SKU, Category, Quantity, Reorder Level, Cost Price, and Selling Price columns.

## Suggested test cases

| Test | Expected result |
| --- | --- |
| Add a valid product | Product appears in the catalogue and dashboard totals update |
| Add a duplicate SKU | Application shows a validation message |
| Remove more stock than available | Transaction is blocked |
| Reduce quantity to the reorder level | Product appears in low-stock alerts |
| Open Reorder Plan with low stock items | Suggested purchase quantities and estimated cost are shown |
| Search by name, SKU, or category | Matching product rows are displayed |
| Delete a supplier | Products remain, but the supplier link is cleared |
| Reload the page | Saved records remain available |
| Reset demo data | Original sample records are restored |
| Run `python tools/inventory_report.py` | CSV and Markdown reports are generated successfully |

## Limitations

- Data is stored only in the current browser and is not shared between devices.
- The current version does not include user authentication or role-based access.
- It is intended for academic demonstration and small, single-user datasets.

## Future scope

- Backend API with MySQL or MongoDB
- User login and role-based authorization
- Purchase orders and sales invoices
- Barcode scanning
- PDF reports and analytics charts
- Cloud deployment and multi-device synchronization

## License

This repository is intended for educational use. Add the license required by your institution before publishing or accepting contributions.
