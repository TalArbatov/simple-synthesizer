import "dotenv/config";
import config from "config";
import { Pool } from "pg";

const once = <T>(cb: () => T): (() => T) => {
    let t: undefined | T;
    return () => {
        if (!t) t = cb();
        return t;
    };
};

export { once };

const Config = {
    get(key: string): any {
        try {
            return config.get(key);
        } catch {
            return undefined;
        }
    },

    getPostgresPool: once((): Pool => {
        const connectionConfig = config.get("postgresql") as Record<string, any>;

        const pool = new Pool({
            ...connectionConfig,
            max: connectionConfig.max ?? 10,
        });

        pool.on("connect", () => {
            console.log("Postgres pool connected");
        });
        pool.on("error", (err) => {
            console.error("Unexpected Postgres pool error", err);
        });

        return pool;
    }),

    closePostgresPool: async (): Promise<void> => {
        const pool = Config.getPostgresPool();
        await pool.end();
    },
};

export { Config };
