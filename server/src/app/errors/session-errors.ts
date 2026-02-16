import { DomainError } from "./domain-error";

export class SessionNotFoundError extends DomainError {
    public readonly code = "SESSION_NOT_FOUND";
    constructor(name: string) {
        super(`Session not found: ${name}`);
        this.name = "SessionNotFoundError";
    }
}
