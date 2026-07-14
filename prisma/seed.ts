// Seed script for ELISHAMA Stock Manager
import { db } from '../src/lib/db'

async function main() {
  // Settings
  await db.settings.upsert({
    where: { id: 'settings-main' },
    update: {},
    create: {
      id: 'settings-main',
      restaurantName: 'ELISHAMA',
      currency: 'FCFA',
      phone: '+229 01 00 00 00',
      address: 'Cotonou, Bénin',
      autoBackup: true,
    },
  })

  // Categories
  const categories = [
    { name: 'Ingrédients', icon: 'Wheat', color: 'amber' },
    { name: 'Viandes & Poissons', icon: 'Beef', color: 'red' },
    { name: 'Boissons', icon: 'CupSoda', color: 'cyan' },
    { name: 'Huiles & Condiments', icon: 'Droplet', color: 'orange' },
    { name: 'Épices', icon: 'Pepper', color: 'rose' },
    { name: 'Légumes', icon: 'Carrot', color: 'green' },
    { name: 'Produits Finis', icon: 'UtensilsCrossed', color: 'emerald' },
    { name: 'Emballages', icon: 'Package', color: 'slate' },
  ]

  const catMap: Record<string, string> = {}
  for (const c of categories) {
    const existing = await db.category.findUnique({ where: { name: c.name } })
    if (existing) {
      catMap[c.name] = existing.id
    } else {
      const created = await db.category.create({ data: c })
      catMap[c.name] = created.id
    }
  }

  // Products
  const products = [
    { name: 'Riz parfumé', category: 'Ingrédients', unit: 'kg', costPrice: 600, salePrice: 0, stockQuantity: 50, minThreshold: 10 },
    { name: 'Poulet entier', category: 'Viandes & Poissons', unit: 'kg', costPrice: 2000, salePrice: 0, stockQuantity: 15, minThreshold: 5 },
    { name: 'Poisson frais', category: 'Viandes & Poissons', unit: 'kg', costPrice: 2500, salePrice: 0, stockQuantity: 8, minThreshold: 4 },
    { name: 'Viande de bœuf', category: 'Viandes & Poissons', unit: 'kg', costPrice: 3000, salePrice: 0, stockQuantity: 6, minThreshold: 3 },
    { name: 'Coca-Cola 1.5L', category: 'Boissons', unit: 'bouteille', costPrice: 500, salePrice: 700, stockQuantity: 40, minThreshold: 10 },
    { name: 'Eau minérale 1.5L', category: 'Boissons', unit: 'bouteille', costPrice: 250, salePrice: 400, stockQuantity: 60, minThreshold: 15 },
    { name: 'Jus naturel', category: 'Boissons', unit: 'bouteille', costPrice: 800, salePrice: 1200, stockQuantity: 3, minThreshold: 8 },
    { name: 'Huile végétale', category: 'Huiles & Condiments', unit: 'L', costPrice: 1200, salePrice: 0, stockQuantity: 20, minThreshold: 5 },
    { name: 'Tomate concentrée', category: 'Huiles & Condiments', unit: 'boîte', costPrice: 400, salePrice: 0, stockQuantity: 30, minThreshold: 8 },
    { name: 'Sel', category: 'Épices', unit: 'kg', costPrice: 300, salePrice: 0, stockQuantity: 5, minThreshold: 2 },
    { name: 'Poivre noir', category: 'Épices', unit: 'kg', costPrice: 4000, salePrice: 0, stockQuantity: 1, minThreshold: 1 },
    { name: 'Maggi cubes', category: 'Épices', unit: 'boîte', costPrice: 600, salePrice: 0, stockQuantity: 25, minThreshold: 6 },
    { name: 'Oignons', category: 'Légumes', unit: 'kg', costPrice: 500, salePrice: 0, stockQuantity: 18, minThreshold: 5 },
    { name: 'Tomates fraîches', category: 'Légumes', unit: 'kg', costPrice: 700, salePrice: 0, stockQuantity: 12, minThreshold: 4 },
    { name: 'Plat de riz au poulet', category: 'Produits Finis', unit: 'portion', costPrice: 800, salePrice: 1500, stockQuantity: 0, minThreshold: 0, isIngredient: false },
    { name: 'Plat de riz au poisson', category: 'Produits Finis', unit: 'portion', costPrice: 900, salePrice: 1800, stockQuantity: 0, minThreshold: 0, isIngredient: false },
    { name: 'Sauce graine', category: 'Produits Finis', unit: 'portion', costPrice: 700, salePrice: 1300, stockQuantity: 0, minThreshold: 0, isIngredient: false },
    { name: 'Sacs plastiques', category: 'Emballages', unit: 'paquet', costPrice: 200, salePrice: 0, stockQuantity: 15, minThreshold: 5 },
  ]

  for (const p of products) {
    const existing = await db.product.findFirst({ where: { name: p.name } })
    if (existing) continue
    await db.product.create({
      data: {
        name: p.name,
        categoryId: catMap[p.category],
        unit: p.unit,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        stockQuantity: p.stockQuantity,
        minThreshold: p.minThreshold,
        isIngredient: p.isIngredient ?? true,
      },
    })
  }

  // Some sales for the last few days
  const now = new Date()
  const dishNames = ['Plat de riz au poulet', 'Plat de riz au poisson', 'Sauce graine']
  for (let d = 6; d >= 0; d--) {
    const day = new Date(now)
    day.setDate(now.getDate() - d)
    const salesCount = 3 + Math.floor(Math.random() * 5)
    for (let s = 0; s < salesCount; s++) {
      const item = dishNames[Math.floor(Math.random() * dishNames.length)]
      const qty = 1 + Math.floor(Math.random() * 3)
      const prod = await db.product.findFirst({ where: { name: item } })
      const unitPrice = prod?.salePrice ?? 1500
      await db.sale.create({
        data: {
          date: day,
          totalAmount: unitPrice * qty,
          paymentMethod: Math.random() > 0.5 ? 'espèces' : 'mobile money',
          items: {
            create: [{
              productId: prod?.id,
              itemName: item,
              quantity: qty,
              unitPrice,
              total: unitPrice * qty,
            }],
          },
        },
      })
    }
  }

  // Some expenses
  const expenses = [
    { category: 'achat_fournisseur', description: 'Achat de riz - Marché', amount: 30000, supplier: 'Marché Dantokpa' },
    { category: 'achat_fournisseur', description: 'Achat de poulets', amount: 40000, supplier: 'Ferme avicole' },
    { category: 'électricité', description: 'Facture SBEE', amount: 15000 },
    { category: 'eau', description: 'Facture SONEB', amount: 8000 },
    { category: 'salaire', description: 'Salaire cuisinier', amount: 60000 },
    { category: 'transport', description: 'Transport marchandises', amount: 5000 },
  ]
  for (const e of expenses) {
    await db.expense.create({ data: e })
  }

  // A loss record
  await db.loss.create({
    data: {
      productName: 'Poisson frais',
      description: 'Poisson périmé non vendu',
      quantity: 2,
      amount: 5000,
      type: 'peremption',
    },
  })

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
