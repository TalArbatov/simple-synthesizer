import { SessionEntity } from "../entities/session-entity";

interface SessionEntityGateway {
    save(session: SessionEntity): Promise<void>;

    findById(id: string): Promise<SessionEntity | null>;

    findByName(name: string): Promise<SessionEntity | null>;
}

export { SessionEntityGateway };
