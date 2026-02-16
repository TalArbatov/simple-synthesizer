import { PresetEntityType } from '../../types';
import { PresetEntityGateway } from "../../app/ports/preset-entity-gateway";
import { PostgresqlDB } from "../../data-persistence/postgresql";
import { PresetEntity } from "../../app/entities/preset-entity";

const mapRowToEntity = (row: PresetEntityType): PresetEntity => {
    return new PresetEntity({
        id: row.id,
        accountId: row.account_id,
        presetData: row.preset_data,
        createdAt: new Date(row.created_at),
    });
};

const mapEntityToRow = (preset: PresetEntity): PresetEntityType => {
    return {
        id: preset.getId(),
        account_id: preset.getAccountId(),
        preset_data: preset.getPresetData(),
        created_at: preset.getCreatedAt().toISOString(),
    };
};

class PresetPostgresEntityGateway implements PresetEntityGateway {
    private readonly db: PostgresqlDB<PresetEntityType>;

    public constructor(db: PostgresqlDB<PresetEntityType>) {
        this.db = db;
    }

    async save(preset: PresetEntity): Promise<void> {
        await this.db.create(mapEntityToRow(preset));
    }

    async findById(id: string): Promise<PresetEntity | null> {
        const result = await this.db.find(id);

        if (result)
            return mapRowToEntity(result);
        else
            return null;
    }

    async findByAccountId(accountId: string): Promise<PresetEntity[]> {
        const results = await this.db.get({ key: 'account_id', value: accountId });

        return results.map(mapRowToEntity);
    }
}

export { PresetPostgresEntityGateway };
