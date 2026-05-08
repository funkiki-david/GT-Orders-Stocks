# GT Orders & Stocks Codex Handoff v1.0

## Project Goal

Build a simple internal web app for inventory, customer, and sales order management.

Current focus: front-end MVP using local seed data only.

Do not connect a production database yet.

## Current Source of Truth

Use these repo materials as the starting point:

```text
README.md
docs/ui-design-spec.md
prototypes/gt-orders-stocks-ui-prototype-v1-2-full-seed-data.html
data/inventory-seed.json
data/customers-seed.json
data/orders-seed.json
```

## Recommended Stack

Use:

- Next.js
- TypeScript
- Tailwind CSS
- Local JSON / TypeScript seed data

Do not use Railway, PostgreSQL, Supabase, Firebase, or authentication in the first coding pass.

## First Development Task

Create a Next.js front-end based on the static HTML prototype.

Required pages:

1. Inventory
2. Customer
3. Sales Order

Required components:

- App navigation
- Page header
- Quick instruction text
- Search bar
- Pill button
- Data table
- Drawer
- Metric card
- Sales order list
- Sales order detail view
- Line item table

## Data Rules

Use local seed data from the `/data` folder.

Inventory seed data should support:

- SKU Code
- Product Description
- Category
- Total Qty (CTN)

Customer seed data should support:

- Customer Name
- Number of Orders
- Sales Total
- Payment Info
- Sales Rep
- Last Order

Sales order seed data should support:

- Invoice Number
- Order Date
- Ship Date
- Customer
- PO Number
- Payment Info
- Ship Method
- Sales Rep
- Line Items

Line items should support:

- SKU Code
- Description
- Width
- Length
- Category
- Qty
- Unit Price
- Total

## Interaction Requirements

Inventory:

- Search by SKU, product description, or category.
- Show all inventory seed records in a table.
- Edit button opens a drawer.
- Save can update local state only.

Customer:

- Search by customer name, payment info, or sales rep.
- Show customer summary list.
- Edit button opens a drawer.
- Save can update local state only.

Sales Order:

- Search by invoice number, customer, PO number, SKU, or description.
- Show order list on the left.
- Show selected order detail on the right.
- Show line items for selected order.
- Line item edit opens a drawer.
- Save can update local state only.

## Important Business Rules

- Sales Order manual overrides must be allowed.
- Sales Order changes should not update Inventory or Customer master records in v1.
- Saving a Sales Order should not automatically deduct inventory in v1.
- Database schema should be designed only after the front-end workflow is confirmed.

## Do Not Build Yet

Do not build these in the first pass:

- Login
- User roles
- Railway database
- Production deployment
- Invoice generation
- Payment tracking
- Delivery tracking
- Inventory movement history
- Automatic stock deduction
- Dashboard
- Reports
- Advanced filters
- Bulk import / export

## Suggested File Structure

```text
app/
  page.tsx
  inventory/page.tsx
  customers/page.tsx
  sales-orders/page.tsx
components/
  AppShell.tsx
  Button.tsx
  DataTable.tsx
  Drawer.tsx
  MetricCard.tsx
  PageHeader.tsx
  SearchBar.tsx
  SalesOrderDetail.tsx
data/
  inventory-seed.json
  customers-seed.json
  orders-seed.json
lib/
  types.ts
  format.ts
```

## Definition of Done for First Codex Pass

The first implementation is complete when:

- The app runs locally.
- The three main pages exist.
- Local seed data loads correctly.
- Search works on each page.
- Drawers open and close.
- Sales order list and detail view work.
- Styling follows the UI design spec.
- No database connection is required.
