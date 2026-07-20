/* eslint-disable security/detect-non-literal-fs-filename -- fixed allowlist of asset paths under src/dist */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const pngCandidates = [
  path.resolve(process.cwd(), 'src/assets/logo.png'),
  path.resolve(process.cwd(), 'dist/assets/logo.png'),
]

const svgCandidates = [
  path.resolve(process.cwd(), 'src/assets/invoice-logo.svg'),
  path.resolve(process.cwd(), 'dist/assets/invoice-logo.svg'),
]

const embeddedPngFromSvg = (svgContent: string): string | null => {
  const match = svgContent.match(/xlink:href="(data:image\/png;base64,[^"]+)"/)
  return match?.[1] ?? null
}

const pngFileToDataUri = (filePath: string): string => {
  const buffer = readFileSync(filePath)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

/** Data URI for @react-pdf/renderer (reliable across dev, dist, and Windows paths). */
export const resolveInvoiceLogoSrc = (): string | null => {
  for (const filePath of pngCandidates) {
    if (existsSync(filePath)) {
      return pngFileToDataUri(filePath)
    }
  }

  for (const filePath of svgCandidates) {
    if (!existsSync(filePath)) {
      continue
    }
    const svgContent = readFileSync(filePath, 'utf8')
    const embedded = embeddedPngFromSvg(svgContent)
    if (embedded !== null) {
      return embedded
    }
  }

  return null
}
