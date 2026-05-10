import { PrismaClient, type CancelReason, type FulfillmentStatus, type PaymentStatus } from '@prisma/client';
import inventorySeed from '../data/inventory-seed.json';
import customersSeed from '../data/customers-seed.json';
import ordersSeed from '../data/orders-seed.json';

const prisma = new PrismaClient();

type InventorySeedItem = {
  sku: string;
  name: string;
  category?: string;
  qty?: number;
  palletLocation?: string;
};

type CustomerSeedItem = {
  name: string;
  payment?: string;
  salesRep?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  billingAddress?: string;
  shippingAddress?: string;
  paymentTerm?: string;
  notes?: string;
};

type OrderSeedItem = {
  invoice: string;
  date?: string;
  shipDate?: string;
  customer: string;
  po?: string;
  payment?: string;
  shipMethod?: string;
  shipCost?: string;
  salesRep?: string;
  totalQty?: number;
  subtotal?: number;
  fulfillmentStatus?: string;
  paymentStatus?: string;
  cancelReason?: string;
  statusNotes?: string;
  items: Array<{
    sku: string;
    description: string;
    width?: string;
    length?: string;
    category?: string;
    qty?: number;
    unitPrice?: number;
    total?: number;
    palletLocationSnapshot?: string;
  }>;
};

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDecimal(value?: string | number) {
  if (value === undefined || value === null || value === '') return null;
  const numberValue = Number(String(value).replace(/[$,]/g, ''));
  return Number.isFinite(numberValue) ? numberValue : null;
}

function mapPaymentStatus(value?: string): PaymentStatus {
  const normalized = value?.toLowerCase() ?? '';

  if (normalized.includes('no charge')) return 'NO_CHARGE';
  if (normalized.includes('paid')) return 'PAID';

  return 'UNPAID';
}

function mapFulfillmentStatus(value?: string): FulfillmentStatus {
  if (value === 'Shipped') return 'SHIPPED';
  if (value === 'Billed Closed') return 'BILLED_CLOSED';
  if (value === 'Cancelled') return 'CANCELLED';
  return 'OPEN';
}

function mapCancelReason(value?: string): CancelReason | null {
  if (value === 'Customer Cancelled') return 'CUSTOMER_CANCELLED';
  if (value === 'Out of Stock') return 'OUT_OF_STOCK';
  if (value === 'Wrong Order') return 'WRONG_ORDER';
  if (value === 'Other') return 'OTHER';
  return null;
}

async function seedProducts() {
  const products = inventorySeed as InventorySeedItem[];

  for (const product of products) {
    await prisma.product.upsert({
      where: { skuCode: product.sku },
      create: {
        skuCode: product.sku,
        productName: product.name,
        category: product.category ?? null,
        qtyCtn: Number(product.qty ?? 0),
        palletLocation: product.palletLocation ?? null,
      },
      update: {
        productName: product.name,
        category: product.category ?? null,
        qtyCtn: Number(product.qty ?? 0),
        palletLocation: product.palletLocation ?? null,
      },
    });
  }
}

async function seedCustomers() {
  const customers = customersSeed as CustomerSeedItem[];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { companyName: customer.name },
      create: {
        companyName: customer.name,
        contactPerson: customer.contactPerson ?? null,
        phone: customer.phone ?? null,
        email: customer.email ?? null,
        billingAddress: customer.billingAddress ?? null,
        shippingAddress: customer.shippingAddress ?? null,
        paymentTerm: customer.paymentTerm ?? null,
        notes: customer.notes ?? null,
      },
      update: {
        contactPerson: customer.contactPerson ?? null,
        phone: customer.phone ?? null,
        email: customer.email ?? null,
        billingAddress: customer.billingAddress ?? null,
        shippingAddress: customer.shippingAddress ?? null,
        paymentTerm: customer.paymentTerm ?? null,
        notes: customer.notes ?? null,
      },
    });
  }
}

async function seedSalesOrders() {
  const orders = ordersSeed as OrderSeedItem[];

  for (const order of orders) {
    const customer = await prisma.customer.upsert({
      where: { companyName: order.customer },
      create: { companyName: order.customer },
      update: {},
    });

    const totalQty = Number(
      order.totalQty ?? order.items.reduce((sum, item) => sum + Number(item.qty ?? 0), 0),
    );
    const subtotal = Number(
      order.subtotal ?? order.items.reduce((sum, item) => sum + Number(item.total ?? 0), 0),
    );

    await prisma.salesOrder.upsert({
      where: { salesOrderNumber: order.invoice },
      create: {
        salesOrderNumber: order.invoice,
        orderDate: parseDate(order.date),
        shipDate: parseDate(order.shipDate),
        customerId: customer.id,
        customerSnapshot: order.customer,
        poNumber: order.po ?? null,
        paymentInfo: order.payment ?? null,
        shipMethod: order.shipMethod ?? null,
        shipCost: parseDecimal(order.shipCost),
        salesRep: order.salesRep ?? null,
        fulfillmentStatus: mapFulfillmentStatus(order.fulfillmentStatus),
        paymentStatus: mapPaymentStatus(order.paymentStatus ?? order.payment),
        cancelReason: mapCancelReason(order.cancelReason),
        statusNotes: order.statusNotes ?? null,
        totalQty,
        subtotal,
        items: {
          create: order.items.map((item) => ({
            skuCode: item.sku,
            productDescription: item.description,
            width: item.width ?? null,
            length: item.length ?? null,
            category: item.category ?? null,
            qtyCtn: Number(item.qty ?? 0),
            unitPrice: Number(item.unitPrice ?? 0),
            total: Number(item.total ?? Number(item.qty ?? 0) * Number(item.unitPrice ?? 0)),
            palletLocationSnapshot: item.palletLocationSnapshot ?? null,
          })),
        },
      },
      update: {
        orderDate: parseDate(order.date),
        shipDate: parseDate(order.shipDate),
        customerId: customer.id,
        customerSnapshot: order.customer,
        poNumber: order.po ?? null,
        paymentInfo: order.payment ?? null,
        shipMethod: order.shipMethod ?? null,
        shipCost: parseDecimal(order.shipCost),
        salesRep: order.salesRep ?? null,
        fulfillmentStatus: mapFulfillmentStatus(order.fulfillmentStatus),
        paymentStatus: mapPaymentStatus(order.paymentStatus ?? order.payment),
        cancelReason: mapCancelReason(order.cancelReason),
        statusNotes: order.statusNotes ?? null,
        totalQty,
        subtotal,
        items: {
          deleteMany: {},
          create: order.items.map((item) => ({
            skuCode: item.sku,
            productDescription: item.description,
            width: item.width ?? null,
            length: item.length ?? null,
            category: item.category ?? null,
            qtyCtn: Number(item.qty ?? 0),
            unitPrice: Number(item.unitPrice ?? 0),
            total: Number(item.total ?? Number(item.qty ?? 0) * Number(item.unitPrice ?? 0)),
            palletLocationSnapshot: item.palletLocationSnapshot ?? null,
          })),
        },
      },
    });
  }
}

async function main() {
  console.log('Seeding GT Orders & Stocks database...');
  await seedProducts();
  await seedCustomers();
  await seedSalesOrders();
  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
