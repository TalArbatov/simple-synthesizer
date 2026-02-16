export class ServerError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: unknown;
    public readonly expose: boolean;

    constructor(opts: {
        message: string;
        statusCode: number;
        code: string;
        details?: unknown;
        expose?: boolean;
        cause?: unknown;
    }) {
        super(opts.message);
        this.name = "ServerError";
        this.statusCode = opts.statusCode;
        this.code = opts.code;
        this.details = opts.details;
        this.expose = opts.expose ?? true;

        // @ts-expect-error
        if (opts.cause) this.cause = opts.cause;
    }
}

export class NotFoundError extends ServerError {
    constructor(message = "Resource not found", details?: unknown) {
        super({ message, statusCode: 404, code: "NOT_FOUND", details });
    }
}

export class ValidationError extends ServerError {
    constructor(message = "Validation error", details?: unknown) {
        super({ message, statusCode: 400, code: "VALIDATION_ERROR", details });
    }
}

export class GeneralError extends ServerError {
    constructor(message = "General Error", details?: unknown) {
        super({ message, statusCode: 500, code: "GENERAL", details });
    }
}
