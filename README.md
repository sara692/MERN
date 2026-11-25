# Level 2: Authentication (Signup, Login, Logout) with JWT in an httpOnly Cookie

This level builds on Level 1. We add **user accounts**: signup with email and password, login, logout, and a way for the website to check whether a visitor is already logged in. Everything is backend only. The React frontend will use these endpoints in a later level.

---

## What you will learn

- How to store users safely in MongoDB
- Why passwords must be hashed, and how bcrypt does it
- What a JWT is and how to create and verify one
- Why we send the token in an **httpOnly cookie**
- What middleware is and how to protect routes
- How the frontend will later check "is this user already logged in?"

---

## Prerequisites

- Level 1 working (server runs and connects to MongoDB)
- Node.js 18+

---

## Key concepts for beginners

### Hashing vs encryption
A **hash** is a one-way scrambling of a password. You cannot turn it back into the original. We store only the hash, so even if the database leaks, real passwords are not exposed. At login we hash what the user typed and compare it with the stored hash. **bcrypt** is a hashing algorithm designed to be slow, which makes guessing attacks expensive.

### JWT (JSON Web Token)
A JWT is a signed string the server gives to the user after login. It contains the user's id and an expiry time. The server signs it with a secret key (`JWT_SECRET`). Nobody can change it or create a fake one without knowing that secret. On later requests the server verifies the signature and knows who the user is, without asking for the password again.

### Why an httpOnly cookie
The token has to be stored in the browser somehow. If JavaScript can read it (like in `localStorage`), an attacker who injects a script into your page (XSS) can steal it. A cookie marked **httpOnly** cannot be read by JavaScript at all. The browser attaches it to requests automatically.

### Cookie flags we use

| Flag | Meaning |
|---|---|
| `httpOnly: true` | JavaScript in the browser cannot read the cookie |
| `secure: true` (production) | Cookie is sent only over HTTPS |
| `sameSite: "lax"` | The cookie is not sent on most cross-site requests, which helps against CSRF |
| `maxAge` | How long the cookie lives (7 days here) |

---

## How the flow works

```
SIGNUP / LOGIN
  client sends email + password
  -> server checks / creates the user
  -> server creates a JWT
  -> server sets it in an httpOnly cookie named "token"

LATER REQUESTS
  browser sends the cookie automatically
  -> middleware reads the cookie, verifies the JWT
  -> loads the user and lets the request continue

USER VISITS THE WEBSITE (before logging in again)
  frontend calls GET /api/auth/me
  -> 200 = valid cookie, user is considered logged in
  -> 401 = no cookie or invalid, show the login page

LOGOUT
  server clears the cookie
```

---

## Project structure after this level

```
server/
├── middleware/
│   └── auth.js        <- NEW: checks the cookie and protects routes
├── models/
│   ├── Note.js
│   └── User.js        <- NEW: the user schema (email, hashed password)
├── routes/
│   ├── auth.js        <- NEW: signup, login, logout, me
│   └── notes.js
├── .env               <- now also holds JWT settings
├── server.js          <- updated: cookie-parser, CORS credentials, auth routes
└── package.json
```

---

## Step 1: Create the branch and install packages

```bash
git checkout -b level-2
cd server
npm install bcryptjs jsonwebtoken cookie-parser
mkdir middleware
touch models/User.js middleware/auth.js routes/auth.js
```

| Package | Purpose |
|---|---|
| `bcryptjs` | Hash and compare passwords |
| `jsonwebtoken` | Create and verify JWTs |
| `cookie-parser` | Makes cookies available as `req.cookies` |

---

## Step 2: Environment variables

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to `.env`:

