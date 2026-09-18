import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Automatically load .env if present
const envPath = path.resolve(rootDir, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (e) {
    // Ignore invalid env file errors
  }
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is not set.');
    console.error('Please obtain a key from Google AI Studio and place it in .env:');
    console.error('echo \'GEMINI_API_KEY="your-api-key"\' > .env');
    process.exit(1);
  }

  const customPrompt = process.argv.slice(2).join(' ');
  const promptText = customPrompt || (
    'A pure, high-contrast, minimalist vector logo mark for "1xEngineer". ' +
    'A sleek geometric ligature combining "1", "X", and "E" (1xE) into a single cohesive modern architectural tech glyph. ' +
    'The right strokes of the "X" cleanly integrate the three horizontal bars of an uppercase "E". ' +
    'Solarized Magenta (#d33682) line art on dark deep slate navy background (#002b36). ' +
    'Crisp edges, flat vector style, no clutter, no drop shadow, perfectly legible at 16x16 browser tab favicon scale.'
  );

  const model = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002';
  console.log('Generating favicon concept using Google AI Studio...');
  console.log(`Model: ${model}`);
  console.log(`Prompt: "${promptText}"`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: promptText }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
          outputMimeType: 'image/jpeg',
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API returned status ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    if (!data.predictions || data.predictions.length === 0) {
      throw new Error(`Invalid API response: ${JSON.stringify(data)}`);
    }

    const base64Data = data.predictions[0].bytesBase64Encoded;
    const tempMaster = path.join(rootDir, 'dist', 'temp-favicon-master.jpg');
    fs.mkdirSync(path.join(rootDir, 'dist'), { recursive: true });
    fs.writeFileSync(tempMaster, Buffer.from(base64Data, 'base64'));

    console.log('Master image generated. Converting to multi-resolution favicon formats...');

    const publicDir = path.join(rootDir, 'public');
    const fav16 = path.join(publicDir, 'favicon-16x16.png');
    const fav32 = path.join(publicDir, 'favicon-32x32.png');
    const fav48 = path.join(publicDir, 'favicon-48x48.png');
    const appleIcon = path.join(publicDir, 'apple-touch-icon.png');
    const favIco = path.join(publicDir, 'favicon.ico');

    execSync(`sips -s format png -z 16 16 "${tempMaster}" --out "${fav16}"`);
    execSync(`sips -s format png -z 32 32 "${tempMaster}" --out "${fav32}"`);
    execSync(`sips -s format png -z 48 48 "${tempMaster}" --out "${fav48}"`);
    execSync(`sips -s format png -z 180 180 "${tempMaster}" --out "${appleIcon}"`);

    // Package ICO
    const pyScript = `
import struct
images = [(16, '${fav16}'), (32, '${fav32}'), (48, '${fav48}')]
img_datas = [(sz, open(p, 'rb').read()) for sz, p in images]
header = struct.pack('<HHH', 0, 1, len(img_datas))
offset = 6 + (16 * len(img_datas))
entries = b''
payload = b''
for sz, data in img_datas:
    entries += struct.pack('<BBBBHHII', sz, sz, 0, 0, 1, 32, len(data), offset)
    payload += data
    offset += len(data)
with open('${favIco}', 'wb') as f:
    f.write(header + entries + payload)
`;
    execSync(`python3 -c "${pyScript.replace(/\n/g, ' ')}"`);
    fs.unlinkSync(tempMaster);
    if (fs.existsSync(fav48)) fs.unlinkSync(fav48);

    console.log('✓ Successfully created:');
    console.log('  - public/favicon.ico (16x16, 32x32, 48x48)');
    console.log('  - public/favicon-32x32.png');
    console.log('  - public/favicon-16x16.png');
    console.log('  - public/apple-touch-icon.png');
  } catch (err) {
    console.error('Error generating favicon:', err.message);
    process.exit(1);
  }
}

main();
