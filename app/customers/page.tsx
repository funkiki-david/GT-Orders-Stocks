'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import customersSeed from '@/data/customers-seed.json';
import ordersSeed from '@/data/orders-seed.json';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { Drawer } from '@/components/Drawer';
import { FormField } from '@/components/FormField';
import { MetricCard } from '@/components/MetricCard';
import { PageHeader } from '@/components/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { formatCurrency } from '@/lib/format';
import type { Customer, SalesOrder, SalesOrderLineItem } from '@/lib/types';

type PaymentDraft = {
  invoice: string;
  payment: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(customersSeed as Customer[]);
  const [orders, setOrders] = useState<SalesOrder[]>(ordersSeed as SalesOrder[]);
  const [query, setQuery] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>((customersSeed as Customer[])[0]?.name ?? '');
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [draft, setDraft] = useState<Customer | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft | null>(null);
  const [editingLine, setEditingLine] = useState<SalesOrderLineItem | null>(null);
  const [draftLine, setDraftLine] = useState<SalesOrderLineItem | null>(null);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.payment, customer.salesRep].join(' ').toLowerCase().includes(normalizedQuery),
    );
  }, [customers, query]);

  const selectedCustomer =
    filteredCustomers.find((customer) => customer.name === selectedCustomerName) ?? filteredCustomers[0];

  const selectedCustomerOrders = useMemo(() => {
    if (!selectedCustomer) return [];

    return orders.filter((order) => order.customer.toLowerCase() === selectedCustomer.name.toLowerCase());
  }, [orders, selectedCustomer]);

  const selectedOrder =
    selectedCustomerOrders.find((order) => order.invoice === selectedInvoice) ?? selectedCustomerOrders[0];

  const salesTotal = filteredCustomers.reduce((sum, customer) => sum + Number(customer.total || 0), 0);
  const orderTotal = filteredCustomers.reduce((sum, customer) => sum + Number(customer.orders || 0), 0);
  const waitingCount = filteredCustomers.filter((customer) => customer.payment.toLowerCase().includes('waiting')).length;

  function selectCustomer(customer: Customer) {
    setSelectedCustomerName(customer.name);
    const firstOrder = orders.find((order) => order.customer.toLowerCase() === customer.name.toLowerCase());
    setSelectedInvoice(firstOrder?.invoice ?? '');
  }

  function openEditCustomerDrawer(customer: Customer) {
    setEditingCustomer(customer);
    setDraft({ ...customer });
  }

  function openAddCustomerDrawer() {
    const blankCustomer: Customer = {
      name: '',
      orders: 0,
      total: 0,
      payment: '',
      salesRep: '',
      lastOrder: '',
    };
    setEditingCustomer(null);
    setDraft(blankCustomer);
  }

  function saveCustomerDraft() {
    if (!draft) return;

    if (editingCustomer) {
      setCustomers((current) => current.map((customer) => (customer.name === editingCustomer.name ? draft : customer)));
      setSelectedCustomerName(draft.name);
    } else {
      setCustomers((current) => [draft, ...current]);
      setSelectedCustomerName(draft.name);
    }

    setDraft(null);
    setEditingCustomer(null);
  }

  function openPaymentDrawer(order: SalesOrder) {
    setPaymentDraft({ invoice: order.invoice, payment: order.payment });
  }

  function savePaymentDraft() {
    if (!paymentDraft) return;

    setOrders((current) =>
      current.map((order) =>
        order.invoice === paymentDraft.invoice ? { ...order, payment: paymentDraft.payment } : order,
      ),
    );
    setPaymentDraft(null);
  }

  function openLineDrawer(line: SalesOrderLineItem) {
    setEditingLine(line);
    setDraftLine({ ...line });
  }

  function saveLineDraft() {
    if (!draftLine || !editingLine || !selectedOrder) return;

    const updatedLine: SalesOrderLineItem = {
      ...draftLine,
      total: Number(draftLine.qty || 0) * Number(draftLine.unitPrice || 0),
    };

    setOrders((current) =>
      current.map((order) => {
        if (order.invoice !== selectedOrder.invoice) return order;

        const items = order.items.map((line) =>
          line.sku === editingLine.sku && line.description === editingLine.description ? updatedLine : line,
        );
        const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
        const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);

        return { ...order, items, totalQty, subtotal };
      }),
    );

    setEditingLine(null);
    setDraftLine(null);
  }

  return (
    <AppShell>
      <PageHeader
        title="Customer"
        instruction="Select a customer to review their profile, orders, and order detail history."
      />

      <div className="mb-4 rounded-xl border border-border bg-card p-3 text-xs text-secondaryText">
        QuickBooks-style workflow: view order history inside the customer page; use View Full Order only when deeper Sales Order editing is needed.
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricCard label="Customers" value={filteredCustomers.length} />
        <MetricCard label="Total Orders" value={orderTotal} />
        <MetricCard label="Sales Total" value={formatCurrency(salesTotal)} />
        <MetricCard label="Waiting Status" value={waitingCount} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchBar value={query} onChange={setQuery} placeholder="Search Customer / Payment / Sales Rep" />
        <Button variant="primary" onClick={openAddCustomerDrawer}>Add Customer</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <DataTable
          rows={filteredCustomers}
          rowKey={(customer) => customer.name}
          activeRowKey={selectedCustomer?.name}
          onRowClick={selectCustomer}
          columns={[
            { key: 'name', header: 'Customer Name', render: (customer) => customer.name },
            { key: 'orders', header: 'Orders', align: 'center', render: (customer) => customer.orders },
            { key: 'total', header: 'Sales Total', align: 'right', render: (customer) => formatCurrency(customer.total) },
          ]}
        />

        <CustomerDetailPanel
          customer={selectedCustomer}
          orders={selectedCustomerOrders}
          selectedOrder={selectedOrder}
          onSelectOrder={(order) => setSelectedInvoice(order.invoice)}
          onEditCustomer={openEditCustomerDrawer}
          onEditPayment={openPaymentDrawer}
          onEditLine={openLineDrawer}
        />
      </div>

      <Drawer
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        helper="Customer Name is required. Save updates local React state only."
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        onSave={saveCustomerDraft}
      >
        {draft ? (
          <div className="grid gap-4">
            <FormField label="Customer Name *" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
            <FormField label="Orders" type="number" value={draft.orders} onChange={(value) => setDraft({ ...draft, orders: Number(value) })} />
            <FormField label="Sales Total" type="number" value={draft.total} onChange={(value) => setDraft({ ...draft, total: Number(value) })} />
            <FormField label="Payment Info" value={draft.payment} onChange={(value) => setDraft({ ...draft, payment: value })} />
            <FormField label="Sales Rep" value={draft.salesRep} onChange={(value) => setDraft({ ...draft, salesRep: value })} />
            <FormField label="Last Order" value={draft.lastOrder} onChange={(value) => setDraft({ ...draft, lastOrder: value })} />
            <FormField label="Default Shipping Address" value="" multiline />
          </div>
        ) : null}
      </Drawer>

      <Drawer
        title="Edit Payment"
        helper="This quick edit updates the selected order payment info in local state only."
        open={Boolean(paymentDraft)}
        onClose={() => setPaymentDraft(null)}
        onSave={savePaymentDraft}
      >
        {paymentDraft ? (
          <div className="grid gap-4">
            <FormField label="Invoice #" value={paymentDraft.invoice} />
            <FormField label="Payment Info" value={paymentDraft.payment} onChange={(value) => setPaymentDraft({ ...paymentDraft, payment: value })} />
            <div className="rounded-xl bg-warningBg p-3 text-xs text-warningText">
              Suggested values: Waiting, Paid, SQ Invoice, Consignment, or custom text.
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        title="Edit Line Item"
        helper="Line item changes update this order only. They do not update Inventory master data."
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
            <FormField label="Description" value={draftLine.description} onChange={(value) => setDraftLine({ ...draftLine, description: value })} multiline />
            <FormField label="Width" value={draftLine.width} onChange={(value) => setDraftLine({ ...draftLine, width: value })} />
            <FormField label="Length" value={draftLine.length} onChange={(value) => setDraftLine({ ...draftLine, length: value })} />
            <FormField label="Category" value={draftLine.category} onChange={(value) => setDraftLine({ ...draftLine, category: value })} />
            <FormField label="Qty (CTN)" type="number" value={draftLine.qty} onChange={(value) => setDraftLine({ ...draftLine, qty: Number(value) })} />
            <FormField label="Unit Price" type="number" value={draftLine.unitPrice} onChange={(value) => setDraftLine({ ...draftLine, unitPrice: Number(value) })} />
            <div className="rounded-xl bg-page p-3 text-sm text-primaryText">
              Preview Total: {formatCurrency(Number(draftLine.qty || 0) * Number(draftLine.unitPrice || 0))}
            </div>
          </div>
        ) : null}
      </Drawer>
    </AppShell>
  );
}

