import database from "infra/database";

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function validateUniqueEmail(email) {
    const results = await database.query({
      text: ` 
        SELECT
          email
          FROM
            users
        WHERE
          LOWER(email) = LOWER($1)
        ;`,
      values: [email],
    });
    return results.rows[0];
  }

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: ` 
        INSERT INTO 
            users (username, email, password) 
        VALUES 
            ($1, $2, $3)
        RETURNING
          *
        ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });
    return results.rows[0];
  }
}

const user = {
  create,
};

export default user;
