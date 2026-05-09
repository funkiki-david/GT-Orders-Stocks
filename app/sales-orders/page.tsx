'use client';

import { useMemo, useState } from 'react';
import ordersSeed from '@/data/orders-seed.json';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { SalesOrderDetail } from '@/components/SalesOrderDetail';
import { SearchBar } from '@/components/SearchBar';
import { formatCurrency } from '@/lib/format';
import type { SalesOrder, SalesOrderLineItem } from '@/lib/types';

type SortKey = 'date-desc' | 'date-asc' | 'sales-order-asc' | 'sales-order-desc' | 'customer-asc' | 'customer-desc';

function sortOrders(orders: SalesOrder[], sortKey: SortKey) {
  const sorted = [...orders];

  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'date-asc':
        return a.date.localeCompare(b.date);
      case 'date-desc':
        return b.date.localeCompare(a.date);
      case 'sales-order-asc':
        return a.invoice.localeCompare(b.invoice);
      case 'sales-order-desc':
        return b.invoice.localeCompare(a.invoice);
      case 'customer-asc':
        return a.customer.localeCompare(b.customer);
      case 'customer-desc':
        return b.customer.localeCompare(a.customer);
      default:
        return 0;
    }
  });

  return sorted;
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>(ordersSeed as SalesOrder[]);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');
  const [selectedInvoice, setSelectedInvoice] = useState<string>((ordersSeed as SalesOrder[])[0]?.invoice ?? '');
  const [editingLine, setEditingLine] = useState<SalesOrderLineItem | null>(null);
  const [draftLine, setDraftLine] = useState<SalesOrderLineItem | null>(null);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchedOrders = normalizedQuery
      ? orders.filter((order) =>
          [
            order.invoice,
            order.customer,
            order.po,
            order.payment,
            order.items.map((item) => `${item.sku} ${item.description}`).join(' '),
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : orders;

    return sortOrders(matchedOrders, sortKey);
  }, [orders, query, sortKey]);

  const selectedOrder = filteredOrders.find((order) => order.invoice === selectedInvoice) ?? filteredOrders[0];
  const salesTotal = filteredOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
  const customerCount = new Set(filteredOrders.map((order) => order.customer)).size;

  function openLineDrawer(line: SalesOrderLineItem) {
    setEditingLine(line);
    setDraftLine({ ...line });
  }

  function saveLineDraft() {
    if (!draftLine || !editingLine || !selectedOrder) return;

    const updatedLine = {
      ...draftLine,
      total: Number(draftLine.qty || 0) * Number(draftLine.unitPrice || 0),
    };

    setOrders((current) =>
      current.map((order) => {
        if (order.invoice !== selectedOrder.invoice) {
          return order;
        }

        const items = order.items.map((line) =>
          line.sku === editingLine.sku && line.description === editingLine.description ? updatedLine : line,
        );
        const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
        const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);

        return {
          ...order,
          items,
          totalQty,
          subtotal,
        };
      }),
    );

    setEditingLine(null);
    setDraftLine(null);
  }

  function handleSearch(value: string) {
    setQuery(value);
    const normalizedQuery = value.trim().toLowerCase();
    const firstMatch = sortOrders(orders, sortKey).find((order) =>
      [
        order.invoice,
        order.customer,
        order.po,
        order.payment,
        order.items.map((item) => `${item.sku} ${item.description}`).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );

    if (firstMatch) {
      setSelectedInvoice(firstMatch.invoice);
    }
  }

  function handleSortChange(value: SortKey) {
    setSortKey(value);
    const sorted = sortOrders(filteredOrders, value);

    if (sorted.length > 0) {
      setSelectedInvoice(sorted[0].invoice);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Sales Order" instruction="Step 1: select a Sales Order from the left. Step 2: review or edit details on the right." />

      <div className="mb-3 rounded-xl border border-border bg-card p-2.5 text-xs text-secondaryText">
        Sales Orders use local seed data only. Saving line edits updates React state and does not deduct inventory.
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2">
        <div className="flex flex-wrap gap-4 text-[13px] text-primaryText">
          <span><strong>{filteredOrders.length}</strong> Sales Orders</span>
          <span><strong>{customerCount}</strong> Customers</span>
          <span><strong>{formatCurrency(salesTotal)}</strong> Total Amount</span>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <SearchBar value={query} onChange={handleSearch} placeholder="Search Sales Order / Customer / PO / SKU / Description" />
        <Button variant="primary" onClick={() => undefined}>Create Sales Order</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[460px_1fr]">
        <section className="rounded-xl border border-border bg-card p-3">
          <div className="mb-3 rounded-xl bg-warningBg p-3 text-sm text-warningText">
            <strong>Step 1:</strong> Click a Sales Order below. The selected row turns bold and the detail opens on the right.
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="font-title text-base font-semibold text-primaryText">Sales Order List</div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-secondaryText" htmlFor="order-sort-left">Sort</label>
              <select
                id="order-sort-left"
                value={sortKey}
                onChange={(event) => handleSortChange(event.target.value as SortKey)}
                className="h-8 rounded-full border border-border bg-white px-3 text-[13px] text-primaryText"
              >
                <option value="date-desc">Date: Newest</option>
                <option value="date-asc">Date: Oldest</option>
                <option value="sales-order-asc">Sales Order #: A-Z</option>
                <option value="sales-order-desc">Sales Order #: Z-A</option>
                <option value="customer-asc">Customer: A-Z</option>
                <option value="customer-desc">Customer: Z-A</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-header">
                <tr>
                  <th className="h-9 w-[42%] border-b border-border px-2 text-left font-semibold text-primaryText">Sales Order #</th>
                  <th className="h-9 w-[24%] border-b border-border px-2 text-left font-semibold text-primaryText">Date</th>
                  <th className="h-9 w-[34%] border-b border-border px-2 text-left font-semibold text-primaryText">Customer</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const isSelected = order.invoice === selectedOrder?.invoice;

                  return (
                    <tr
                      key={order.invoice}
                      onClick={() => setSelectedInvoice(order.invoice)}
                      className={`cursor-pointer hover:bg-page ${isSelected ? 'bg-page font-semibold' : ''}`}
                    >
                      <td className="border-b border-border px-2 py-2 text-primaryText">{order.invoice}</td>
                      <td className="border-b border-border px-2 py-2 text-primaryText">{order.date}</td>
                      <td className="border-b border-border px-2 py-2 text-primaryText">{order.customer}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border-2 border-primaryButton/30 bg-white p-3">
          <div className="mb-3 rounded-xl bg-successBg p-3 text-sm text-successText">
            <strong>Step 2:</strong> Review the selected Sales Order here. Current selection: <strong>{selectedOrder?.invoice ?? 'None'}</strong>
          </div>
          <SalesOrderDetail order={selectedOrder} onEditLine={openLineDrawer} />
        </section>
      </div>

      <Drawer
        title="Edit Line Item"
        helper="Line item changes update this Sales Order only. They do not update Inventory master data."
        open={Boolean(draftLine)}
        onClose={() => {
          setEditingLine(null);
          setDraftLine(null);
        }}
        onSave={saveLineDraft}
      >
        {draftLine ? (
          <div className="grid gap-4">
            <FormField label="SKU Code" value={draftLine.sku} onChange={(value) => setDraftLine({ ...draftLine, sku: value })} />
            <FormField
              label="Description"
              value={draftLine.description}
              onChange={(value) => setDraftLine({ ...draftLine, description: value })}
              multiline
            />
            <FormField label="Width" value={draftLine.width} onChange={(value) => setDraftLine({ ...draftLine, width: value })} />
            <FormField label="Length" value={draftLine.length} onChange={(value) => setDraftLine({ ...draftLine, length: value })} />
            <FormField label="Category" value={draftLine.category} onChange={(value) => setDraftLine({ ...draftLine, category: value })} />
            <FormField
              label="Qty (CTN)"
              type="number"
              value={draftLine.qty}
              onChange={(value) => setDraftLine({ ...draftLine, qty: Number(value) })}
            />
            <FormField
              label="Unit Price"
              type="number"
              value={draftLine.unitPrice}
              onChange={(value) => setDraftLine({ ...draftLine, unitPrice: Number(value) })}
            />
            <div className="rounded-xl bg-page p-3 text-sm text-primaryText">
              Preview Total: {formatCurrency(Number(draftLine.qty || 0) * Number(draftLine.unitPrice || 0))}
            </div>
            <div className="rounded-xl bg-warningBg p-3 text-xs text-warningText">
              Do not deduct inventory in v1. Inventory deduction should be designed after shipment workflow is defined.
            </div>
          </div>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
