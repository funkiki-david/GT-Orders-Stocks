import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : '';
}

function fulfillmentLabel(status: string) {
  if (status === 'SHIPPED') return 'Shipped';
  if (status === 'BILLED_CLOSED') return 'Billed Closed';
  if (status === 'CANCELLED') return 'Cancelled';
  return 'Open';
}

function paymentLabel(status: string) {
  if (status === 'PAID') return 'Paid';
  if (status === 'NO_CHARGE') return 'No Charge';
  return 'Unpaid';
}

function cancelReasonLabel(value: string | null) {
  if (value === 'CUSTOMER_CANCELLED') return 'Customer Cancelled';
  if (value === 'OUT_OF_STOCK') return 'Out of Stock';
  if (value === 'WRONG_ORDER') return 'Wrong Order';
  if (value === 'OTHER') return 'Other';
  return '';
}

function optionalString(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: unknown) {
  const trimmed = optionalString(value);

  if (!trimmed) {
    throw new Error('Required text value is missing.');
  }

  return trimmed;
}

function optionalDate(value: unknown) {
  const trimmed = optionalString(value);

  if (!trimmed) return null;

  const date = new Date(`${trimmed}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value.');
  }

  return date;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error('Invalid number value.');
  }

  return number;
}

function requiredNumber(value: unknown) {
  const number = optionalNumber(value);

  if (number === null) {
    throw new Error('Required number value is missing.');
  }

  return number;
}

function paymentStatusFromInfo(value: string | null) {
  const normalized = value?.trim().toLowerCase() ?? '';

  if (normalized === 'no charge' || normalized === 'no-charge' || normalized === 'no_charge') return 'NO_CHARGE';
  if (normalized.includes('paid') && !normalized.includes('unpaid')) return 'PAID';

  return 'UNPAID';
}

export async function GET() {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      orderBy: [
        {
          orderDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      include: {
        customer: true,
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const data = salesOrders.map((order) => {
      const customerName = order.customer?.companyName ?? order.customerSnapshot;

      return {
        id: order.id,
        salesOrderNumber: order.salesOrderNumber,
        orderDate: order.orderDate,
        shipDate: order.shipDate,
        customerId: order.customerId,
        customerSnapshot: order.customerSnapshot,
        poNumber: order.poNumber,
        paymentInfo: order.paymentInfo,
        shipMethod: order.shipMethod,
        shipCost: order.shipCost === null ? null : Number(order.shipCost),
        salesRep: order.salesRep,
        fulfillmentStatus: order.fulfillmentStatus,
        paymentStatus: order.paymentStatus,
        cancelReason: order.cancelReason,
        statusNotes: order.statusNotes,
        subtotal: Number(order.subtotal),
        totalQty: order.totalQty,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map((item) => ({
          id: item.id,
          salesOrderId: item.salesOrderId,
          skuCode: item.skuCode,
          productDescription: item.productDescription,
          width: item.width,
          length: item.length,
          category: item.category,
          qtyCtn: item.qtyCtn,
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
          palletLocationSnapshot: item.palletLocationSnapshot,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
        customer: order.customer
          ? {
              id: order.customer.id,
              companyName: order.customer.companyName,
              contactPerson: order.customer.contactPerson,
              phone: order.customer.phone,
              email: order.customer.email,
              billingAddress: order.customer.billingAddress,
              shippingAddress: order.customer.shippingAddress,
              paymentTerm: order.customer.paymentTerm,
              notes: order.customer.notes,
              createdAt: order.customer.createdAt,
              updatedAt: order.customer.updatedAt,
            }
          : null,
        ui: {
          id: order.id,
          invoice: order.salesOrderNumber,
          date: formatDate(order.orderDate),
          shipDate: formatDate(order.shipDate),
          customer: customerName,
          po: order.poNumber ?? '',
          payment: order.paymentInfo ?? paymentLabel(order.paymentStatus),
          shipMethod: order.shipMethod ?? '',
          shipCost: order.shipCost === null ? '' : String(order.shipCost),
          salesRep: order.salesRep ?? '',
          items: order.items.map((item) => ({
            id: item.id,
            sku: item.skuCode,
            description: item.productDescription,
            width: item.width ?? '',
            length: item.length ?? '',
            category: item.category ?? '',
            qty: item.qtyCtn,
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
          })),
          totalQty: order.totalQty,
          subtotal: Number(order.subtotal),
          fulfillmentStatus: fulfillmentLabel(order.fulfillmentStatus),
          paymentStatus: paymentLabel(order.paymentStatus),
          cancelReason: cancelReasonLabel(order.cancelReason),
          statusNotes: order.statusNotes ?? '',
        },
      };
    });

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error('Failed to load sales orders', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to load sales orders',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      salesOrderNumber?: unknown;
      orderDate?: unknown;
      shipDate?: unknown;
      customerId?: unknown;
      customerSnapshot?: unknown;
      poNumber?: unknown;
      paymentInfo?: unknown;
      shipMethod?: unknown;
      shipCost?: unknown;
      salesRep?: unknown;
      items?: Array<{
        skuCode?: unknown;
        productDescription?: unknown;
        width?: unknown;
        length?: unknown;
        category?: unknown;
        qtyCtn?: unknown;
        unitPrice?: unknown;
        total?: unknown;
        palletLocationSnapshot?: unknown;
      }>;
    };

    const salesOrderNumber = requiredString(body.salesOrderNumber);
    const customerSnapshot = requiredString(body.customerSnapshot);
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'At least one line item is required',
        },
        { status: 400 },
      );
    }

    const preparedItems = items.map((item) => {
      const skuCode = requiredString(item.skuCode);
      const productDescription = requiredString(item.productDescription);
      const qtyCtn = Math.trunc(requiredNumber(item.qtyCtn));
      const unitPrice = requiredNumber(item.unitPrice);
      const providedTotal = optionalNumber(item.total);
      const total = providedTotal ?? qtyCtn * unitPrice;

      if (qtyCtn < 0 || unitPrice < 0 || total < 0) {
        throw new Error('Line item numbers cannot be negative.');
      }

      return {
        skuCode,
        productDescription,
        width: optionalString(item.width),
        length: optionalString(item.length),
        category: optionalString(item.category),
        qtyCtn,
        unitPrice,
        total,
        palletLocationSnapshot: optionalString(item.palletLocationSnapshot),
      };
    });

    const totalQty = preparedItems.reduce((sum, item) => sum + item.qtyCtn, 0);
    const subtotal = preparedItems.reduce((sum, item) => sum + item.total, 0);
    const providedCustomerId = optionalString(body.customerId);
    const matchedCustomer =
      providedCustomerId === null
        ? await prisma.customer.findUnique({
            where: {
              companyName: customerSnapshot,
            },
          })
        : null;
    const customerId = providedCustomerId ?? matchedCustomer?.id ?? null;
    const paymentInfo = optionalString(body.paymentInfo);

    const salesOrder = await prisma.salesOrder.create({
      data: {
        salesOrderNumber,
        orderDate: optionalDate(body.orderDate),
        shipDate: optionalDate(body.shipDate),
        customerId,
        customerSnapshot,
        poNumber: optionalString(body.poNumber),
        paymentInfo,
        shipMethod: optionalString(body.shipMethod),
        shipCost: optionalNumber(body.shipCost),
        salesRep: optionalString(body.salesRep),
        fulfillmentStatus: 'OPEN',
        paymentStatus: paymentStatusFromInfo(paymentInfo),
        subtotal,
        totalQty,
        items: {
          create: preparedItems,
        },
      },
      include: {
        customer: true,
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      data: salesOrder,
    });
  } catch (error) {
    console.error('Failed to create sales order', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create sales order',
      },
      { status: error instanceof Error ? 400 : 500 },
    );
  }
}
