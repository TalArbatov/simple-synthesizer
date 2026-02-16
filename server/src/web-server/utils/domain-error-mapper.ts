import { DomainError } from "../../app/errors/domain-error";
import { ServerError } from "./server-error";
import { SessionNotFoundError } from "../../app/errors/session-errors";

export function mapDomainErrorToServerError(err: DomainError): ServerError {
    if (err instanceof SessionNotFoundError) {
        return new ServerError({
            message: err.message,
            statusCode: 404,
            code: err.code,
            expose: true,
            cause: err,
        });
    }

    // Fallback
    return new ServerError({
        message: err.message,
        statusCode: 422,
        code: err.code ?? "DOMAIN_ERROR",
        details: err,
        expose: true,
        cause: err,
    });
}
