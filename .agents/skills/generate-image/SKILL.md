---
name: generate-image
description: Generates a high-quality hero image for a blog post using Google AI Studio's API, saves it in src/assets/images, and updates the post frontmatter. Use when the user asks to "generate an image for X" or "create a hero image".
---

# Generate Image

Input: use the post slug supplied in the user's request, optionally with a custom prompt override.

This skill automates requesting and storing AI-generated hero images for posts using the Google AI Studio (Gemini/Imagen) API.

## Pre-requisites
1. The post file must exist in `src/content/posts/<slug>.mdx`.
2. The environment variable `GEMINI_API_KEY` must be set. If not, ask the user to provide it or verify it.

## Execution & User Selection Workflow

1. **Generate 3 Options:**
   Run the image generation helper script:
   ```bash
   node scripts/generate-hero-image.js <slug> [optional custom prompt]
   ```
   This will output 3 temporary option images: `src/assets/images/<slug>-option-1.jpg`, `-2.jpg`, and `-3.jpg`.

2. **Show Options to User:**
   Embed all 3 options in the chat response using markdown images pointing to their absolute filepaths, for example:
   ```markdown
   ![Option 1](/Users/waleed/repositories/1xEngineer.dev/src/assets/images/<slug>-option-1.jpg)
   ![Option 2](/Users/waleed/repositories/1xEngineer.dev/src/assets/images/<slug>-option-2.jpg)
   ![Option 3](/Users/waleed/repositories/1xEngineer.dev/src/assets/images/<slug>-option-3.jpg)
   ```

3. **Ask User to Choose:**
   Present the choice to the user. Ask them to choose either Option 1, Option 2, Option 3, or request to regenerate.

4. **Apply Selection:**
   Once the user selects their option (e.g., Option 2), run the selection command:
   ```bash
   node scripts/generate-hero-image.js --select <slug> <option-number>
   ```
   This promotes the selected image to `src/assets/images/<slug>.jpg`, updates the MDX frontmatter, and automatically cleans up the temporary option files.

5. **Post-Execution Verification:**
   Verify that `src/assets/images/<slug>.jpg` (or `.png`/`.jpeg`) exists and that the post's frontmatter has been updated with the correct `image` path and `imageAlt` description. Tell the user the process is complete.
