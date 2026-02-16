import { SessionEntityType } from '../../types';
import { SessionEntityGateway } from "../../app/ports/session-entity-gateway";
import { PostgresqlDB } from "../../data-persistence/postgresql";
import { SessionEntity } from "../../app/entities/session-entity";

const mapRowToEntity = (row: SessionEntityType): SessionEntity => {
    return new SessionEntity({
        id: row.id,
        name: row.name,
        createdAt: new Date(row.created_at),
    });
};

const mapEntityToRow = (session: SessionEntity): SessionEntityType => {
    return {
        id: session.getId(),
        name: session.getName(),
        created_at: session.getCreatedAt().toISOString(),
    };
};

class SessionPostgresEntityGateway implements SessionEntityGateway {
    private readonly db: PostgresqlDB<SessionEntityType>;

    public constructor(db: PostgresqlDB<SessionEntityType>) {
        this.db = db;
    }

    async save(session: SessionEntity): Promise<void> {
        await this.db.create(mapEntityToRow(session));
    }

    async findById(id: string): Promise<SessionEntity | null> {
        const result = await this.db.find(id);

        if (result)
            return mapRowToEntity(result);
        else
            return null;
    }

    async findByName(name: string): Promise<SessionEntity | null> {
        const result = await this.db.get({ key: 'name', value: name });

        if (result.length > 0)
            return mapRowToEntity(result[0]);
        else
            return null;
    }
}

export { SessionPostgresEntityGateway };
