import fs from "fs";
import path from "path";

/**
 * Ensures directory existence.
 */
export function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Atomically writes a text file.
 */
export function writeTextFileAtomic(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    ensureDir(dir);

    const tempPath = `${filePath}.${Math.random().toString(36).slice(2, 9)}.tmp`;
    const finalContent = content.endsWith("\n") ? content : `${content}\n`;

    try {
        fs.writeFileSync(tempPath, finalContent, "utf8");
        fs.renameSync(tempPath, filePath);
    } catch (err) {
        if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
        }
        throw err;
    }
}

/**
 * Atomically appends to a file (if supported by OS) or simulates it.
 * Note: Real atomic append on POSIX is a single write() call with O_APPEND.
 * For simplicity and robustness across platforms, we use a simple append here
 * as the risk of corruption is lower than a full rewrite, but for logs
 * it's acceptable.
 */
export function appendFileSafe(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    ensureDir(dir);
    fs.appendFileSync(filePath, content, "utf8");
}
