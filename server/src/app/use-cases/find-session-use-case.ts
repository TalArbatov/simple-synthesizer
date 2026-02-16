import { SessionEntity } from "../entities/session-entity";
import { SessionEntityGateway } from "../ports/session-entity-gateway";
import { SessionNotFoundError } from "../errors/session-errors";

type FindSessionInput = {
    name: string;
};

class FindSessionUseCase {
    private readonly sessionEntityGateway: SessionEntityGateway;

    constructor(sessionEntityGateway: SessionEntityGateway) {
        this.sessionEntityGateway = sessionEntityGateway;
    }

    async execute(input: FindSessionInput): Promise<SessionEntity> {
        const { name } = input;

        const session = await this.sessionEntityGateway.findByName(name);

        if (!session) {
            throw new SessionNotFoundError(name);
        }

        return session;
    }
}

export { FindSessionUseCase, FindSessionInput };