```
PORT=5000
MONGO_URI=your_connection_string
JWT_SECRET=paste_the_long_random_string_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

| Variable | Meaning |
|---|---|
| `JWT_SECRET` | The secret used to sign tokens. Keep it private and never commit it. |
| `JWT_EXPIRES_IN` | How long a token is valid |
| `CLIENT_URL` | The exact address of the React app (needed for CORS with cookies) |
| `NODE_ENV` | `development` locally, `production` when deployed (turns on `secure` cookies) |

Restart the server after changing `.env`.

---

## Step 3: The User model (`models/User.js`)

```js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
```

### Explanation

- `unique: true` creates a database index so two users cannot share an email.
- `lowercase: true` and `trim: true` normalize the email (`Ali@Test.com ` becomes `ali@test.com`).
- `minlength: 8` rejects short passwords.
- **`select: false`**: the password hash is hidden from normal queries. This prevents accidentally sending it to the client.
- **`pre("save")` hook**: runs automatically before a user is saved. It hashes the password with bcrypt (12 rounds). The check `isModified("password")` makes sure we only hash when the password actually changed, so we never hash a hash.
- **`comparePassword`**: a custom method on every user document. It compares the typed password with the stored hash and returns true or false.

The model is named `"User"`, so MongoDB stores the data in the `users` collection.

---

## Step 4: The auth middleware (`middleware/auth.js`)

```js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function protect(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
```

### Explanation

**Middleware** is a function that runs between the request and your route. It can stop the request (send a response) or let it continue with `next()`.

This one:
1. Reads the cookie named `token` from `req.cookies`.
2. If there is no cookie, responds `401 Unauthorized`.
3. `jwt.verify` checks the signature and expiry. If the token is fake or expired, it throws, and the `catch` responds `401`.
4. Loads the user from the database using the id stored in the token.
5. Attaches the user to `req.user` so the next route can use it.
6. Calls `next()` to continue.

---

## Step 5: The auth routes (`routes/auth.js`)

```js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const protect = require("../middleware/auth");

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendAuthResponse = (res, user, status = 200) => {
  const token = signToken(user._id);
  res.cookie("token", token, cookieOptions);
  res.status(status).json({
    user: { id: user._id, name: user.name, email: user.email },
  });
};

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const user = await User.create({ name, email, password });
    sendAuthResponse(res, user, 201);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    sendAuthResponse(res, user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// CHECK IF LOGGED IN
router.get("/me", protect, (req, res) => {
  const { _id, name, email } = req.user;
  res.json({ user: { id: _id, name, email } });
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ message: "Logged out" });
});

module.exports = router;
```

### Explanation, piece by piece

**`cookieOptions`**: the cookie settings explained earlier. Reused for setting and clearing.

**`signToken(id)`**: creates a JWT whose payload is `{ id }` (the user's MongoDB `_id`), signed with `JWT_SECRET`, valid for `JWT_EXPIRES_IN`.

**`sendAuthResponse`**: a helper used by both signup and login. It creates the token, stores it in the cookie with `res.cookie("token", token, cookieOptions)`, and returns the user's public info. The password is never sent.

**`res.cookie("token", ...)`**: `"token"` is only the cookie's name. You can rename it, but you must use the same name when setting (`res.cookie`), reading (`req.cookies.token`) and clearing (`res.clearCookie`). Cookies are shared across ports on localhost, so if two projects use the same cookie name they can overwrite each other. A more specific name like `mern_demo_token` avoids this.

**POST `/signup`**
1. Validates that email and password exist and the password has 8+ characters.
2. Checks if the email is already used (409 Conflict).
3. `User.create` saves the user. The `pre("save")` hook hashes the password automatically.
4. Sends the cookie and the user info with status 201.
5. The `err.code === 11000` check handles the rare case of two signups with the same email at the same moment (MongoDB's unique index rejects the second).

**POST `/login`**
1. Finds the user by email. `.select("+password")` means "include the password hash even though it is hidden by default", because we need it to compare. (`+` adds the field to the defaults, while `.select("password")` would return only that field.)
2. Compares passwords with `comparePassword`.
3. Uses the **same error message** whether the email or the password is wrong, so an attacker cannot learn which emails are registered.
4. On success, sets the cookie.

**GET `/me`**: protected by the `protect` middleware. If the cookie is valid, it returns the user. If not, `protect` already answered `401`. This is the endpoint the frontend calls when the site loads to know whether the visitor is already logged in.

**POST `/logout`**: removes the cookie. The options must match the ones used to set it, or the browser may not delete it.

---

## Step 6: Update `server.js`

```js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const notesRouter = require("./routes/notes");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => res.send("API is running"));
app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);

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

### What changed

- `cookieParser()` lets Express read cookies into `req.cookies`.
- `cors({ origin, credentials: true })`: for cookies to work across origins, the server must name the exact allowed origin (a `*` wildcard is not allowed) and enable `credentials`.
- `app.use("/api/auth", authRouter)` mounts the new routes.

### Optional: require login for notes

```js
const protect = require("./middleware/auth");
app.use("/api/notes", protect, notesRouter);
```

---

## Step 7: Test it

