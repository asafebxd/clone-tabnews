import email from "infra/email";
import orchestratror from "tests/orchestrator";

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestratror.deleteAllEmails();

    await email.send({
      from: "Asafe <contato@teste.com.br>",
      to: "contato@urso.dev",
      subject: "Teste de assunto",
      text: "Teste de corpo.",
    });

    await email.send({
      from: "Asafe <contato@teste.com.br>",
      to: "contato@curso.dev",
      subject: "Último email enviado",
      text: "Corpo do último email.",
    });

    const lastEmail = await orchestratror.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@teste.com.br>");
    expect(lastEmail.recipients[0]).toBe("<contato@curso.dev>");
    expect(lastEmail.subject).toBe("Último email enviado");
    expect(lastEmail.text).toBe("Corpo do último email.\r\n");
  });
});
