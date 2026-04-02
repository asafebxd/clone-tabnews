import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import authorization from "models/authorization";
import { ForbidenError } from "infra/errors";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .patch(controller.canRequest("update:user"), patchHandler)
  .handler(controller.errorHandlers);

async function getHandler(req, res) {
  const userTryingToGet = req.context.user;

  const username = req.query.username;
  const userFound = await user.findOneByUsername(username);

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user",
    userFound,
  );

  return res.status(200).json(secureOutputValues);
}

async function patchHandler(req, res) {
  const username = req.query.username;
  const userInputValues = req.body;

  // user, feature, resource
  const userTryingToPatch = req.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbidenError({
      message: "Você não possui permissão para atualizar outro usuário.",
      action:
        "Verifique se você possui a feature necessária para atualizar outro usuário.",
    });
  }

  const updatedUser = await user.update(username, userInputValues);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:user",
    updatedUser,
  );

  return res.status(200).json(secureOutputValues);
}
