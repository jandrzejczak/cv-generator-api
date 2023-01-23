const { createDatabase } = require("./database");

const initDB = async () => {
    try {
    await createDatabase();
    console.log(`Succesfuly created database.`);
    } catch (err) {
        console.log(`Error :(  ${err})`);
    }
  };

initDB();