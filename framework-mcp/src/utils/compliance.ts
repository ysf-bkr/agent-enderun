import ts from "typescript";

/**
 * Enterprise Compliance Guardrail
 * Checks content against corporate standards using AST analysis before allowing file mutations.
 */
export function verifyCorporateCompliance(content: string, filePath: string): void {
    // Skip compliance checks for non-source files or specific ignored files
    if (filePath.endsWith(".json") || filePath.endsWith(".md") || filePath.endsWith(".env.example")) {
        return;
    }

    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );

    const errors: string[] = [];

    /**
     * Recursive AST Visitor
     */
    function visit(node: ts.Node) {
        // 1. Zero Console Policy
        if (ts.isPropertyAccessExpression(node)) {
            const expression = node.expression;
            const name = node.name.text;
            if (ts.isIdentifier(expression) && expression.text === "console") {
                if (["log", "warn", "error"].includes(name)) {
                    // Check if file is exempt
                    if (!filePath.includes("logger.ts") && !filePath.includes("check.ts") && !filePath.includes("cli.ts")) {
                        errors.push(`❌ Corporate Compliance Breach: 'console.${name}' usage is forbidden at line ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}.`);
                    }
                }
            }
        }

        // 2. No Explicit Any Policy
        if (ts.isTypeReferenceNode(node)) {
            if (ts.isIdentifier(node.typeName) && node.typeName.text === "any") {
                if (!filePath.includes("definitions.ts") && !filePath.includes("types.ts")) {
                    errors.push(`❌ Corporate Compliance Breach: 'any' type is forbidden at line ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}.`);
                }
            }
        }
        
        // 3. Zero UI Library Policy (No @chakra-ui, mui, @shadcn)
        if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier)) {
                const forbiddenLibs = ["@chakra-ui", "mui", "@shadcn", "antd", "bootstrap"];
                const lib = forbiddenLibs.find(l => moduleSpecifier.text.includes(l));
                if (lib) {
                    errors.push(`❌ Corporate Compliance Breach: External UI library '${lib}' usage is FORBIDDEN at line ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}. Build atomic components manually instead.`);
                }
            }
        }
        
        // Handle 'any' as a keyword type (e.g., parameter: any)
        if (node.kind === ts.SyntaxKind.AnyKeyword) {
            if (!filePath.includes("definitions.ts") && !filePath.includes("types.ts")) {
                errors.push(`❌ Corporate Compliance Breach: 'any' keyword is forbidden at line ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}.`);
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    // 3. Hardcoded Secrets & PII Guard
    const piiKeywords = [
        { regex: /API_KEY\s*=\s*['"][^'"]+['"]/i, msg: "Hardcoded API Key" },
        { regex: /SECRET\s*=\s*['"][^'"]+['"]/i, msg: "Hardcoded Secret" },
        { regex: /PASSWORD\s*=\s*['"][^'"]+['"]/i, msg: "Hardcoded Password" },
        { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, msg: "PII Detected: Email Address" },
        { regex: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, msg: "PII Detected: Credit Card Pattern" }
    ];
    
    for (const { regex, msg } of piiKeywords) {
        if (regex.test(content)) {
            // Allow emails in specific files like README or package.json
            if (msg.includes("Email") && (filePath.endsWith("README.md") || filePath.endsWith("package.json") || filePath.includes("CONTRIBUTING"))) {
                continue;
            }
            errors.push(`❌ Corporate Compliance Breach: ${msg} detected.`);
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join("\n"));
    }
}
