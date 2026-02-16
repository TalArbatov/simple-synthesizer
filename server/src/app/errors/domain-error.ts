export abstract class DomainError extends Error {
    public abstract readonly code: string;

    protected constructor(message: string) {
        super(message);
        this.name = "DomainError";
    }
}
