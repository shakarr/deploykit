import { execSync, spawn } from "child_process";
import { existsSync, mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

const BUILDS_DIR = path.join(tmpdir(), "deploykit-builds");

class GitService {
  /**
   * Clone a repository to a temp directory.
   * Returns the absolute path to the cloned repo.
   */
  async clone(opts: {
    url: string;
    branch: string;
    deploymentId: string;
    token?: string;
    onLog?: (log: string) => void;
  }): Promise<string> {
    const destDir = path.join(BUILDS_DIR, opts.deploymentId);

    // Ensure base dir exists
    if (!existsSync(BUILDS_DIR)) {
      mkdirSync(BUILDS_DIR, { recursive: true });
    }

    // Clean up if exists
    if (existsSync(destDir)) {
      rmSync(destDir, { recursive: true, force: true });
    }

    const log = opts.onLog || console.log;
    const cloneUrl = injectToken(opts.url, opts.token);

    // Sanitize branch name to prevent command injection
    const safeBranch = sanitizeGitRef(opts.branch);

    log(`Cloning ${opts.url} (branch: ${safeBranch})...\n`);

    return new Promise((resolve, reject) => {
      const args = [
        "clone",
        "--depth",
        "1",
        "--branch",
        safeBranch,
        cloneUrl,
        destDir,
      ];

      const proc = spawn("git", args, { timeout: 120_000 });

      proc.stdout.on("data", (data) => log(data.toString()));
      proc.stderr.on("data", (data) => log(data.toString()));

      proc.on("close", (code) => {
        if (code !== 0) {
          return reject(new Error(`git clone failed with exit code ${code}`));
        }
        log("Clone complete.\n");
        resolve(destDir);
      });

      proc.on("error", reject);
    });
  }

  // Get the latest commit info from a cloned repo.
  getCommitInfo(repoPath: string): { hash: string; message: string } {
    try {
      const hash = execSync("git rev-parse --short HEAD", {
        cwd: repoPath,
        encoding: "utf-8",
      }).trim();

      const message = execSync("git log -1 --pretty=%B", {
        cwd: repoPath,
        encoding: "utf-8",
      }).trim();

      return { hash, message };
    } catch {
      return { hash: "unknown", message: "" };
    }
  }

  // Clean up build directory.
  cleanup(deploymentId: string): void {
    const destDir = path.join(BUILDS_DIR, deploymentId);
    if (existsSync(destDir)) {
      rmSync(destDir, { recursive: true, force: true });
    }
  }
}

/**
 * Inject a PAT into an HTTPS git URL for private repo access.
 * https://github.com/user/repo → https://x-access-token:{token}@github.com/user/repo
 * Works with GitHub, GitLab, Bitbucket, Gitea, etc.
 */
const injectToken = (url: string, token?: string): string => {
  if (!token) return url;

  try {
    const parsed = new URL(url);
    // Only inject into HTTPS URLs
    if (parsed.protocol !== "https:") return url;
    parsed.username = "x-access-token";
    parsed.password = token;
    return parsed.toString();
  } catch {
    // Not a valid URL, return as-is (e.g. SSH URLs)
    return url;
  }
};

/**
 * Sanitize a git ref (branch/tag name) to prevent shell injection.
 * Git refs only allow: alphanumeric, -, _, ., /
 */
const sanitizeGitRef = (ref: string): string => {
  const sanitized = ref.replace(/[^a-zA-Z0-9._\-\/]/g, "");
  if (!sanitized || sanitized !== ref) {
    throw new Error(`Invalid git ref: "${ref}"`);
  }
  return sanitized;
};

export { GitService, injectToken, sanitizeGitRef };
