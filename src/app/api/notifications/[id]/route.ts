import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/notifications/[id] — mark as read
export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.notification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Notification introuvable' },
        { status: 404 }
      )
    }
    const updated = await db.notification.update({
      where: { id },
      data: { read: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/notifications/[id] error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/notifications/[id] — delete notification
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.notification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Notification introuvable' },
        { status: 404 }
      )
    }
    await db.notification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/notifications/[id] error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la suppression'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
