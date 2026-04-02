import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import activation from "models/activation";
import authorization from "models/authorization";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("create:user"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userTryingToPost = req.context.user;
  const userInputValues = req.body;

  const newUser = await user.create(userInputValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    "read:user",
    newUser,
  );

  return res.status(201).json(secureOutputValues);
}
