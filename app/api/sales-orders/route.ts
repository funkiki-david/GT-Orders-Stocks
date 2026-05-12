import { NextResponse } from 'next/server';
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
