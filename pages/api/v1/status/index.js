import { createRouter } from "next-connect";
import database from "infra/database.js";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const router = createRouter();

router.get(getHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.status_code).json(publicErrorObject);
}

function onErrorHandler(error, req, res) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log("\n Erro dentro do next-connect: ");
  console.log(publicErrorObject);

  res.status(500).json(publicErrorObject);
}

async function getHandler(req, res) {
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

  res.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: parseInt(databaseMaxConnectionsResult),
        opened_connections: databaseOpenConnectionsValue,
      },
    },
  });
}
