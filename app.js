const bodyParser = require("body-parser");
const express = require("express");
const bcrypt = require("bcrypt");

const db = require("./util/db");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(async (req, res, next) => {
  const user = await db.user.findFirst({
    where: {
      id: 6,
    },
  });

  if (!user) {
    return res.status(500).json({
      msg: "user does not found",
    });
  }

  req.user = user;
  next();
});

app.post("/signup", async (req, res, next) => {
  try {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role ? req.body.role : "USER";

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
        role,
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
        email: "user does't exist!!",
      },
    });
  }

  const correctPassword = await bcrypt.compare(password, user.password);

  if (!correctPassword) {
    return res.status(422).json({
      error: {
        email: "Incorrect password",
      },
    });
  }

  return res.status(200).json({
    user,
  });
});

app.post("/note", async (req, res, next) => {
  const content = req.body.content;
  const id = req.user.id;
  const post = await db.note.create({
    data: {
      content,
      user_id: id,
    },
  });
  return res.status(201).json({
    post,
  });
});

app.get(
  "/note/:id",
  (req, res, next) => {
    if (+req.params.id === req.user.id || req.user.role === "ADMIN") {
      return next();
    }
    return res.status(403).json({
      msg: "NOT FOUND!!!",
    });
  },
  async (req, res, next) => {
    return res.status(200).json({
      note: await db.note.findMany({
        where: {
          user_id: +req.params.id,
        },
        omit: {
          id: true,
        },
      }),
    });
  }
);

app.delete(
  "/user/delete",
  async (req, res, next) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        msg: "only admin can delete users",
      });
    }
    next();
  },
  async (req, res, next) => {
    const id = req.body.id;
    const user = await db.$transaction([
      db.note.deleteMany({
        where: {
          user_id: id,
        },
      }),
      db.user.delete({
        where: {
          id,
        },
      }),
    ]);
    if (!user) {
      return res.status(422).json({
        msg: "user does not exist",
      });
    }
    return res.status(200).json({ user });
  }
);

app.listen(3000);
