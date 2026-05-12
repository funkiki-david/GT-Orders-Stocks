import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type SalesOrderItemUpdateInput = {
  skuCode?: unknown;
  productDescription?: unknown;
  width?: unknown;
  length?: unknown;
  category?: unknown;
  qtyCtn?: unknown;
  unitPrice?: unknown;
  total?: unknown;
  palletLocationSnapshot?: unknown;
};

function optionalString(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function requiredIfIncluded(value: unknown, field: string) {
  if (value === undefined) return undefined;

  const text = optionalString(value);
  if (!text) {
    throw new Error(`Invalid ${field}`);
  }

  return text;
}

function numberIfIncluded(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return 0;

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`Invalid ${field}`);
  }

  return numberValue;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = (await request.json()) as SalesOrderItemUpdateInput;
    const existingItem = await prisma.salesOrderItem.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingItem) {
      throw new Error('Invalid salesOrderItem');
    }

    const qtyCtn = numberIfIncluded(body.qtyCtn, 'qtyCtn');
    const unitPrice = numberIfIncluded(body.unitPrice, 'unitPrice');
    const providedTotal = numberIfIncluded(body.total, 'total');
    const nextQty = qtyCtn ?? existingItem.qtyCtn;
    const nextUnitPrice = unitPrice ?? Number(existingItem.unitPrice);
    const total = providedTotal ?? (qtyCtn !== undefined || unitPrice !== undefined ? nextQty * nextUnitPrice : undefined);

    const updatedSalesOrderItem = await prisma.$transaction(async (transaction) => {
      const updatedItem = await transaction.salesOrderItem.update({
        where: {
          id: params.id,
        },
        data: {
          skuCode: requiredIfIncluded(body.skuCode, 'skuCode'),
          productDescription: requiredIfIncluded(body.productDescription, 'productDescription'),
          width: optionalString(body.width),
          length: optionalString(body.length),
          category: optionalString(body.category),
          qtyCtn,
          unitPrice,
          total,
          palletLocationSnapshot: optionalString(body.palletLocationSnapshot),
        },
      });
      const siblingItems = await transaction.salesOrderItem.findMany({
        where: {
          salesOrderId: updatedItem.salesOrderId,
        },
      });

      await transaction.salesOrder.update({
        where: {
          id: updatedItem.salesOrderId,
        },
        data: {
          totalQty: siblingItems.reduce((sum, item) => sum + item.qtyCtn, 0),
          subtotal: siblingItems.reduce((sum, item) => sum + Number(item.total), 0),
        },
      });

      return updatedItem;
    });

    return NextResponse.json({
      ok: true,
      data: updatedSalesOrderItem,
    });
  } catch (error) {
    console.error('Failed to update sales order item', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to update sales order item',
      },
      { status: error instanceof Error && error.message.startsWith('Invalid') ? 400 : 500 },
    );
  }
}