function CustomerDetailPanel({
  customer,
  orders,
  selectedOrder,
  onSelectOrder,
  onEditCustomer,
  onEditPayment,
  onEditLine,
}: {
  customer?: Customer;
  orders: SalesOrder[];
  selectedOrder?: SalesOrder;
  onSelectOrder: (order: SalesOrder) => void;
  onEditCustomer: (customer: Customer) => void;
  onEditPayment: (order: SalesOrder) => void;
  onEditLine: (line: SalesOrderLineItem) => void;
}) {
  if (!customer) {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-title text-base font-semibold text-primaryText">Customer Detail</h2>
        <p className="mt-2 text-sm text-secondaryText">No customer selected.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-title text-base font-semibold text-primaryText">{customer.name}</h2>
          <p className="mt-1 text-xs text-helperText">Customer profile, order history, and quick order actions.</p>
        </div>
        <Button onClick={() => onEditCustomer(customer)}>Edit Customer</Button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricCard label="Orders" value={orders.length} />
        <MetricCard label="Sales Total" value={formatCurrency(customer.total)} />
        <MetricCard label="Payment Info" value={customer.payment || '—'} />
        <MetricCard label="Last Order" value={customer.lastOrder || '—'} />
      </div>

      <div className="mb-4">
        <div className="mb-2 font-title text-base font-semibold text-primaryText">Orders from this Customer</div>
        <DataTable
          rows={orders}
          rowKey={(order) => order.invoice}
          activeRowKey={selectedOrder?.invoice}
          onRowClick={onSelectOrder}
          emptyMessage="No orders found for this customer."
          columns={[
            { key: 'invoice', header: 'Invoice #', render: (order) => order.invoice },
            { key: 'date', header: 'Date', render: (order) => order.date },
            { key: 'po', header: 'PO #', render: (order) => order.po || '—' },
            { key: 'payment', header: 'Status', render: (order) => order.payment || '—' },
            { key: 'subtotal', header: 'Subtotal', align: 'right', render: (order) => formatCurrency(order.subtotal) },
          ]}
        />
      </div>

      <SelectedCustomerOrderDetail order={selectedOrder} onEditPayment={onEditPayment} onEditLine={onEditLine} />
    </section>
  );
}

