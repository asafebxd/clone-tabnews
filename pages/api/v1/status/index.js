import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller";
import authorization from "models/authorization";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .handler(controller.errorHandlers);

async function getHandler(req, res) {
  const userTryingToGet = req.context.user;
  const updatedAt = new Date().toISOString();

  const databaseName = process.env.POSTGRES_DB;
  const databaseVersionResult = await database.query(`SHOW server_version;`);
  const databaseVersionValue = databaseVersionResult.rows[0].server_version;

  const databaseMaxConnections = await database.query(`SHOW max_connections;`);
  const databaseMaxConnectionsResult =
    databaseMaxConnections.rows[0].max_connections;

  const databaseOpenedConnectionsResult = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });
  const databaseOpenConnectionsValue =
    databaseOpenedConnectionsResult.rows[0].count;

  const statusObject = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: parseInt(databaseMaxConnectionsResult),
        opened_connections: databaseOpenConnectionsValue,
      },
    },
  };

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusObject,
  );

  return res.status(200).json(secureOutputValues);
}
