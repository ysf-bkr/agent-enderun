import { describe, it, expect } from "vitest";
import {
    EnderunBaseError,
    ConfigurationError,
    ValidationError,
    AdapterError,
    OrchestrationError
} from "../src/shared/errors.js";

describe("Enderun Shared Errors", () => {
    it("should instantiate EnderunBaseError with default values", () => {
        const error = new EnderunBaseError("Something went wrong");
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(EnderunBaseError);
        expect(error.name).toBe("EnderunBaseError");
        expect(error.message).toBe("Something went wrong");
        expect(error.code).toBe("ENDERUN_INTERNAL_ERROR");
        expect(error.timestamp).toBeInstanceOf(Date);
        expect(error.details).toBeUndefined();
    });

    it("should instantiate EnderunBaseError with custom code and details", () => {
        const details = { foo: "bar" };
        const error = new EnderunBaseError("Custom error message", "CUSTOM_CODE", details);
        expect(error.code).toBe("CUSTOM_CODE");
        expect(error.details).toEqual(details);
    });

    it("should serialize to JSON correctly", () => {
        const details = { code: 500 };
        const error = new EnderunBaseError("JSON serialization test", "SERIALIZE_CODE", details);
        const json = error.toJSON();
        
        expect(json.name).toBe("EnderunBaseError");
        expect(json.message).toBe("JSON serialization test");
        expect(json.code).toBe("SERIALIZE_CODE");
        expect(json.timestamp).toBe(error.timestamp.toISOString());
        expect(json.details).toEqual(details);
        expect(json.stack).toBe(error.stack);
    });

    it("should instantiate ConfigurationError correctly", () => {
        const error = new ConfigurationError("Invalid config file", { file: "config.json" });
        expect(error).toBeInstanceOf(EnderunBaseError);
        expect(error).toBeInstanceOf(ConfigurationError);
        expect(error.code).toBe("CONFIGURATION_ERROR");
        expect(error.message).toBe("Invalid config file");
        expect(error.details).toEqual({ file: "config.json" });
    });

    it("should instantiate ValidationError correctly", () => {
        const error = new ValidationError("Invalid username", { field: "username" });
        expect(error).toBeInstanceOf(EnderunBaseError);
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.message).toBe("Invalid username");
        expect(error.details).toEqual({ field: "username" });
    });

    it("should instantiate AdapterError with formatted message", () => {
        const error = new AdapterError("Connection timeout", "github-adapter", { host: "github.com" });
        expect(error).toBeInstanceOf(EnderunBaseError);
        expect(error).toBeInstanceOf(AdapterError);
        expect(error.code).toBe("ADAPTER_ERROR");
        expect(error.message).toBe("Adapter 'github-adapter' failure: Connection timeout");
        expect(error.details).toEqual({ host: "github.com" });
    });

    it("should instantiate OrchestrationError correctly", () => {
        const error = new OrchestrationError("Agent failed to respond", { agent: "coder" });
        expect(error).toBeInstanceOf(EnderunBaseError);
        expect(error).toBeInstanceOf(OrchestrationError);
        expect(error.code).toBe("ORCHESTRATION_ERROR");
        expect(error.message).toBe("Agent failed to respond");
        expect(error.details).toEqual({ agent: "coder" });
    });
});