Use **Git Bash** or Postman/Thunder Client. In curl, `-c cookies.txt` saves cookies and `-b cookies.txt` sends them back, like a browser does.

```bash
# 1. Signup (saves the cookie)
curl -i -c cookies.txt -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Ali","email":"ali@test.com","password":"password123"}'

# 2. Am I logged in? (sends the cookie)
curl -b cookies.txt http://localhost:5000/api/auth/me

# 3. Without a cookie (expect 401)
curl -i http://localhost:5000/api/auth/me

# 4. Logout, then check again (expect 401)
curl -b cookies.txt -c cookies.txt -X POST http://localhost:5000/api/auth/logout
curl -i -b cookies.txt http://localhost:5000/api/auth/me

# 5. Login
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ali@test.com","password":"password123"}'
```

In the signup response, look for the header:

```
Set-Cookie: token=eyJhbGci...; Path=/; Expires=...; HttpOnly; SameSite=Lax
```

`HttpOnly` there confirms the cookie is protected from JavaScript.

Do not commit `cookies.txt`. Delete it or add it to `.gitignore`.

---

## API reference

| Method | URL | Body | Auth needed | Result |
|---|---|---|---|---|
| POST | `/api/auth/signup` | `{ name, email, password }` | No | 201, user info, cookie set |
| POST | `/api/auth/login` | `{ email, password }` | No | 200, user info, cookie set |
| GET | `/api/auth/me` | none | Yes (cookie) | 200 user info, or 401 |
| POST | `/api/auth/logout` | none | No | 200, cookie cleared |

### Status codes used

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request (missing or invalid data) |
| 401 | Not authenticated (no cookie, bad token, wrong credentials) |
| 409 | Conflict (email already registered) |
| 500 | Server error |

---

## Security summary

| Choice | Why |
|---|---|
| bcrypt with 12 rounds | Passwords are stored as slow-to-crack hashes |
| `select: false` on password | The hash never leaks in normal queries |
| httpOnly cookie | JavaScript cannot steal the token via XSS |
| `sameSite: "lax"` | Reduces CSRF risk |
| `secure` in production | Cookie travels only over HTTPS |
| Same error for wrong email or password | Does not reveal which emails exist |
| Long random `JWT_SECRET` in `.env` | Nobody can forge tokens |
| Token expiry | A stolen token stops working after 7 days |

---

## What the frontend will need later

- Send cookies with every request: `fetch(url, { credentials: "include" })`, or Axios `withCredentials: true`.
- On page load, call `GET /api/auth/me`. A 200 means show the logged-in UI, a 401 means show the login page.
- `CLIENT_URL` in `.env` must match the React app's exact address, including the port.

---

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| `connect ETIMEDOUT ...:27017` | Your IP is not allowed in Atlas **Network Access** (it can change daily), the cluster is paused (click Resume), or your network blocks port 27017 (try a phone hotspot). |
| `querySrv ECONNREFUSED` | DNS cannot resolve `mongodb+srv://`. Use the standard `mongodb://` string with the three hosts, or change DNS to `8.8.8.8`. |
| `/me` always returns 401 | Cookie not being sent. In curl use `-b cookies.txt`. In the browser use `credentials: "include"`. Also check that the cookie name matches in all three places. |
| `req.cookies` is undefined | `app.use(cookieParser())` is missing or placed after the routes. |
| `secretOrPrivateKey must have a value` | `JWT_SECRET` is missing from `.env`, or the server was not restarted after editing it. |
| CORS error in the browser | `CLIENT_URL` does not exactly match the frontend origin, or `credentials: true` is missing. |
| Duplicate key error (E11000) | That email already exists. Use another email or delete the user in Atlas. |
| Cookie does not clear on logout | The options in `clearCookie` must match those used in `res.cookie`. |
| Cookie disappears or changes unexpectedly on localhost | Cookies are shared across ports. Use a unique cookie name per project. |

You can inspect cookies in Chrome: `F12` -> **Application** -> **Cookies**.

---

## Commit and push

```bash
git status        # .env and cookies.txt must NOT be listed
git add .
git commit -m "Level 2: signup, login, logout and /me with JWT httpOnly cookie"
git push -u origin level-2
```

---

## Next steps

- Link notes to the logged-in user so each person sees only their own notes
- Add update and delete endpoints for notes (full CRUD)
- Build the React frontend that uses these endpoints
