# Seed Data Notes

This folder contains local seed data for GT Orders & Stocks front-end development.

## Files

- `inventory-seed.json`: Inventory SKU summary from La Mirada Warehouse.
- `customers-seed.json`: Customer summary derived from sales orders.
- `orders-seed.json`: Sales order seed data grouped by invoice / order number.

## Purpose

These files are for UI development and workflow testing only.

They are not the final database schema.

## Current Data Coverage

Inventory source:

- Stock Counts in La Mirada Warehouse - Import to ERP
- SKU summary records
- Product Description
- Category
- Total Qty (CTN)

Sales order source:

- Sales Orders Jan-April 2026
- Amcad Graphic
- Digital Media Warehouse
- Graphic Associates
- Buffalo Image
- Kirin Global Supply
- Printers
- CyanGraphics

Sheet8 was empty at the time of extraction.

## Development Rule

Use this seed data locally first. Do not connect Railway or any production database until the Inventory, Customer, and Sales Order front-end workflows are stable.
