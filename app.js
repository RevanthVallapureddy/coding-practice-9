const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const filePath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBServer();

// API 1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const userSelectQuery = `SELECT * FROM user
    WHERE username = '${username}'`;
  const dbUser = await db.get(userSelectQuery);
  if (dbUser === undefined) {
    const isPasswordShort = password.length < 5;
    if (isPasswordShort) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const createUserQuery = `INSERT INTO
            user(username,name,password,gender,location)
            VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}' );`;
      await db.run(createUserQuery);
      response.status = 200;
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

// API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user
    WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

// API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user
    WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched) {
      const isNewPasswordShort = newPassword.length < 5;
      if (isNewPasswordShort) {
        response.status = 400;
        response.send("Password is too short");
      } else {
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `UPDATE user SET
                password = '${newHashedPassword}'
                WHERE username = '${username}'`;
        await db.run(updatePasswordQuery);
        response.status = 200;
        response.send("Password updated");
      }
    } else {
      response.status = 400;
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
