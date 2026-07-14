import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/notifications/read-all — mark all as read
export async function PATCH() {
  try {
    const result = await db.notification.updateMany({
      where: { read: false },
      data: { read: true },
    })
    return NextResponse.json({ success: true, updated: result.count })
  } catch (error) {
    console.error('PATCH /api/notifications/read-all error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
