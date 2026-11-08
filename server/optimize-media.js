import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import sharp from 'sharp'

const require = createRequire(import.meta.url)
const run = promisify(execFile)
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function optimizeMedia(bytes, type) {
  if (imageTypes.has(type)) {
    const output = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer()
    return output.length < bytes.length ? { bytes: output, type: 'image/webp', extension: 'webp' } : null
  }
  if (!type.startsWith('video/')) return null
  const binary = process.platform === 'win32'
    ? join(dirname(require.resolve('@ffmpeg-binary/win32-x64')), 'ffmpeg.exe')
    : join(dirname(require.resolve('@ffmpeg-binary/linux-x64')), 'ffmpeg')
  const folder = await mkdtemp(join(tmpdir(), 'organiza-media-'))
  const input = join(folder, 'input')
  const output = join(folder, 'output.mp4')
  try {
    await writeFile(input, bytes)
    await run(binary, [
      '-nostdin', '-hide_banner', '-loglevel', 'error', '-xerror',
      '-protocol_whitelist', 'file', '-threads', '2', '-i', input,
      '-map', '0:v:0', '-map', '0:a:0?', '-map_metadata', '-1', '-map_chapters', '-1',
      '-vf', "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      '-c:v', 'libx264', '-threads', '2', '-preset', 'veryfast', '-crf', '25',
      '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', output,
    ], { timeout: 75_000, maxBuffer: 64 * 1024 })
    if ((await stat(output)).size >= bytes.length) return null
    return { bytes: await readFile(output), type: 'video/mp4', extension: 'mp4' }
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
}
