import { PresetEntity } from "../entities/preset-entity";

interface PresetEntityGateway {
    save(preset: PresetEntity): Promise<void>;

    findById(id: string): Promise<PresetEntity | null>;

    findByAccountId(accountId: string): Promise<PresetEntity[]>;
}

export { PresetEntityGateway };
