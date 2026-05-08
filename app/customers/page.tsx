'use client';

import { useMemo, useState } from 'react';
import customersSeed from '@/data/customers-seed.json';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { Drawer } from '@/components/Drawer';
import { FormField } from '@/components/FormField';
import { MetricCard } from '@/components/MetricCard';
import { PageHeader } from '@/components/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { formatCurrency } from '@/lib/format';
import type { Customer } from '@/lib/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(customersSeed as Customer[]);
  const [query, setQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [draft, setDraft] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.payment, customer.salesRep].join(' ').toLowerCase().includes(normalizedQuery),
    );
  }, [customers, query]);

  const salesTotal = filteredCustomers.reduce((sum, customer) => sum + Number(customer.total || 0), 0);
  const orderTotal = filteredCustomers.reduce((sum, customer) => sum + Number(customer.orders || 0), 0);
  const waitingCount = filteredCustomers.filter((customer) => customer.payment.toLowerCase().includes('waiting')).length;

  function openEditDrawer(customer: Customer) {
    setEditingCustomer(customer);
    setDraft({ ...customer });
  }

  function openAddDrawer() {
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

  function saveDraft() {
    if (!draft) return;

    if (editingCustomer) {
      setCustomers((current) => current.map((customer) => (customer.name === editingCustomer.name ? draft : customer)));
    } else {
      setCustomers((current) => [draft, ...current]);
    }

    setDraft(null);
    setEditingCustomer(null);
  }

  return (
    <AppShell>
      <PageHeader title="Customer" instruction="Customers are extracted from the Sales Orders seed data." />

      <div className="mb-4 rounded-xl border border-border bg-card p-3 text-xs text-secondaryText">
        Customer summary is generated from local sales order seed data. Missing contact/address fields can be completed later.
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricCard label="Customers" value={filteredCustomers.length} />
        <MetricCard label="Total Orders" value={orderTotal} />
        <MetricCard label="Sales Total" value={formatCurrency(salesTotal)} />
        <MetricCard label="Waiting Status" value={waitingCount} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchBar value={query} onChange={setQuery} placeholder="Search Customer / Payment / Sales Rep" />
        <Button variant="primary" onClick={openAddDrawer}>Add Customer</Button>
      </div>

      <DataTable
        rows={filteredCustomers}
        rowKey={(customer) => customer.name}
        columns={[
          { key: 'name', header: 'Customer Name', render: (customer) => customer.name },
          { key: 'orders', header: 'Orders', align: 'center', render: (customer) => customer.orders },
          { key: 'total', header: 'Sales Total', align: 'right', render: (customer) => formatCurrency(customer.total) },
          { key: 'payment', header: 'Payment Info', render: (customer) => customer.payment || '—' },
          { key: 'salesRep', header: 'Sales Rep', render: (customer) => customer.salesRep || '—' },
          { key: 'lastOrder', header: 'Last Order', render: (customer) => customer.lastOrder || '—' },
          {
            key: 'action',
            header: 'Action',
            align: 'center',
            render: (customer) => (
              <Button size="small" onClick={() => openEditDrawer(customer)}>
                Edit
              </Button>
            ),
          },
        ]}
      />

      <Drawer
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        helper="Customer Name is required. Save updates local React state only."
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        onSave={saveDraft}
      >
        {draft ? (
          <div className="grid gap-4">
            <FormField label="Customer Name *" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
            <FormField
              label="Orders"
              type="number"
              value={draft.orders}
              onChange={(value) => setDraft({ ...draft, orders: Number(value) })}
            />
            <FormField
              label="Sales Total"
              type="number"
              value={draft.total}
              onChange={(value) => setDraft({ ...draft, total: Number(value) })}
            />
            <FormField label="Payment Info" value={draft.payment} onChange={(value) => setDraft({ ...draft, payment: value })} />
            <FormField label="Sales Rep" value={draft.salesRep} onChange={(value) => setDraft({ ...draft, salesRep: value })} />
            <FormField label="Last Order" value={draft.lastOrder} onChange={(value) => setDraft({ ...draft, lastOrder: value })} />
            <FormField label="Default Shipping Address" value="" multiline />
            <div className="rounded-xl bg-warningBg p-3 text-xs text-warningText">
              Contact, phone, email, and default address can be added after the customer master workflow is confirmed.
            </div>
          </div>
        ) : null}
      </Drawer>
    </AppShell>
  );
}
