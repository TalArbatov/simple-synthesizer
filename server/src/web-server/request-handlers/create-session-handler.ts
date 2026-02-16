import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { ValidationError } from '../utils/server-error';

interface RequestBody {
    name: string;
}

interface CreateSessionRoute extends RouteGenericInterface {
    Body: RequestBody;
}

const createSessionHandler = async (req: FastifyRequest<CreateSessionRoute>, res: FastifyReply) => {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new ValidationError('Session name is required');
    }

    const createSessionUseCase = req.appProfile.getCreateSessionUseCase();

    const sessionEntity = await createSessionUseCase.execute({ name: name.trim() });

    res.code(201).send({ sessionId: sessionEntity.getId() });
};

export { createSessionHandler };
