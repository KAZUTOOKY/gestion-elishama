import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/sales/[id] — delete sale (cascade deletes items)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.sale.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Vente introuvable' },
        { status: 404 }
      )
    }
    await db.sale.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/sales/[id] error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la suppression'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
