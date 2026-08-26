export type DiscoveryStage = "interpreting" | "literature" | "proposals" | "saving";

export type DiscoveryErrorCode =
  | "briefing-too-short"
  | "research-starter-empty"
  | "research-starter-config"
  | "research-starter-unauthorized"
  | "research-starter-unavailable"
  | "gemini-quota-exhausted"
  | "gemini-unavailable"
  | "unverified-references"
  | "proposal-shape-invalid"
  | "unexpected";

export class DiscoveryError extends Error {
  readonly code: DiscoveryErrorCode;
  readonly stage: DiscoveryStage;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: { code: DiscoveryErrorCode; stage: DiscoveryStage; retryable?: boolean },
  ) {
    super(message);
    this.name = "DiscoveryError";
    this.code = options.code;
    this.stage = options.stage;
    this.retryable = options.retryable ?? true;
  }
}
