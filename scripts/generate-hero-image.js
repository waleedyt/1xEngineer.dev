import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to parse frontmatter from MDX
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!match) return { attributes: {}, body: content };
  const fmText = match[1];
  const body = content.slice(match[0].length);
  const attributes = {};
  fmText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      const val = line.slice(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      attributes[key] = val;
    }
  });
  return { attributes, body };
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  // Check if we are in select mode
  if (args[0] === '--select') {
    const slugArg = args[1];
    const optionNumArg = parseInt(args[2], 10);

    if (!slugArg || isNaN(optionNumArg) || optionNumArg < 1 || optionNumArg > 3) {
      console.error('Error: Invalid selection parameters.');
      console.error('Usage: node scripts/generate-hero-image.js --select <post-slug> <1|2|3>');
      process.exit(1);
    }

    const imagesDir = path.resolve(rootDir, 'src/assets/images');
    const optionFilePattern = `${slugArg}-option-${optionNumArg}`;
    
    // Find the correct file extension of the option (jpg, png, etc.)
    const files = fs.readdirSync(imagesDir);
    const selectedFile = files.find(f => f.startsWith(optionFilePattern));

    if (!selectedFile) {
      console.error(`Error: Option file not found for ${optionFilePattern}`);
      process.exit(1);
    }

    const ext = path.extname(selectedFile); // e.g. .jpg
    const finalFilename = `${slugArg}${ext}`;
    const finalImagePath = path.join(imagesDir, finalFilename);
    const selectedImagePath = path.join(imagesDir, selectedFile);

    // Copy selected file to the final destination
    fs.copyFileSync(selectedImagePath, finalImagePath);
    console.log(`Selected option ${optionNumArg}. Saved as: src/assets/images/${finalFilename}`);

    // Update frontmatter in post file
    const postsDir = path.resolve(rootDir, 'src/content/posts');
    const postPath = path.join(postsDir, `${slugArg}.mdx`);

    if (fs.existsSync(postPath)) {
      const postContent = fs.readFileSync(postPath, 'utf-8');
      const { attributes } = parseFrontmatter(postContent);
      const title = attributes.title || slugArg;
      const relImagePath = `../../assets/images/${finalFilename}`;
      const imageAltText = `A generated hero image representing the post: ${title}`;

      let updatedPostContent = postContent;
      
      // Update image field
      if (postContent.includes('image:')) {
        updatedPostContent = updatedPostContent.replace(/image:\s*['"][^'"]*['"]/g, `image: '${relImagePath}'`);
        updatedPostContent = updatedPostContent.replace(/image:\s*([^\n\r]*)/g, (match, p1) => {
          if (!p1.trim().startsWith("'") && !p1.trim().startsWith('"')) {
            return `image: '${relImagePath}'`;
          }
          return match;
        });
      } else {
        updatedPostContent = updatedPostContent.replace(/(title:\s*[^\n\r]*)/g, `$1\nimage: '${relImagePath}'`);
      }

      // Update imageAlt field
      if (postContent.includes('imageAlt:')) {
        updatedPostContent = updatedPostContent.replace(/imageAlt:\s*['"][^'"]*['"]/g, `imageAlt: '${imageAltText}'`);
        updatedPostContent = updatedPostContent.replace(/imageAlt:\s*([^\n\r]*)/g, (match, p1) => {
          if (!p1.trim().startsWith("'") && !p1.trim().startsWith('"')) {
            return `imageAlt: '${imageAltText}'`;
          }
          return match;
        });
      } else {
        updatedPostContent = updatedPostContent.replace(/(image:\s*[^\n\r]*)/g, `$1\nimageAlt: '${imageAltText}'`);
      }

      fs.writeFileSync(postPath, updatedPostContent, 'utf-8');
      console.log(`Successfully updated frontmatter in post: ${postPath}`);
    } else {
      console.warn(`Warning: Post file not found at ${postPath}. Frontmatter was not updated.`);
    }

    // Clean up temporary option files
    files.forEach(f => {
      if (f.startsWith(`${slugArg}-option-`)) {
        try {
          fs.unlinkSync(path.join(imagesDir, f));
        } catch (e) {
          // Ignore delete errors
        }
      }
    });

    console.log('Cleaned up temporary options.');
    process.exit(0);
  }

  // Generation Mode
  const slugArg = args[0];
  const customPromptArg = args.slice(1).join(' ');

  if (!slugArg) {
    console.error('Error: Please provide a post slug.');
    console.error('Usage: node scripts/generate-hero-image.js <post-slug> [optional custom prompt]');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is not set.');
    console.error('Please obtain a key from Google AI Studio and export it:');
    console.error('export GEMINI_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  // Look for the post file
  const postsDir = path.resolve(rootDir, 'src/content/posts');
  let postPath = path.join(postsDir, `${slugArg}.mdx`);

  if (!fs.existsSync(postPath)) {
    if (fs.existsSync(slugArg)) {
      postPath = slugArg;
    } else {
      console.error(`Error: Post file not found at ${postPath} or ${slugArg}`);
      process.exit(1);
    }
  }

  const slug = path.basename(postPath, '.mdx');
  const postContent = fs.readFileSync(postPath, 'utf-8');
  const { attributes } = parseFrontmatter(postContent);

  const title = attributes.title || slug;
  const description = attributes.description || 'a blog post about software engineering';

  // Build the prompt matching the blog's theme
  let promptText = customPromptArg;
  if (!promptText) {
    promptText = `A high-quality, minimalistic modern editorial illustration for a technical blog post titled "${title}". ` +
                 `Concept: ${description}. ` +
                 `Style: flat vector art, high contrast, clean lines, with a Solarized color palette (deep dark blues, slate grays, warm cream tones, and a soft yellow/amber accent). ` +
                 `Must be professional, developer-centric, and contain NO text, labels, or speech bubbles.`;
  }

  const model = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002';
  console.log(`Generating 3 image options for post: "${title}"`);
  console.log(`Model: ${model}`);
  console.log(`Prompt: "${promptText}"`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: promptText,
          }
        ],
        parameters: {
          sampleCount: 3, // Request 3 images
          aspectRatio: '16:9',
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

    const imagesDir = path.resolve(rootDir, 'src/assets/images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    data.predictions.forEach((prediction, index) => {
      const base64Data = prediction.bytesBase64Encoded;
      const mimeType = prediction.mimeType || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      const optionNum = index + 1;
      const optionFilename = `${slug}-option-${optionNum}.${ext}`;
      const optionImagePath = path.join(imagesDir, optionFilename);
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(optionImagePath, buffer);
      
      console.log(`Option ${optionNum} saved to: src/assets/images/${optionFilename}`);
    });

    console.log('\n--- SUCCESS ---');
    console.log('To choose one of the options, run:');
    console.log(`node scripts/generate-hero-image.js --select ${slug} <1|2|3>`);

  } catch (error) {
    console.error('Error generating image:', error.message);
    process.exit(1);
  }
}

main();
