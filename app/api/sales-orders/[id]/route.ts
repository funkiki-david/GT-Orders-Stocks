import { NextResponse } from 'next/server';
import type { CancelReason, FulfillmentStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const fulfillmentStatuses: FulfillmentStatus[] = ['OPEN', 'SHIPPED', 'BILLED_CLOSED', 'CANCELLED'];
const paymentStatuses: PaymentStatus[] = ['UNPAID', 'PAID', 'NO_CHARGE'];
const cancelReasons: CancelReason[] = ['CUSTOMER_CANCELLED', 'OUT_OF_STOCK', 'WRONG_ORDER', 'OTHER'];

type SalesOrderUpdateInput = {
  fulfillmentStatus?: unknown;
  paymentStatus?: unknown;
  cancelReason?: unknown;
  statusNotes?: unknown;
  shipDate?: unknown;
  shipMethod?: unknown;
  shipCost?: unknown;
  salesRep?: unknown;
  paymentInfo?: unknown;
  poNumber?: unknown;
  customerSnapshot?: unknown;
};

function optionalString(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function optionalDate(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date field');
  }

  return date;
}

function optionalNumber(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error('Invalid number field');
  }

  return numberValue;
}

function enumValue<T extends string>(value: unknown, allowed: T[], field: string) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const text = String(value) as T;

  if (!allowed.includes(text)) {
    throw new Error(`Invalid ${field}`);
  }

  return text;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = (await request.json()) as SalesOrderUpdateInput;
    const fulfillmentStatus = enumValue(body.fulfillmentStatus, fulfillmentStatuses, 'fulfillmentStatus');
    const isCancelled = fulfillmentStatus === 'CANCELLED';
    const cancelReason = enumValue(body.cancelReason, cancelReasons, 'cancelReason');

    const updatedSalesOrder = await prisma.salesOrder.update({
      where: {
        id: params.id,
      },
      data: {
        fulfillmentStatus: fulfillmentStatus ?? undefined,
        paymentStatus: enumValue(body.paymentStatus, paymentStatuses, 'paymentStatus') ?? undefined,
        cancelReason: body.fulfillmentStatus === undefined ? undefined : isCancelled ? cancelReason : null,
        statusNotes: optionalString(body.statusNotes),
        shipDate: optionalDate(body.shipDate),
        shipMethod: optionalString(body.shipMethod),
        shipCost: optionalNumber(body.shipCost),
        salesRep: optionalString(body.salesRep),
        paymentInfo: optionalString(body.paymentInfo),
        poNumber: optionalString(body.poNumber),
        customerSnapshot: optionalString(body.customerSnapshot) ?? undefined,
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: updatedSalesOrder,
    });
  } catch (error) {
    console.error('Failed to update sales order', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to update sales order',
      },
      { status: error instanceof Error && error.message.startsWith('Invalid') ? 400 : 500 },
    );
  }
}
