const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  User,
  ElementType,
  Layout,
  LayoutElement,
  ElementContent,
} = require("../config/database");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const path = require("path");

// User management
router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    if (!(email && password && first_name && last_name)) {
      res.status(400).send("Error: All input are required.");
      return;
    }

    // Check if user exists
    if (await User.findOne({ where: { email: email } })) {
      res.status(409).send("User Already Exist. Please Login.");
      return;
    }
    //Encrypt password
    encryptedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: encryptedPassword,
    });

    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    user.token = token;
    res.status(201).json(user);
    return;
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: Server error");
    return;
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!(email && password)) {
      res.status(400).send("Error: All inputs are required");
      return;
    }
    const user = await User.findOne({
      attributes: ["first_name", "last_name", "email", "password", "avatar"],
      where: { email: email },
    });
    const authenticate = await bcrypt.compare(password, user.password);
    if (user && authenticate) {
      // Create token
      const token = jwt.sign(
        { user_id: user._id, email, id: user.id },
        process.env.TOKEN_KEY,
        {
          expiresIn: "4h",
        }
      );
      user.token = token;
      res.status(200).json(user);
      return;
    }
    res.status(401).send("Error: Invalid Credentials");
    return;
  } catch (err) {
    console.log(err);
    res.status(404).send("Error: No user found");
    return;
  }
});

router.post("/update-user", async (req, res) => {
  try {
    const data = req.body;

    // Validate input
    if (!(data.first_name && data.last_name && data.password)) {
      res.status(400).send("Error: All inputs are required");
      return;
    }
    const user = await User.findOne({
      where: { email: data.email },
    });
    const authenticate = await bcrypt.compare(data.current_password, user.password);
    if (user && authenticate) {

      encryptedPassword = await bcrypt.hash(data.password, 10);

      await User.update(
        {
          first_name: data.first_name,
          last_name: data.last_name,
          first_name: data.first_name,
          password: encryptedPassword,
        },
        {
          where: { id: user.id },
        }
      );
      res.status(200).json(user);
      return;
    }
    res.status(401).send("Error: Invalid Credentials");
    return;
  } catch (err) {
    console.log(err);
    res.status(404).send("Error: No user found");
    return;
  }
});

router.post("/add-layout", auth, async (req, res) => {
  try {
    const data = req.body;

    const user = await User.findOne({
      where: { email: req.user.email },
    });

    if (!!!data.layout) {
      res.status(400).send("Error: Layout empty!");
      return;
    }

    if (!!!data.layoutName) {
      res.status(400).send("Error: Layout name not specified!");
      return;
    }

    // Check if name exists
    const checkName = await Layout.findOne({
      where: { layout_name: data.layoutName },
    });

    if (checkName) {
      res.status(409).send("Error: This name already exists!");
      return;
    }

    // Create new layout
    const layout = await Layout.create({
      layout_name: data.layoutName,
      style_id: "1",
      file_path: "../../example.pdf",
      userId: user.id,
    });

    let items = data.layout;

    for (const item of Object.values(items)) {
      let elementType = await ElementType.findOne({
        where: { type: item.type },
      });
      let layoutElement = await LayoutElement.create({
        elementTypeId: elementType.id,
        layoutId: layout.id,
        ...item,
      });
      console.log(layoutElement);
      console.log(item);
      await ElementContent.create({
        layoutElementId: layoutElement.id,
        ...item.data,
      });
    }

    res.status(200).json("Layout succesfuly added!");
    return;
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: Server error");
    return;
  }
});

