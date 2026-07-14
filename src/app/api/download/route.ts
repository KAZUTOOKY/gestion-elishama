import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { existsSync, readFileSync, statSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

// Fichiers et dossiers à exclure du ZIP
const EXCLUDES = [
  'node_modules',
  '.next',
  '.git',
  'dev.log',
  'server.log',
  'upload',
  'download',
  '.zscripts',
  'skills',
  'examples',
  'mini-services',
  '*.png',
  '*.db',
  '*.db-journal',
  'worklog.md',
  'bun.lock',
  '.DS_Store',
]

// Fichiers racine à inclure
const ROOT_FILES = [
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'components.json',
  'eslint.config.mjs',
  '.gitignore',
  '.env.example',
  'README.md',
  'next-env.d.ts',
  'Caddyfile',
]

// Dossiers à inclure
const INCLUDE_DIRS = ['src', 'prisma', 'public']

export async function GET() {
  const tmpZipDir = join(tmpdir(), `elishama-${randomUUID()}`)
  const tmpZipFile = join(tmpdir(), `elishama-app-${randomUUID()}.zip`)

  try {
    const projectRoot = process.cwd()

    // Créer un dossier temporaire avec la structure du projet
    execSync(`mkdir -p "${tmpZipDir}/elishama-stock-manager/db"`)

    // Copier les dossiers principaux (src, prisma, public) en excluant les fichiers indésirables
    for (const dir of INCLUDE_DIRS) {
      const srcPath = join(projectRoot, dir)
      if (existsSync(srcPath)) {
        const destPath = join(tmpZipDir, 'elishama-stock-manager', dir)
        // Utiliser rsync pour exclure les motifs
        const excludeArgs = EXCLUDES.map((e) => `--exclude=${e}`).join(' ')
        execSync(`rsync -a ${excludeArgs} "${srcPath}/" "${destPath}/"`, { stdio: 'pipe' })
      }
    }

    // Copier les fichiers racine
    for (const file of ROOT_FILES) {
      const filePath = join(projectRoot, file)
      if (existsSync(filePath)) {
        execSync(`cp "${filePath}" "${tmpZipDir}/elishama-stock-manager/${file}"`)
      }
    }

    // Créer le fichier .env pour le déploiement
    execSync(`echo 'DATABASE_URL="file:./db/custom.db"' > "${tmpZipDir}/elishama-stock-manager/.env"`)

    // Créer le fichier .gitkeep dans db
    execSync(`touch "${tmpZipDir}/elishama-stock-manager/db/.gitkeep"`)

    // Créer le ZIP
    execSync(`cd "${tmpZipDir}" && zip -r -q "${tmpZipFile}" elishama-stock-manager`, { stdio: 'pipe' })

    // Lire le ZIP
    const zipBuffer = readFileSync(tmpZipFile)
    const size = statSync(tmpZipFile).size

    // Nettoyer les fichiers temporaires
    rmSync(tmpZipDir, { recursive: true, force: true })
    rmSync(tmpZipFile, { force: true })

    const response = new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="elishama-stock-manager.zip"`,
        'Content-Length': String(size),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

    return response
  } catch (error) {
    console.error('Download API error:', error)
    // Nettoyer en cas d'erreur
    try {
      if (existsSync(tmpZipDir)) import('fs').then(({ rmSync }) => rmSync(tmpZipDir, { recursive: true, force: true }))
      if (existsSync(tmpZipFile)) import('fs').then(({ rmSync }) => rmSync(tmpZipFile, { force: true }))
    } catch {}

    return NextResponse.json(
      { error: 'Erreur lors de la création du fichier ZIP' },
      { status: 500 }
    )
  }
}
