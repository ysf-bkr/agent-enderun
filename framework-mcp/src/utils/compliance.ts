/**
 * Enterprise Compliance Guardrail
 * Checks content against corporate standards before allowing file mutations.
 */
export function verifyCorporateCompliance(content: string, filePath: string): void {
    // 1. Zero Console Policy
    if (content.includes("console.log(") || content.includes("console.warn(") || content.includes("console.error(")) {
        if (!filePath.includes("logger.ts") && !filePath.includes("check.ts") && !filePath.includes("cli.ts")) {
            throw new Error(
                "❌ Corporate Compliance Breach: 'console.log/warn/error' usage is forbidden. " +
                "Use the 'logger' system from '@/shared/logger' instead."
            );
        }
    }

    // 2. No Explicit Any Policy
    const anyRegex = /[:<]\s*any\b|\bas\s+any\b/g;
    if (anyRegex.test(content)) {
        if (!filePath.includes("definitions.ts") && !filePath.includes("types.ts")) {
            throw new Error(
                "❌ Corporate Compliance Breach: 'any' type is forbidden. " +
                "Use 'unknown', 'generics', or proper interfaces for type safety."
            );
        }
    }

    // 3. Hardcoded Secrets Guard (Simple heuristic)
    const secretKeywords = [/API_KEY\s*=\s*['"][^'"]+['"]/i, /SECRET\s*=\s*['"][^'"]+['"]/i, /PASSWORD\s*=\s*['"][^'"]+['"]/i];
    for (const regex of secretKeywords) {
        if (regex.test(content) && !filePath.endsWith(".env.example")) {
            throw new Error(
                "❌ Corporate Compliance Breach: Hardcoded secrets detected. " +
                "All sensitive data must be managed via '.env' files."
            );
        }
    }
}
