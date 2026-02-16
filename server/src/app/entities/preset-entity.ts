import { nanoid } from "nanoid";

class PresetEntity {
    private readonly id: string;
    private readonly accountId: string;
    private readonly presetData: Record<string, unknown>;
    private readonly createdAt: Date;

    public constructor(opts: {
        id?: string;
        accountId: string;
        presetData: Record<string, unknown>;
        createdAt?: Date;
    }) {
        this.id = opts.id ?? nanoid(8);
        this.accountId = opts.accountId;
        this.presetData = opts.presetData;
        this.createdAt = opts.createdAt ?? new Date();
    }

    public getId(): string {
        return this.id;
    }

    public getAccountId(): string {
        return this.accountId;
    }

    public getPresetData(): Record<string, unknown> {
        return this.presetData;
    }

    public getCreatedAt(): Date {
        return this.createdAt;
    }
}

export { PresetEntity };
