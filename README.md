# StockFlow Inventory Management System

A zero-install inventory application for managing products, suppliers, stock levels, and inventory movements.

## Run the application

Open `index.html` in a modern browser. No server or package installation is required.

The application starts with sample data. All edits are saved in the browser's local storage, so they persist when the page is reopened in the same browser.

## Features

- Dashboard with product count, units, low-stock alerts, inventory value, and category totals
- Product catalogue with search and stock/category filters
- Add and edit products with unique SKUs
- Stock-in, stock-out, and exact-quantity adjustments
- Protection against stock-out quantities larger than available stock
- Full stock movement audit trail
- Supplier contacts and product relationships
- Low-stock and out-of-stock status indicators
- CSV inventory export
- Responsive desktop and mobile layout

## Data storage

Data is stored under the browser key `stockflow_inventory_v1`. Clearing site data for the local page will remove saved changes and restore the starter data on the next load.
