/**
 * Agent Enderun Framework — Internal Branded Types
 * Used to enforce absolute type safety within the core orchestration logic.
 */

export type Brand<K, T> = K & { __brand: T };

export type TraceID = Brand<string, "TraceID">;
export type AgentID = Brand<string, "AgentID">;
export type PhaseID = Brand<string, "PhaseID">;
export type ProjectPath = Brand<string, "ProjectPath">;

/**
 * Casts a raw string to a Branded Type.
 * Use this only at the boundaries of the system.
 */
export function asTraceID(val: string): TraceID { return val as TraceID; }
export function asAgentID(val: string): AgentID { return val as AgentID; }
export function asPhaseID(val: string): PhaseID { return val as PhaseID; }
export function asProjectPath(val: string): ProjectPath { return val as ProjectPath; }
