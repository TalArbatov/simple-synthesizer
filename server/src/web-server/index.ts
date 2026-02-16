import { Config } from "./config";
import { createServer } from "./server";

const main = async () => {
    const port = Config.get('web-server.port') || 4000;

    const app = await createServer();

    app.listen({
        port,
        host: '0.0.0.0'
    }, () => {
        console.log(`listening on port ${port}`);
    });
};

main();
