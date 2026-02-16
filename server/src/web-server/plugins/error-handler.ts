import { FastifyError, FastifyInstance } from "fastify";
import { DomainError } from "../../app/errors/domain-error";
import { mapDomainErrorToServerError } from '../utils/domain-error-mapper';
import type { ErrorResponse } from "../../types";
import { ServerError } from "../utils/server-error";

function isFastifyValidationError(err: unknown): err is FastifyError & { validation: unknown } {
    return typeof err === "object" && err !== null && "validation" in err;
}

export async function errorHandlerPlugin(app: FastifyInstance) {
    app.setErrorHandler(async (err, request, reply) => {
        if (reply.sent) {
            request.log.error({ err }, "Error after reply was sent");
            return;
        }

        let error: unknown = err;

        // 1) Validation errors
        if ((err as FastifyError).code === "FST_ERR_VALIDATION" || isFastifyValidationError(err)) {
            const body: ErrorResponse = {
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Request validation failed",
                    requestId: request.id,
                    details: (err as any).validation,
                },
            };

            request.log.warn({ err }, "Validation error");
            return reply.status(400).send(body);
        }

        // 2) Domain errors -> ServerError
        if (error instanceof DomainError) {
            error = mapDomainErrorToServerError(error);
        }

        // 3) App errors (after mapping or thrown directly)
        if (error instanceof ServerError) {
            const level = error.statusCode >= 500 ? "error" : "warn";
            request.log[level]({ err: error }, "App error");

            const body: ErrorResponse = {
                error: {
                    code: error.code,
                    message: error.expose ? error.message : "Internal server error",
                    requestId: request.id,
                    details: error.expose ? error.details : undefined,
                },
            };

            return reply.status(error.statusCode).send(body);
        }

        // 4) Fallback
        const statusCode =
            typeof (err as any).statusCode === "number" ? (err as any).statusCode : 500;

        const isServerError = statusCode >= 500;

        request.log[isServerError ? "error" : "warn"]({ err }, "Unhandled error");

        const body: ErrorResponse = {
            error: {
                code: isServerError ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
                message: isServerError ? "Internal server error" : (err as Error).message,
                requestId: request.id,
            },
        };

        return reply.status(statusCode).send(body);
    });
}
