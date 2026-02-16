import { nanoid } from "nanoid";

class SessionEntity {
    private readonly id: string;
    private readonly name: string;
    private readonly createdAt: Date;

    public constructor(opts: {
        id?: string;
        name: string;
        createdAt?: Date;
    }) {
        this.id = opts.id ?? nanoid(8);
        this.name = opts.name;
        this.createdAt = opts.createdAt ?? new Date();
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getCreatedAt(): Date {
        return this.createdAt;
    }
}

export { SessionEntity };
