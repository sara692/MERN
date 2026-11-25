# Level 1: Express Server + MongoDB + Notes API

This is the first step of a MERN project (MongoDB, Express, React, Node). In this level we build **only the backend**: a small server that connects to MongoDB and lets you **read** and **write** notes through HTTP endpoints.

React comes in a later level.

---

## What you will learn

- What Node.js and Express do
- How to connect a Node app to MongoDB with Mongoose
- What a schema, a model and a document are
- How to create a REST endpoint (GET and POST)
- How to keep secrets in a `.env` file
- How to test an API with `curl`

---

## Requirements

- **Node.js 18 or newer** (check with `node -v`)
- **A MongoDB database**: either MongoDB Atlas (free cloud) or MongoDB installed locally
- **Git Bash** (on Windows) or any terminal
- A code editor such as VS Code

---

## Project structure

```
mern-demo/
└── server/
    ├── models/
    │   └── Note.js        <- defines what a note looks like
    ├── routes/
    │   └── notes.js       <- the endpoints (read and write notes)
    ├── .env               <- secrets and settings (NEVER commit this)
    ├── .gitignore         <- tells Git which files to ignore
    ├── server.js          <- the entry point that starts everything
    └── package.json       <- project info and the list of packages
```

---

## Step 1: Create the folders and install packages

Run this from the folder where you want the project:

```bash
mkdir -p mern-demo/server/{models,routes} \
  && cd mern-demo/server \
  && touch server.js .env .gitignore models/Note.js routes/notes.js \
  && npm init -y \
  && npm install express mongoose dotenv cors
```

What each package does:

| Package | Purpose |
|---|---|
| `express` | The web framework. It receives requests and sends responses. |
| `mongoose` | Lets you talk to MongoDB using schemas and models instead of raw queries. |
| `dotenv` | Loads the values in `.env` into `process.env`. |
| `cors` | Allows a browser app on another address (like React on port 5173) to call this API. |

---

## Step 2: Environment variables (`.env`)

The `.env` file holds settings and secrets so they are not written inside your code.

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/mern_demo
```

- `PORT`: the port the server listens on.
- `MONGO_URI`: the address of your database. The last part (`mern_demo`) is the **database name**. MongoDB creates it automatically when you save the first document.

For MongoDB Atlas, use the connection string from Atlas instead (see "Connecting to Atlas" below).

### `.gitignore`

```
node_modules
.env
```

This keeps two things out of GitHub:
- `node_modules`: thousands of downloaded files that anyone can recreate with `npm install`.
- `.env`: it contains your database password.

---

## Step 3: The model (`models/Note.js`)

```js
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
```

### Explanation

- **Schema** (`noteSchema`): describes the shape of the data. A note has a `title` (required text) and `content` (text, empty by default).
  - `required: true` means saving fails without it.
  - `trim: true` removes spaces at the start and end.
  - `default: ""` is used when no value is given.
- **`timestamps: true`**: Mongoose adds `createdAt` and `updatedAt` to every note automatically.
- **Model** (`mongoose.model("Note", noteSchema)`): a class built from the schema. It is your tool to read and write the collection.
  - `"Note"` is the model name.
  - MongoDB stores the data in a collection named after it, lowercase and plural: **`notes`**.
  - The variable `Note` that holds the model is just a label. You can name it anything, but using the model name is the convention.

### Three words to remember

| Word | Meaning | Example |
|---|---|---|
| Model | The tool for one collection | `Note` |
| Document | One saved item | `{ title: "Hi", content: "..." }` |
| Collection | All documents of one kind | `notes` |

The collection is created automatically the first time you save a document.

---

## Step 4: The routes (`routes/notes.js`)

```js
const express = require("express");
const Note = require("../models/Note");

const router = express.Router();

// READ: get all notes
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WRITE: create a note
router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    const note = await Note.create({ title, content });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

### Explanation

- `express.Router()` creates a small group of routes that we plug into the app in `server.js`.
- `router.get("/")` handles **GET** requests (reading data).
- `router.post("/")` handles **POST** requests (sending new data).
- `async` / `await`: database calls take time, so we wait for them to finish.
- `Note.find()` returns all documents. `.sort({ createdAt: -1 })` puts the newest first.
- `Note.create({...})` creates and saves one document.
- `req.body` is the JSON the client sent.
- `res.json(...)` sends JSON back. `res.status(201)` means "created". `400` means the client sent bad data. `500` means a server error.
- `try / catch` makes sure an error returns a clean response instead of crashing the server.

