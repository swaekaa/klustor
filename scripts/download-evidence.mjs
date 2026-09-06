/**
 * download-evidence.mjs
 * Downloads cinematic placeholder evidence images from Unsplash/Picsum
 * Run: node scripts/download-evidence.mjs
 */
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { pipeline } from 'stream/promises';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE_DIR = path.join(__dirname, '..', 'public', 'evidence');

// Cinematic noir images from Picsum (deterministic seeds give consistent images)
const EVIDENCE_IMAGES = [
  {
    filename: 'ocean-drive.jpg',
    url: 'https://picsum.photos/seed/ocean-drive-night/1280/720',
    label: 'Ocean Drive — Evidence 01',
  },
  {
    filename: 'parking-garage.jpg',
    url: 'https://picsum.photos/seed/parking-garage-dark/1280/720',
    label: 'Parking Garage — Evidence 02',
  },
  {
    filename: 'nightclub.jpg',
    url: 'https://picsum.photos/seed/nightclub-neon/1280/720',
    label: 'Nightclub Entrance — Evidence 03',
  },
  {
    filename: 'alley.jpg',
    url: 'https://picsum.photos/seed/dark-alley-rain/1280/720',
    label: 'The Alley — Evidence 04',
  },
  {
    filename: 'security-cam.jpg',
    url: 'https://picsum.photos/seed/security-cam-bw/960/720',
    label: 'Security Camera — Evidence 05',
  },
];

async function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'VCI-Evidence-Downloader/1.0' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  console.log('Downloading evidence images...\n');

  for (const img of EVIDENCE_IMAGES) {
    const dest = path.join(EVIDENCE_DIR, img.filename);
    process.stdout.write(`  Downloading ${img.label}... `);
    try {
      await downloadImage(img.url, dest);
      console.log('✓');
    } catch (err) {
      console.log(`✗ (${err.message})`);
    }
  }

  console.log('\nDone. Evidence images saved to /public/evidence/');
  console.log('\nTIP: Replace these placeholder images with your own neon-noir photography');
  console.log('     for the full cinematic experience.');
}

main().catch(console.error);
