import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { ValidationError } from '../utils/server-error';

interface FindSessionRoute extends RouteGenericInterface {
    Querystring: { name?: string };
}

const findSessionHandler = async (req: FastifyRequest<FindSessionRoute>, res: FastifyReply) => {
    const { name } = req.query;

    if (!name || typeof name !== 'string') {
        throw new ValidationError('Query parameter "name" is required');
    }

    const findSessionUseCase = req.appProfile.getFindSessionUseCase();

    const sessionEntity = await findSessionUseCase.execute({ name });

    res.send({ sessionId: sessionEntity.getId() });
};

export { findSessionHandler };
