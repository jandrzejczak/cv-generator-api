const Sequelize = require("sequelize");
const finale = require("finale-rest");

const database = new Sequelize({
  dialect: "sqlite",
  storage: "./database/necuro_db.sqlite",
});

const User = database.define("user", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  first_name: Sequelize.STRING,
  last_name: Sequelize.STRING,
  email: Sequelize.STRING,
  password: Sequelize.STRING,
  token: Sequelize.STRING,
  avatar: { type: Sequelize.STRING, allowNull: true },
});

const Layout = database.define("layouts", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  layout_name: Sequelize.STRING,
  style_id: Sequelize.STRING,
  file_path: Sequelize.STRING,
});

const ElementType = database.define(
  "element_types",
  {
    type: Sequelize.STRING,
    resizable: Sequelize.BOOLEAN,
  },
  {
    timestamps: false,
  }
);

const LayoutElement = database.define("layout_elements", {
  x: Sequelize.NUMBER,
  y: Sequelize.NUMBER,
  w: Sequelize.NUMBER,
  h: Sequelize.NUMBER,
});

const ElementContent = database.define(
  "elements_content",
  {
    header: Sequelize.STRING,
    text: Sequelize.STRING,
    date: Sequelize.STRING,
  },
  {
    timestamps: false,
  }
);

// Relations
ElementType.hasMany(LayoutElement, { onDelete: "cascade" });
Layout.hasMany(LayoutElement, { onDelete: "cascade" });
User.hasMany(Layout, { onDelete: "cascade" });
LayoutElement.hasOne(ElementContent);

const initializeDatabase = async (app) => {
  finale.initialize({ app, sequelize: database });

  // Debug
  finale.resource({
    model: User,
    endpoints: ["/users", "/users/:id"],
  });
  finale.resource({
    model: Layout,
    endpoints: ["/layouts", "/layouts/:id"],
  });

  await database.sync();
};

const createDatabase = async () => {
  await database.sync({ force: true });

  await User.create({
    first_name: "Testing",
    last_name: "New",
    email: "test@test.com",
    password: "$2a$10$4oeR.e4mdoKGVP0RaSdLNuf6NHaacIaiHYRV2hqRur7jBQrYP2Ykq",
    token: null,
    avatar: null,
  })

  await ElementType.bulkCreate([
    {
      type: "HeaderElement",
      resizable: false,
    },
    {
      type: "SimpleTextElement",
      resizable: true,
    },
    {
      type: "HorizontalSpacer",
      resizable: true,
    },
    {
      type: "VerticalSpacer",
      resizable: true,
    },
    {
      type: "BulletTextElement",
      resizable: true,
    },
  ]);
};

module.exports = {
  initializeDatabase,
  createDatabase,
  User,
  ElementType,
  Layout,
  LayoutElement,
  ElementContent,
};
