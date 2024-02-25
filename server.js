require("dotenv").config();
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const File = require("./models/File");
const path = require("path");
const express = require("express");

const app = express();

app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "uploads" });
// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));
mongoose.connect(process.env.DATABASE_URL);

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const fileData = {
      path: req.file.path,
      originalName: req.file.originalname,
    };
    if (req.body.password != null && req.body.password !== "") {
      fileData.password = await bcrypt.hash(req.body.password, 10);
    }

    // Handle expiration logic
    const { expiryDate, expiryTime } = req.body;
    // console.log(expiryDate, expiryTime);
    // Check if expiresInDate and expiresInTime are provided
    if (!expiryDate || !expiryTime) {
      throw new Error("Expiration date and time are required.");
    }

    const file = await File.create({
      path: req.file.path,
      originalName: req.file.originalname,
      password: fileData.password,
      expiryDate,
      expiryTime,
    });

    res.render("index", {
      fileLink: `${req.headers.origin}/file/${file.id}`,
      expiryTime: expiryTime,
      expiryDate: expiryDate,
    });
  } catch (error) {
    // console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.route("/file/:id").get(handleDownload).post(handleDownload);

async function handleDownload(req, res) {
  const file = await File.findById(req.params.id);

  if (file.password != null) {
    if (req.body.password == null) {
      res.render("password");
      return;
    }

    if (!(await bcrypt.compare(req.body.password, file.password))) {
      res.render("password", { error: true });
      return;
    }

    // Check if the file has expired based on both date and time
    if (file.expiryDate && file.expiryTime) {
      const currentDate = new Date();
      const expiryDate = new Date(file.expiryDate);
      const [hours, minutes] = file.expiryTime.split(":");

      expiryDate.setHours(Number(hours), Number(minutes));
      // console.log(expiryDate);
      if (expiryDate <= currentDate) {
        res.render("expired", {
          expired: true,
        });
        return;
      }
    }
  }

  await file.save();

  res.download(file.path, file.originalName);
}

app.listen(process.env.PORT);
