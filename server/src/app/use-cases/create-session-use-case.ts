import { SessionEntity } from "../entities/session-entity";
import { SessionEntityGateway } from "../ports/session-entity-gateway";

type CreateSessionInput = {
    name: string;
};

class CreateSessionUseCase {
    private readonly sessionEntityGateway: SessionEntityGateway;

    constructor(sessionEntityGateway: SessionEntityGateway) {
        this.sessionEntityGateway = sessionEntityGateway;
    }

    async execute(input: CreateSessionInput): Promise<SessionEntity> {
        const { name } = input;

        const sessionEntity = new SessionEntity({ name });

        await this.sessionEntityGateway.save(sessionEntity);

        return sessionEntity;
    }
}

export { CreateSessionUseCase, CreateSessionInput };
