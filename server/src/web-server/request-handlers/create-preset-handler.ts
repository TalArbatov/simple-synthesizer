import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { ValidationError } from '../utils/server-error';

interface RequestBody {
    account_id: string;
    preset_data: Record<string, unknown>;
}

interface CreatePresetRoute extends RouteGenericInterface {
    Body: RequestBody;
}

const createPresetHandler = async (req: FastifyRequest<CreatePresetRoute>, res: FastifyReply) => {
    const { account_id, preset_data } = req.body;

    if (!account_id || typeof account_id !== 'string' || account_id.trim().length === 0) {
        throw new ValidationError('account_id is required');
    }

    if (!preset_data || typeof preset_data !== 'object') {
        throw new ValidationError('preset_data is required and must be an object');
    }

    const createPresetUseCase = req.appProfile.getCreatePresetUseCase();

    const presetEntity = await createPresetUseCase.execute({
        accountId: account_id.trim(),
        presetData: preset_data,
    });

    res.code(201).send({ presetId: presetEntity.getId() });
};

export { createPresetHandler };
