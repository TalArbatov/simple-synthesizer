import { PresetEntity } from "../entities/preset-entity";
import { PresetEntityGateway } from "../ports/preset-entity-gateway";

type CreatePresetInput = {
    accountId: string;
    presetData: Record<string, unknown>;
};

class CreatePresetUseCase {
    private readonly presetEntityGateway: PresetEntityGateway;

    constructor(presetEntityGateway: PresetEntityGateway) {
        this.presetEntityGateway = presetEntityGateway;
    }

    async execute(input: CreatePresetInput): Promise<PresetEntity> {
        const { accountId, presetData } = input;

        const presetEntity = new PresetEntity({ accountId, presetData });

        await this.presetEntityGateway.save(presetEntity);

        return presetEntity;
    }
}

export { CreatePresetUseCase, CreatePresetInput };
