import database from "../../../../infra/database.js";

async function status(req, res) {
  const result = await database.query("SELECT 1 + 1 as sum");
  console.log(result);
  res
    .status(200)
    .json({ chave: "alunos do curso.dev sao pessoas acima da media" });
}

export default status;