router.put("/update-layout", auth, async (req, res) => {
  try {
    const data = req.body;
    const user = await User.findOne({
      where: { email: req.user.email },
    });

    if (!!!data.layout) {
      res.status(400).send("Error: Layout empty!");
      return;
    }

    if (!!!data.layoutName) {
      res.status(400).send("Error: Layout name not specified!");
      return;
    }

    // Delete layout
    const layoutElements = await LayoutElement.findAll({
      where: { layoutId: data.overwriteLayout },
      raw: true,
    });

    for (const item of Object.values(layoutElements)) {
      await ElementContent.destroy({
        where: { layoutElementId: item.id },
      });
    }

    await LayoutElement.destroy({
      where: { layoutId: data.overwriteLayout },
    });

    await Layout.destroy({
      where: { id: data.overwriteLayout },
    });

    // Create new layout
    const layout = await Layout.create({
      layout_name: data.layoutName,
      style_id: "1",
      file_path: "../../example.pdf",
      userId: user.id,
    });

    let items = data.layout;

    for (const item of Object.values(items)) {
      let elementType = await ElementType.findOne({
        where: { type: item.type },
      });
      let layoutElement = await LayoutElement.create({
        elementTypeId: elementType.id,
        layoutId: layout.id,
        ...item,
      });
      await ElementContent.create({
        layoutElementId: layoutElement.id,
        ...item.data,
      });
    }

    res.status(200).json("Layout succesfuly added!");
    return;
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: Server error");
    return;
  }
});

router.delete("/delete-layout", auth, async (req, res) => {
  try {
    const data = req.body;

    // Delete layout
    const layoutElements = await LayoutElement.findAll({
      where: { layoutId: data.layoutId },
      raw: true,
    });

    for (const item of Object.values(layoutElements)) {
      await ElementContent.destroy({
        where: { layoutElementId: item.id },
      });
    }

    await LayoutElement.destroy({
      where: { layoutId: data.layoutId },
    });

    await Layout.destroy({
      where: { id: data.layoutId },
    });

    res.status(200).json("Layout succesfuly deleted!");
    return;
  } catch (err) {
    console.log(err);
    res.status(500).json("Error: Couldn't delete layout");
    return;
  }
});

router.get("/get-all-layouts", auth, async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.user.email },
    });

    const layouts = await Layout.findAll({
      where: { userId: user.id },
    });

    res.status(200).json(layouts);
    return;
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: Server error");
    return;
  }
});

router.post("/get-layout", auth, async (req, res) => {
  try {
    const id = req.body.layoutId;

    const layoutElements = await LayoutElement.findAll({
      where: { layoutId: id },
      raw: true,
    });

    const response = [];

    for (const item of Object.values(layoutElements)) {
      let elementType = await ElementType.findOne({
        where: { id: item.elementTypeId },
      });
      let elementContent = await ElementContent.findOne({
        where: { layoutElementId: item.id },
        raw: true,
      });
      // TODO cleanup
      delete elementContent.layoutElementId;
      delete elementContent.id;
      let tempObj = {
        i: item.id,
        type: elementType.type,
        resizable: elementType.resizable,
        data: {
          ...elementContent,
        },
        ...item,
      };
      // TODO cleanup
      delete tempObj.id;
      delete tempObj.layoutId;
      delete tempObj.elementTypeId;
      response.push(tempObj);
    }

    res.status(200).json(response);
    return;
  } catch (err) {
    console.log(err);
    res.status(500).send("Error: Server error");
    return;
  }
});

router.post("/upload-image", auth, async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.user.email },
    });
    const { image } = req.files;
    if (!image) return res.sendStatus(400);
    // if (/^image/.test(image.mimetype)) return res.sendStatus(400);

    let imagePath =
      process.env.SERVER_ADDRESS +
      process.env.PORT +
      "/images/" +
      user.id +
      "." +
      image.name.split(".").pop();
    let reqPath = path.join(__dirname, '..', "/public/images/", `${user.id}.${image.name.split(".").pop()}`);
    image.mv(reqPath);
    await User.update(
      {
        avatar: imagePath,
      },
      {
        where: { id: user.id },
      }
    );
    res.status(200).json(user);
    return;
  } catch (err) {
    res.status(500).send("Error: Server error");
  }
});

module.exports = router;