---

## Step 5: The entry point (`server.js`)

```js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const notesRouter = require("./routes/notes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("API is running"));
app.use("/api/notes", notesRouter);

// Connect to MongoDB, then start the server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
```

### Explanation

- `require("dotenv").config()` must come first. It loads `.env` so `process.env.PORT` and `process.env.MONGO_URI` work.
- **Middleware** runs on every request before your routes:
  - `cors()` allows requests from other origins.
  - `express.json()` turns the JSON body of a request into `req.body`. Without it, `req.body` is `undefined`.
- `app.use("/api/notes", notesRouter)` means every route in `notes.js` starts with `/api/notes`. So `router.get("/")` becomes `GET /api/notes`.
- The server starts listening **only after** the database connects. If the connection fails, the error is printed and the app exits.

### How a request travels

```
Request -> server.js -> middleware (cors, json) -> routes/notes.js -> Note model -> MongoDB
```

---

## Step 6: Run the server

```bash
node --watch server.js
```

`--watch` restarts the server every time you save a `.js` file. It does **not** restart when you change `.env`. After editing `.env`, stop the server with `Ctrl+C` and start it again.

Expected output:

```
Connected to MongoDB
Server running on port 5000
```

---

## Step 7: Test the endpoints

Create a note:

```bash
curl -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"My first note","content":"Hello MERN"}'
```

Read all notes:

```bash
curl http://localhost:5000/api/notes
```

You can also open `http://localhost:5000/api/notes` in the browser (that sends a GET), or use Postman or Thunder Client for POST requests.

### API reference

| Method | URL | Body | Result |
|---|---|---|---|
| GET | `/` | none | Text: "API is running" |
| GET | `/api/notes` | none | Array of all notes, newest first |
| POST | `/api/notes` | `{ "title": "...", "content": "..." }` | The created note (status 201) |

---

## Connecting to MongoDB

### Option A: MongoDB Atlas (free cloud)

1. Create an account at mongodb.com/atlas and create a free **M0** cluster.
2. Create a **database user** (username and password).
3. In **Network Access**, add your IP address. For learning you can use `0.0.0.0/0` (anywhere).
4. Go to **Database -> Connect -> Drivers** and copy the connection string.
5. Replace `<password>`, add the database name before the `?`, and put it in `.env`:

```
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/mern_demo?retryWrites=true&w=majority
```

If your password has special characters (`@`, `#`, `/`), URL-encode them (`@` becomes `%40`).

### Option B: Local MongoDB

Install MongoDB Community Server, make sure the service is running, then use:

```
MONGO_URI=mongodb://127.0.0.1:27017/mern_demo
```

Use `127.0.0.1` instead of `localhost`, because `localhost` can resolve to IPv6 and fail.

---

## Troubleshooting

| Error | Cause and fix |
|---|---|
| `querySrv ECONNREFUSED` | Your computer's DNS cannot look up the SRV record used by `mongodb+srv://`. Use the standard `mongodb://` connection string that lists the three shard hosts directly, or change your DNS to `8.8.8.8`. |
| `mongodb+srv URI cannot have multiple service names` | You used several hosts but the string still starts with `mongodb+srv://`. Change it to `mongodb://`. |
| `connect ETIMEDOUT ...:27017` | Your IP is not allowed in Atlas **Network Access** (it changes when you change network or day), the cluster is paused, or the network blocks port 27017. |
| `bad auth` / `Authentication failed` | Wrong username or password, or missing `authSource=admin`. |
| `ECONNREFUSED 127.0.0.1:27017` | Local MongoDB is not running. Start the service. |
| `req.body` is `undefined` | You forgot `app.use(express.json())`. |
| Port 5000 already in use | Change `PORT` in `.env` (for example 5001). |
| `uri undefined` | `.env` is missing, is in the wrong folder, or `dotenv` is not loaded first. |

---

## Push to GitHub (branch `level-1`)

Branch names cannot contain spaces, so we use `level-1`.

```bash
git init
git add .
git status          # make sure .env and node_modules are NOT listed
git commit -m "Level 1: Express server with MongoDB and notes endpoints"
git branch -M level-1
git remote add origin https://github.com/YOUR_USERNAME/mern-demo.git
git push -u origin level-1
```

Never commit `.env`. If you do by mistake, change your database password immediately, because it stays in the Git history.

---

## Next: Level 2

Signup, login and logout with email and password, using JWT stored in an httpOnly cookie. See `README-level-2.md`.
