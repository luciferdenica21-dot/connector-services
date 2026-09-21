import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, renameSync, unlinkSync } from 'node:fs';
import { join, resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_DIR = join(ROOT, 'public', 'gallery');
const OPT_DIR = join(ROOT, 'public', 'gallery_optimized');
const BACKUP_DIR = join(ROOT, 'public', 'gallery_original');

const MP4_LIST = [
  'bending.mp4', 'bending2.mp4',
  'cnc.mp4', 'cnc2.mp4',
  'cutting.mp4',
  'graving.mp4', 'graving2.mp4',
  'lasermetal.mp4', 'lasermetal2.mp4',
  'mech.mp4',
  'paint.mp4', 'paint2.mp4',
  'welding.mp4', 'welding2.mp4',
];

function hasFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function runCmd(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

// === H.264 MP4 (макс. совместимость, 720p, 30fps, CRF 28) ===
// CRF 28 — визуально почти без потерь для фоновых видео
// Scale 1280:-2 — 720p по высоте, авто-ширина
// Если видео уже меньше 720p — не увеличиваем
const FFMPEG_MP4_OPTS =
  '-vf "scale=\'min(1280,iw)\':-2,fps=30" ' +
  '-c:v libx264 -preset veryslow -crf 28 -tune fastdecode ' +
  '-pix_fmt yuv420p -profile:v baseline -level 3.0 ' +
  '-movflags +faststart ' +
  '-c:a aac -b:a 64k -ac 1';

// === WebM VP9 (лучшее сжатие для Chrome/Firefox/Safari 16.4+) ===
const FFMPEG_WEBM_OPTS =
  '-vf "scale=\'min(1280,iw)\':-2,fps=30" ' +
  '-c:v libvpx-vp9 -crf 36 -b:v 0 -deadline good -cpu-used 2 ' +
  '-pix_fmt yuv420p ' +
  '-an';

function optimizeAllMp4() {
  mkdirSync(OPT_DIR, { recursive: true });
  mkdirSync(BACKUP_DIR, { recursive: true });

  let totalBefore = 0;
  let totalAfter = 0;
  const results = [];

  for (const f of MP4_LIST) {
    const src = join(SRC_DIR, f);
    if (!existsSync(src)) {
      console.log(`[SKIP] ${f} — не найден`);
      continue;
    }
    const tmp = join(OPT_DIR, f);
    const sizeBefore = statSync(src).size;
    totalBefore += sizeBefore;

    console.log(`\n=== Оптимизирую ${f} (${formatMB(sizeBefore)}) ===`);

    runCmd(`ffmpeg -y -i "${src}" ${FFMPEG_MP4_OPTS} "${tmp}"`);

    if (!existsSync(tmp)) {
      console.log(`[FAIL] ${f} не был создан`);
      continue;
    }

    const sizeAfter = statSync(tmp).size;
    totalAfter += sizeAfter;
    const ratio = ((1 - sizeAfter / sizeBefore) * 100).toFixed(1);
    results.push({ f, before: sizeBefore, after: sizeAfter, ratio });
    console.log(`[OK] ${f}: ${formatMB(sizeBefore)} → ${formatMB(sizeAfter)} (-${ratio}%)`);
  }

  console.log('\n========================================');
  console.log('ИТОГО MP4:');
  console.log(`  До:    ${formatMB(totalBefore)}`);
  console.log(`  После: ${formatMB(totalAfter)}`);
  console.log(`  Экономия: ${formatMB(totalBefore - totalAfter)} (-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
  console.log('========================================');

  console.log('\nТеперь замените оригиналы оптимизированными:');
  console.log('  1. Переместите originals в gallery_original:');
  results.forEach(r => {
    const src = join(SRC_DIR, r.f).replace(/\\/g, '/');
    const bak = join(BACKUP_DIR, r.f).replace(/\\/g, '/');
    console.log(`     move "${src}" "${bak}"`);
  });
  console.log('  2. Переместите оптимизированные в gallery:');
  results.forEach(r => {
    const tmp = join(OPT_DIR, r.f).replace(/\\/g, '/');
    const dst = join(SRC_DIR, r.f).replace(/\\/g, '/');
    console.log(`     move "${tmp}" "${dst}"`);
  });
}

function generateWebm() {
  mkdirSync(OPT_DIR, { recursive: true });
  console.log('\n=== Генерация WebM (дополнительно, для <video><source>) ===');
  for (const f of MP4_LIST) {
    const src = join(SRC_DIR, f);
    if (!existsSync(src)) continue;
    const out = join(OPT_DIR, basename(f, '.mp4') + '.webm');
    console.log(`\n> ${f} → ${basename(out)}`);
    try {
      runCmd(`ffmpeg -y -i "${src}" ${FFMPEG_WEBM_OPTS} "${out}"`);
    } catch (e) {
      console.log('[WARN] VP9 encode failed, пропускаю WebM для', f);
    }
  }
}

function printManualGuide() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         FFmpeg не найден — УСТАНОВИТЕ FFmpeg                 ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║                                                              ║');
  console.log('║  Windows (через winget — ПК):                                ║');
  console.log('║    winget install --id=Gyan.FFmpeg -e                        ║');
  console.log('║                                                              ║');
  console.log('║  Windows (через Chocolatey):                                 ║');
  console.log('║    choco install ffmpeg                                      ║');
  console.log('║                                                              ║');
  console.log('║  macOS:                                                      ║');
  console.log('║    brew install ffmpeg                                       ║');
  console.log('║                                                              ║');
  console.log('║  Ubuntu/Debian:                                              ║');
  console.log('║    sudo apt install ffmpeg                                   ║');
  console.log('║                                                              ║');
  console.log('║  --- Или используйте онлайн-сервисы (HandBrake, CloudConvert)║');
  console.log('║      с параметрами: 720p, 30fps, H.264 CRF 28, faststart    ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n--- РУЧНЫЕ КОМАНДЫ FFMPEG (для копирования после установки) ---');
  console.log('\nСоздайте папки public/gallery_optimized и запустите:');
  console.log('cd work-in\n');
  MP4_LIST.forEach(f => {
    const src = join(SRC_DIR, f).replace(/\\/g, '/');
    const dst = join(OPT_DIR, f).replace(/\\/g, '/');
    console.log(`ffmpeg -y -i "${src}" ${FFMPEG_MP4_OPTS} "${dst}"`);
  });
  console.log('\nЗатем замените файлы в public/gallery на оптимизированные.');
}

function quickAnalyze() {
  console.log('\n=== Анализ текущих видео в public/gallery ===\n');
  let total = 0;
  const rows = [];
  for (const f of MP4_LIST) {
    const p = join(SRC_DIR, f);
    if (existsSync(p)) {
      const s = statSync(p).size;
      total += s;
      rows.push([f, formatMB(s)]);
    } else {
      rows.push([f, 'НЕТ ФАЙЛА']);
    }
  }
  rows.push(['---', '---']);
  rows.push(['ИТОГО', formatMB(total)]);
  console.table(rows);
}

// ============ MAIN ============
const args = process.argv.slice(2);
if (args.includes('--analyze') || args.includes('-a')) {
  quickAnalyze();
  process.exit(0);
}

if (args.includes('--guide') || args.includes('-g')) {
  printManualGuide();
  process.exit(0);
}

console.log('┌────────────────────────────────────────────────┐');
console.log('│  Оптимизация видео для Vercel CDN              │');
console.log('└────────────────────────────────────────────────┘');

quickAnalyze();

if (!hasFfmpeg()) {
  printManualGuide();
  console.log('\nПосле установки перезапустите: node scripts/optimize-videos.mjs');
  console.log('Или только анализ: node scripts/optimize-videos.mjs --analyze');
  process.exit(1);
}

console.log('\n[OK] FFmpeg найден, начинаю оптимизацию MP4...');

try {
  optimizeAllMp4();
} catch (e) {
  console.error('\n[ERROR] Ошибка во время оптимизации:', e.message);
  process.exit(1);
}

console.log('\n[ГОТОВО] MP4 оптимизированы.');
console.log('\nСледующий шаг:');
console.log('  • Проверьте качество в gallery_optimized/');
console.log('  • Сделайте бэкап оригиналов в gallery_original/');
console.log('  • Замените оригиналы на оптимизированные');
console.log('  • Задеплойте на Vercel — кэширование настроено в vercel.json');
