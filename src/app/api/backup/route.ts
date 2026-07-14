import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/backup — list backups ordered by date desc
export async function GET() {
  try {
    const backups = await db.backup.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(backups)
  } catch (error) {
    console.error('GET /api/backup error:', error)
    return NextResponse.json(
      { error: 'Impossible de charger les sauvegardes' },
      { status: 500 }
    )
  }
}

// POST /api/backup — simulate a cloud backup
// Use ?auto=true to mark as automatic, otherwise manual
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const isAuto = searchParams.get('auto') === 'true'

    // Count all records
    const [
      productCount,
      saleCount,
      expenseCount,
      lossCount,
      stockMovementCount,
      notificationCount,
    ] = await Promise.all([
      db.product.count(),
      db.sale.count(),
      db.expense.count(),
      db.loss.count(),
      db.stockMovement.count(),
      db.notification.count(),
    ])

    const records =
      productCount +
      saleCount +
      expenseCount +
      lossCount +
      stockMovementCount +
      notificationCount

    const backup = await db.backup.create({
      data: {
        type: isAuto ? 'auto' : 'manual',
        status: 'success',
        size: `${records} enregistrements`,
        records,
      },
    })

    // Update settings.lastBackup
    await db.settings.upsert({
      where: { id: 'settings-main' },
      update: { lastBackup: new Date() },
      create: { id: 'settings-main', lastBackup: new Date() },
    })

    return NextResponse.json(backup, { status: 201 })
  } catch (error) {
    console.error('POST /api/backup error:', error)
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
