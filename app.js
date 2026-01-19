const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const _ = require("lodash");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// =======================
// DATABASE
// =======================

async function connectDB() {
  await mongoose.connect(
    "mongodb+srv://hossamnabilelgendy_db_user:jVMudYCzDzYwiSNQ@cluster0.ffwhgvn.mongodb.net/todolistDB",
  );
  console.log("✅ Connected to MongoDB");
}

connectDB();

// =======================
// SCHEMA & MODEL
// =======================

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const customListSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const CustomList = mongoose.model("CustomList", customListSchema);
// =======================
// DEFAULT ITEMS
// =======================
const defaultItems = [
  { name: "Welcome To Your Todolist" },
  { name: "Click + To Add New Item" },
  { name: "Click - To Delete Item" },
];
async function insertDefaultItems(listName) {
  const count = await Item.countDocuments();

  if (count === 0) {
    await Item.insertMany(defaultItems);
    console.log("✅ Default items added");
  }
}

insertDefaultItems();

// =======================
// customList
// =======================

// =======================
// ROUTES
// =======================

app.get("/", async function (req, res) {
  const items = await Item.find({});
  // const itemNames = items.map((it) => it.name);
  // const itemNames = (await Item.distinct("name")).reverse();
  res.render("list", { listTitle: "Today", listIteams: items });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  CustomList.findOne({ name: customListName }).then(function (foundList) {
    if (!foundList) {
      const customList = new CustomList({
        name: customListName,
        items: defaultItems,
      });
      customList.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        listIteams: foundList.items,
      });
    }
  });
});

app.post("/", async function (req, res) {
  const itemName = req.body.listIteam;
  const listName = req.body.list;
  if (listName !== "Today") {
    CustomList.findOne({ name: listName }).then(function (foundList) {
      const customItem = new Item({ name: itemName });
      foundList.items.push(customItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  } else {
    const item = new Item({ name: itemName });
    await item.save();
    res.redirect("/");
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName !== "Today") {
    await CustomList.findOneAndUpdate({ name: listName }).then(
      function (foundList) {
        foundList.items.pull({ _id: checkedItemId });
        foundList.save();
        res.redirect("/" + listName);
      },
    );
  } else {
    await Item.findByIdAndDelete(checkedItemId);
    res.redirect("/");
  }
  // await Item.deleteOne({ _id: checkedItemId });
});

// =======================
// SERVER
// =======================

// app.listen(3000, function () {
//   console.log("🚀 Server is running on port 3000");
// });
module.exports = app;
