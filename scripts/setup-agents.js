import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to create symlink (or copy fallback)
function setupLink(targetRelPath, linkRelPath, isDir = false) {
  const targetPath = path.resolve(rootDir, targetRelPath);
  const linkPath = path.resolve(rootDir, linkRelPath);

  // Ensure parent directory of link exists
  const linkDir = path.dirname(linkPath);
  if (!fs.existsSync(linkDir)) {
    fs.mkdirSync(linkDir, { recursive: true });
  }

  // Remove existing link/file if it exists
  let exists = false;
  try {
    fs.lstatSync(linkPath);
    exists = true;
  } catch (e) {
    // File doesn't exist
  }

  if (exists) {
    try {
      fs.unlinkSync(linkPath);
    } catch (e) {
      try {
        if (isDir) {
          fs.rmdirSync(linkPath, { recursive: true });
        }
      } catch (err) {
        console.error(`Could not remove existing file/folder at ${linkRelPath}: ${err.message}`);
      }
    }
  }

  try {
    // Use relative path for symlinks so they work across different clones
    const relativeTarget = path.relative(path.dirname(linkPath), targetPath);
    // On Windows, directories require 'junction' or 'dir' type
    const type = isDir ? 'junction' : 'file';
    fs.symlinkSync(relativeTarget, linkPath, type);
    console.log(`Created symlink: ${linkRelPath} -> ${relativeTarget}`);
  } catch (err) {
    console.warn(`Failed to create symlink ${linkRelPath} (${err.message}). Falling back to copying.`);
    try {
      if (isDir) {
        copyFolderSync(targetPath, linkPath);
      } else {
        fs.copyFileSync(targetPath, linkPath);
      }
      console.log(`Copied: ${targetRelPath} -> ${linkRelPath}`);
    } catch (copyErr) {
      console.error(`Failed copy fallback: ${copyErr.message}`);
    }
  }
}

function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const srcPath = path.join(from, element);
    const destPath = path.join(to, element);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// 1. Setup the main AGENT.md if it doesn't exist yet, or rename CLAUDE.md to AGENT.md
const agentMdPath = path.resolve(rootDir, 'AGENT.md');
const claudeMdPath = path.resolve(rootDir, 'CLAUDE.md');

let shouldRename = false;
try {
  const claudeStat = fs.lstatSync(claudeMdPath);
  const agentStatExists = fs.existsSync(agentMdPath);
  if (claudeStat.isFile() && !claudeStat.isSymbolicLink() && !agentStatExists) {
    shouldRename = true;
  }
} catch (e) {
  // CLAUDE.md might not exist or is already a symlink/deleted
}

if (shouldRename) {
  try {
    fs.renameSync(claudeMdPath, agentMdPath);
    console.log('Renamed CLAUDE.md to AGENT.md to serve as the agent-neutral configuration file.');
  } catch (err) {
    console.error(`Failed to rename CLAUDE.md to AGENT.md: ${err.message}`);
  }
}

// Ensure AGENT.md exists (fallback)
if (!fs.existsSync(agentMdPath)) {
  fs.writeFileSync(agentMdPath, `# 1xEngineer.dev\n\nAgent instructions and developer rules.`);
  console.log('Created AGENT.md placeholder.');
}

// Helper to remove files if they exist
function removeFileIfExists(relPath) {
  const filePath = path.resolve(rootDir, relPath);
  let exists = false;
  try {
    fs.lstatSync(filePath);
    exists = true;
  } catch (e) {
    // Doesn't exist
  }
  if (exists) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up unused agent config: ${relPath}`);
    } catch (e) {
      console.error(`Failed to delete ${relPath}: ${e.message}`);
    }
  }
}

// Clean up unused agent files
removeFileIfExists('.cursorrules');
removeFileIfExists('.windsurfrules');
removeFileIfExists('llms.txt');

console.log('Setting up agent configurations...');

// 2. Expose the canonical cross-agent skills to harness-specific locations.
// Keep the source files in .agents/skills; never duplicate their bodies.
setupLink('.agents/skills', '.claude/skills', true);
setupLink('.agents/skills', '.gemini/skills', true);

// 3. Symlink rules and other agent configurations
// Antigravity rules in .agents/rules/workspace-rules.md -> AGENT.md
setupLink('AGENT.md', '.agents/rules/workspace-rules.md', false);

// Claude Code -> AGENT.md
setupLink('AGENT.md', 'CLAUDE.md', false);

// Codex -> AGENT.md
setupLink('AGENT.md', 'AGENTS.md', false);

// Gemini CLI -> AGENT.md
setupLink('AGENT.md', 'GEMINI.md', false);

// Shared role prompts -> Claude Code subagent adapters.
setupLink('.agents/roles/fact-checker.md', '.claude/agents/fact-checker.md', false);
setupLink('.agents/roles/reader-critic.md', '.claude/agents/reader-critic.md', false);

console.log('Agent configuration setup complete!');
