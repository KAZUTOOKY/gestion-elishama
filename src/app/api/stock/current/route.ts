import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/stock/current — products with stock info & computed status
export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { name: 'asc' },
      include: { category: true },
    })

    const data = products.map((p) => {
      const stockValue = p.stockQuantity * p.costPrice
      let status: 'out' | 'low' | 'ok' = 'ok'
      if (p.stockQuantity <= 0) status = 'out'
      else if (p.stockQuantity <= p.minThreshold) status = 'low'

      return {
        id: p.id,
        name: p.name,
        unit: p.unit,
        stockQuantity: p.stockQuantity,
        minThreshold: p.minThreshold,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        category: p.category,
        stockValue,
        status,
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/stock/current error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger le stock courant' },
      { status: 500 }
    )
  }
}
