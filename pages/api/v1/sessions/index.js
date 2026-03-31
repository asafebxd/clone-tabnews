import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication";
import authorization from "models/authorization";
import session from "models/session";
import { ForbidenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;

  const authenticatedUser = await authentication.getUser(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbidenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso você acredite que isto seja um erro.",
    });
  }

  controller.setSessionCookie(newSession.token, res);

  const secureOutputValues = authorization.filterOutput(
    authenticatedUser,
    "read:session",
    newSession,
  );

  return res.status(201).json(secureOutputValues);
}

async function deleteHandler(req, res) {
  const userTryingToDelete = req.context.user;
  const sessionToken = req.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);

  const expiredSession = await session.expiredById(sessionObject.id);
  controller.clearSessionCookie(res);

  const secureOutputValues = authorization.filterOutput(
    userTryingToDelete,
    "read:session",
    expiredSession,
  );

  return res.status(200).json(secureOutputValues);
}
