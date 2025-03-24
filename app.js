const bodyParser = require("body-parser");
const express = require("express");
const bcrypt = require("bcrypt");

const db = require("./util/db");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/signup", async (req, res, next) => {
  try {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const user = await db.user.findUnique({
      where: {
        email,
      },
    });
    if (user) {
      return res.status(422).json({
        error: {
          email: "email aiready exists",
        },
      });
    }
    const encPassword = await bcrypt.hash(password, 12);
    const newUser = await db.user.create({
      data: {
        email,
        username,
        password: encPassword,
      },
    });
    res.status(201).json({
      newUser,
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/login", async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(422).json({
      error: {
        email: "email aiready exists",
      },
    });
  }

  const correctPassword = await bcrypt.compare(password, user.password);
  if (!correctPassword) {
    return res.status(422).json({
      error: {
        email: "incoorect password",
      },
    });
  }
  return res.status(200).json({
    user,
  });
});

app.listen(3000);
