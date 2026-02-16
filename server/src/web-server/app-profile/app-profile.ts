import { SessionEntityGateway } from "../../app/ports/session-entity-gateway";
import { PresetEntityGateway } from "../../app/ports/preset-entity-gateway";
import { PostgresqlDB } from "../../data-persistence/postgresql";
import { Pool } from 'pg';
import { SessionEntityType, PresetEntityType } from "../../types";
import { SessionPostgresEntityGateway } from "../../adapters/postgres-gateways/session-postgres-entity-gateway";
import { PresetPostgresEntityGateway } from "../../adapters/postgres-gateways/preset-postgres-entity-gateway";
import { CreateSessionUseCase } from "../../app/use-cases/create-session-use-case";
import { FindSessionUseCase } from "../../app/use-cases/find-session-use-case";
import { CreatePresetUseCase } from "../../app/use-cases/create-preset-use-case";

type Config = {
    pgPool: Pool;
};

abstract class AppProfile {
    private readonly pgPool: Pool;

    public constructor(config: Config) {
        this.pgPool = config.pgPool;
    }

    public getSessionEntityGateway(): SessionEntityGateway {
        const postgresqlDb = new PostgresqlDB<SessionEntityType>(this.pgPool, "sessions");

        return new SessionPostgresEntityGateway(postgresqlDb);
    }

    public getPresetEntityGateway(): PresetEntityGateway {
        const postgresqlDb = new PostgresqlDB<PresetEntityType>(this.pgPool, "presets");

        return new PresetPostgresEntityGateway(postgresqlDb);
    }

    public getCreateSessionUseCase(): CreateSessionUseCase {
        return new CreateSessionUseCase(this.getSessionEntityGateway());
    }

    public getFindSessionUseCase(): FindSessionUseCase {
        return new FindSessionUseCase(this.getSessionEntityGateway());
    }

    public getCreatePresetUseCase(): CreatePresetUseCase {
        return new CreatePresetUseCase(this.getPresetEntityGateway());
    }
}

export { AppProfile };