function SelectedCustomerOrderDetail({
  order,
  onEditPayment,
  onEditLine,
}: {
  order?: SalesOrder;
  onEditPayment: (order: SalesOrder) => void;
  onEditLine: (line: SalesOrderLineItem) => void;
}) {
  if (!order) {
    return <div className="rounded-xl border border-border bg-page p-4 text-sm text-secondaryText">Select an order to view line item details.</div>;
  }

  return (
    <div className="rounded-xl border border-border bg-page p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-title text-base font-semibold text-primaryText">Selected Order Detail</div>
          <div className="mt-1 text-xs text-helperText">
            {order.invoice} · {order.date} · PO {order.po || '—'} · Payment: {order.payment || '—'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/sales-orders?invoice=${encodeURIComponent(order.invoice)}`}>
            <Button>View Full Order</Button>
          </Link>
          <Button onClick={() => onEditPayment(order)}>Edit Payment</Button>
        </div>
      </div>

      <DataTable
        rows={order.items}
        rowKey={(line: SalesOrderLineItem, index) => `${line.sku}-${index}`}
        columns={[
          { key: 'sku', header: 'SKU', render: (line) => line.sku },
          { key: 'description', header: 'Description', render: (line) => line.description },
          { key: 'qty', header: 'Qty', align: 'center', render: (line) => line.qty },
          { key: 'unit', header: 'Unit', align: 'right', render: (line) => formatCurrency(line.unitPrice) },
          { key: 'total', header: 'Total', align: 'right', render: (line) => formatCurrency(line.total || line.qty * line.unitPrice) },
          { key: 'action', header: 'Action', align: 'center', render: (line) => <Button size="small" onClick={() => onEditLine(line)}>Edit</Button> },
        ]}
      />
    </div>
  );
}
