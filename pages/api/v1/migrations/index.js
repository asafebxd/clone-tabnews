import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:migration"), getHandler);
router.post(postHandler);
// router.post(controller.canRequest("create:migration"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const userTryingToGet = req.context.user;

  const pendingMigrations = await migrator.listPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:migration",
    pendingMigrations,
  );
  return res.status(200).json(secureOutputValues);
}

async function postHandler(req, res) {
  // const userTryingToPost = req.context.user;
  const migratedMigrations = await migrator.runPendingMigrations();

  // const secureOutputValues = authorization.filterOutput(
  //   userTryingToPost,
  //   "read:migration",
  //   migratedMigrations,
  // );

  // if (secureOutputValues.length > 0) {
  //   return res.status(201).json(secureOutputValues);
  // }
  return res.status(200).json(migratedMigrations);
}
