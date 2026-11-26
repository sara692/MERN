# Level 4: AI Chat with OpenRouter (Free Models) + Home Page

In this level we add an **AI chat** to the project. Each logged-in user has their own saved conversation. The AI answers come from a **free model on OpenRouter**. We also add a **home page** where, after login, the user chooses between **Notes** and **AI Chat**.

---

## What you will learn

- How an LLM API works (the `messages` format, roles, and why the model has no memory)
- How to call OpenRouter from Node.js with plain `fetch`
- How to use free models (`:free`), their limits, and a fallback list
- Why the API key must stay on the server
- How to store a conversation in MongoDB (embedded sub-documents)
- How to build a chat UI in React (optimistic updates, auto-scroll, Markdown)
- How to rate-limit an endpoint
- How to build a home page with navigation cards

---

## Big picture

```
React Chat page
      |  POST /api/chat  { content: "Hello" }   (cookie sent automatically)
      v
Express: protect middleware  -> who is the user?  (from the JWT cookie)
      v
routes/chat.js  -> loads this user's conversation from MongoDB
      v
services/openrouter.js -> sends the recent messages to a free model on OpenRouter
      v
saves the user message + AI reply in MongoDB -> returns them to React
```

**Why the API key must stay on the server:** everything inside a React app (even `VITE_` variables) is visible to every visitor. If the key were there, anyone could steal it and use your quota. So React only talks to your backend, and your backend talks to OpenRouter.

---

## Requirements

- Levels 1 to 3 working (server, auth, React client)
- Node.js 18+ (it has `fetch` built in)
- A free OpenRouter account and API key

---

## About OpenRouter free models

- OpenRouter is one API that gives access to many AI models.
- Add **`:free`** to a model ID to use its free version, for example `provider/model-name:free`.
- **Limits:** all `:free` models share the same account-wide limits (not per model): about **20 requests per minute** and **50 requests per day**. The daily limit rises to 1,000 if the account has bought at least $10 of credits. Check OpenRouter's rate limit page for the current numbers.
- **Free models come and go.** A model that works today can disappear. That is why we keep a list of models in `.env` and list the current ones with a command instead of hard-coding one.
- Some free providers may log or train on prompts. Do not send private data to the chat.
- This is great for learning, but not for a production service with many users.

### Get an API key

1. Sign up at openrouter.ai.
2. Go to **Settings -> Keys** and create a key.
3. Copy it (it starts with `sk-or-v1-`). You will put it in `server/.env`.

### List the free models available today

The models endpoint is public. Run this in Git Bash or PowerShell:

```bash
node -e "fetch('https://openrouter.ai/api/v1/models').then(r=>r.json()).then(j=>j.data.filter(m=>m.id.endsWith(':free')).forEach(m=>console.log(m.id)))"
```

Pick 2 or 3 general chat or instruct models from the list. We try them in order, so if one is down the next one answers.

---

## Project structure after this level

```
mern-demo/
├── server/
│   ├── middleware/auth.js
│   ├── models/
│   │   ├── Chat.js              <- NEW: stores each user's conversation
│   │   ├── Note.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── chat.js              <- NEW: chat endpoints
│   │   └── notes.js
│   ├── services/
│   │   └── openrouter.js        <- NEW: talks to the LLM
│   ├── .env                     <- now holds the OpenRouter key and models
│   └── server.js                <- updated
└── client/
    └── src/
        ├── components/Header.jsx   <- updated: navigation buttons
        ├── pages/
        │   ├── Home.jsx            <- NEW: choose Notes or Chat
        │   ├── Chat.jsx            <- NEW: the chat page
        │   ├── Notes.jsx
        │   ├── Login.jsx
        │   └── Signup.jsx
        └── App.jsx                 <- updated: new routes
```

---

## Part A: Backend

### Step 1: Branch and packages

```bash
git checkout -b level-4
cd server
mkdir services
touch models/Chat.js routes/chat.js services/openrouter.js
npm install express-rate-limit
```

We do not need an AI package. OpenRouter is plain HTTP, and Node 18+ has `fetch`.

### Step 2: Environment variables (`server/.env`)

Add these lines (use the model IDs from your own list):

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODELS=provider/model-one:free,provider/model-two:free
```

- `OPENROUTER_API_KEY`: your secret key. Never commit it and never paste it into chats.
- `OPENROUTER_MODELS`: a comma-separated list. The first is tried first, then the next if it fails.

Restart the server after editing `.env`.

### Step 3: The Chat model (`models/Chat.js`)

```js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    messages: [messageSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chat", chatSchema);
```

Explanation:

- Each user has **one** chat document. `unique: true` on `user` enforces that.
- `messages` is an array of **embedded sub-documents**. One query returns the whole conversation.
- `role` is `"user"` (what the person typed) or `"assistant"` (what the AI answered).
- `ref: "User"` links the chat to a document in the `users` collection.
- The model is named `"Chat"`, so MongoDB stores it in the `chats` collection.
- Limit: one MongoDB document can be at most 16 MB. This is fine for a demo. Later you can store one document per message, or support several chats per user.

### Step 4: The LLM service (`services/openrouter.js`)

```js
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function askLLM(messages) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const models = (process.env.OPENROUTER_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!apiKey) throw new Error("OPENROUTER_API_KEY is missing");
  if (models.length === 0) throw new Error("OPENROUTER_MODELS is missing");

  let lastError;

  for (const model of models) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
          "X-OpenRouter-Title": "MERN Demo Chat",
        },
        body: JSON.stringify({ model, messages }),
        signal: AbortSignal.timeout(25000),
      });

      const data = await res.json();

      if (!res.ok) {
        const err = new Error(
          data?.error?.message || `OpenRouter error ${res.status}`,
        );
        err.status = res.status;
        throw err;
      }

      const reply = data.choices?.[0]?.message?.content;
      if (!reply || !reply.trim()) throw new Error("Empty reply from model");

      return { reply: reply.trim(), model };
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed: ${err.message}`);
      if ([401, 402, 429].includes(err.status)) break;
    }
  }

  throw lastError;
}

module.exports = { askLLM };
```

Explanation:

- **`messages`** is a list of `{ role, content }` objects. Roles are `system` (instructions for the AI), `user` and `assistant`. The model has **no memory**, so every request must include the previous messages.
- **`Authorization: Bearer <key>`** is how you prove who you are to OpenRouter.
- **`HTTP-Referer` and `X-OpenRouter-Title`** are optional headers that identify your app.
- **Fallback loop:** if a model is gone (404), errors (5xx), times out or answers with nothing, the next model in the list is tried.
- **Early stop** on 401 (bad key), 402 (no credits) and 429 (rate limit): the limit is account-wide, so another free model would fail the same way.
- **`AbortSignal.timeout(25000)`** gives up on a model after 25 seconds, so the user is not left waiting forever.
- **`data.choices?.[0]?.message?.content`** is where the reply lives in the response. The `?.` prevents a crash if a part is missing.

### Step 5: Chat routes (`routes/chat.js`)

```js
const express = require("express");
const Chat = require("../models/Chat");
const { askLLM } = require("../services/openrouter");

const router = express.Router();

const MAX_LENGTH = 2000;
const CONTEXT_MESSAGES = 20;
const SYSTEM_PROMPT =
  "You are a helpful assistant. Keep answers clear and concise.";

// GET: my conversation
router.get("/", async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user._id });
    res.json({ messages: chat ? chat.messages : [] });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST: send a message, get the AI reply
router.post("/", async (req, res) => {
  try {
    const content =
      typeof req.body.content === "string" ? req.body.content.trim() : "";

    if (!content) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (content.length > MAX_LENGTH) {
      return res
        .status(400)
        .json({ error: `Message must be at most ${MAX_LENGTH} characters` });
    }

    let chat = await Chat.findOne({ user: req.user._id });
    if (!chat) chat = new Chat({ user: req.user._id, messages: [] });

    chat.messages.push({ role: "user", content });

    const context = chat.messages
      .slice(-CONTEXT_MESSAGES)
      .map(({ role, content }) => ({ role, content }));

    const { reply } = await askLLM([
      { role: "system", content: SYSTEM_PROMPT },
      ...context,
    ]);

    chat.messages.push({ role: "assistant", content: reply });
    await chat.save();

    res.status(201).json({ messages: chat.messages.slice(-2) });
  } catch (err) {
    console.error("Chat error:", err.message);
    if (err.status === 429) {
      return res
        .status(429)
        .json({ error: "The free AI limit was reached. Try again later." });
    }
    res
      .status(502)
      .json({ error: "The AI could not answer. Please try again." });
  }
});

// DELETE: clear my conversation
router.delete("/", async (req, res) => {
  try {
    await Chat.deleteOne({ user: req.user._id });
    res.json({ message: "Chat cleared" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
```

Explanation:

- **Ownership:** every query uses `req.user._id`, which comes from the verified cookie (set by the `protect` middleware). The client can never choose which user's chat to read.
- **Validation:** the message must be a non-empty string of at most 2000 characters. The server always checks, because the browser can be bypassed.
- **System prompt:** the instruction that sets the AI's behavior. It is added at the start of every request but is not saved in the database.
- **`slice(-CONTEXT_MESSAGES)`:** only the latest 20 messages are sent to the model, to keep requests small and fast.
- **`.map(({ role, content }) => ...)`:** sends only `role` and `content`, without MongoDB fields like `_id` and timestamps.
- **Saving after the answer:** if the AI fails, nothing is saved, so the conversation never ends with an unanswered message.
- **Errors:** details from OpenRouter are logged on the server only. The browser gets a friendly message. 429 gets its own message, other failures return 502 (bad gateway).
- **Response:** only the last two messages (the user's and the AI's) are returned, because the client already has the older ones.

### Step 6: Register the route with a rate limit (`server.js`)

```js
const rateLimit = require("express-rate-limit");
const chatRouter = require("./routes/chat");

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: { error: "Too many messages. Please slow down." },
});

app.use("/api/auth", authRouter);
app.use("/api/notes", protect, notesRouter);
app.use("/api/chat", protect, chatLimiter, chatRouter);
```

- Middleware runs left to right: `protect` (logged in?) -> `chatLimiter` (not too many requests?) -> `chatRouter`.
- The limiter protects your account-wide free quota. 10 requests per minute per IP is a sensible starting point.
- The notes route also uses `protect`, so it requires login, which Level 3 assumed.

Restart the server after changing `.env`.

### Step 7: Test the backend

In Git Bash, with a user you already created:

```bash
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ali@test.com","password":"password123"}'

curl -b cookies.txt -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"content":"Say hello in one sentence"}'

curl -b cookies.txt http://localhost:5000/api/chat
```

You should see the user message and the assistant reply. Do not commit `cookies.txt`.

### Chat API reference

| Method | URL         | Body                   | Result                                       |
| ------ | ----------- | ---------------------- | -------------------------------------------- |
| GET    | `/api/chat` | none                   | `{ messages: [...] }` (empty array if none)  |
| POST   | `/api/chat` | `{ "content": "..." }` | 201, `{ messages: [userMsg, assistantMsg] }` |
| DELETE | `/api/chat` | none                   | `{ message: "Chat cleared" }`                |

All three require the login cookie (401 otherwise). POST can also return 400 (bad message), 429 (limit) or 502 (AI failed).

---

## Part B: Frontend

### Step 8: Install and create files

```bash
cd ../client
npm install react-markdown
touch src/pages/Chat.jsx src/pages/Home.jsx
```

`react-markdown` renders the Markdown that AI models return (code blocks, lists, bold text). It is safe by default, because it does not render raw HTML.

### Step 9: The Chat page (`src/pages/Chat.jsx`)

```jsx
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import api from "../api";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .get("/chat")
      .then((res) => setMessages(res.data.messages))
      .catch(() => toast.error("Could not load the chat"));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setMessages((prev) => [
      ...prev,
      { _id: `temp-${Date.now()}`, role: "user", content },
    ]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post("/chat", { content }, { timeout: 90000 });
      setMessages((prev) => [...prev.slice(0, -1), ...res.data.messages]);
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1));
      setInput(content);
      toast.error(err.response?.data?.error || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Delete the whole conversation?")) return;
    try {
      await api.delete("/chat");
      setMessages([]);
    } catch {
      toast.error("Could not clear the chat");
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          AI Chat
        </Typography>
        <Button
          onClick={handleClear}
          disabled={messages.length === 0 || sending}
        >
          Clear chat
        </Button>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          height: "calc(100vh - 290px)",
          minHeight: 300,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {messages.length === 0 && (
          <Typography color="text.secondary">
            Say hello to start the conversation.
          </Typography>
        )}

        {messages.map((m) => (
          <Box
            key={m._id}
            sx={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: m.role === "user" ? "primary.main" : "action.hover",
              color:
                m.role === "user" ? "primary.contrastText" : "text.primary",
              wordBreak: "break-word",
              "& p": { m: 0 },
              "& pre": {
                overflowX: "auto",
                p: 1.5,
                borderRadius: 1,
                bgcolor: "action.selected",
              },
            }}
          >
            {m.role === "assistant" ? (
              <ReactMarkdown>{m.content}</ReactMarkdown>
            ) : (
              <Typography sx={{ whiteSpace: "pre-wrap" }}>
                {m.content}
              </Typography>
            )}
          </Box>
        ))}

        {sending && (
          <Box
            sx={{
              alignSelf: "flex-start",
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <CircularProgress size={18} />
            <Typography color="text.secondary">Thinking...</Typography>
          </Box>
        )}

        <div ref={bottomRef} />
      </Paper>

      <Box
        component="form"
        onSubmit={handleSend}
        sx={{ display: "flex", gap: 1, mt: 2 }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message (Enter to send, Shift+Enter for a new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) handleSend(e);
          }}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={sending || !input.trim()}
        >
          Send
        </Button>
      </Box>
    </Container>
  );
}
```

### Explanation

**State**

- `messages`: the conversation shown on screen.
- `input`: the text being typed.
- `sending`: true while waiting for the AI. It disables the Send button and shows "Thinking...".

**Two effects**

- The first (`[]`) loads the saved conversation once, when the page opens.
- The second runs whenever `messages` or `sending` changes, and scrolls to the bottom.

**`useRef`**

- `bottomRef` points to an invisible `<div>` at the end of the list. `scrollIntoView` scrolls to it. Unlike state, changing a ref does not re-render the page.

**Optimistic update**

- The user's message is added to the screen **before** the server answers, so the chat feels instant.
- It has a temporary `_id` (`temp-...`).
- On success, the temporary message is replaced by the two saved messages from the server (`prev.slice(0, -1)` removes the last item, then the server messages are added).
- On failure, the temporary message is removed and the text is put back in the input, so the user does not lose it.

**Rendering messages**

- `alignSelf` puts user messages on the right and AI messages on the left.
- AI messages go through `ReactMarkdown`, so code blocks and lists are formatted. User messages stay plain text (`whiteSpace: "pre-wrap"` keeps line breaks).
- The `"& p"` and `"& pre"` keys in `sx` style the elements rendered **inside** the box (no extra paragraph margins, scrollable code blocks).
- `key={m._id}` lets React track each message.

**Input**

- `multiline` with `maxRows={4}` is a text area that grows up to 4 rows.
- `onKeyDown`: Enter sends, Shift+Enter makes a new line.
- `maxLength: 2000` matches the server limit. The server still checks it, because the browser cannot be trusted.

### Step 10: Home page (`src/pages/Home.jsx`)

After login, users land here and choose where to go.

```jsx
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

const options = [
  {
    title: "Notes",
    description: "Write and keep your personal notes.",
    to: "/notes",
  },
  { title: "AI Chat", description: "Chat with an AI assistant.", to: "/chat" },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user.name || user.email}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        What would you like to do?
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 3,
        }}
      >
        {options.map((option) => (
          <Card key={option.to}>
            <CardActionArea component={RouterLink} to={option.to} sx={{ p: 2 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {option.title}
                </Typography>
                <Typography color="text.secondary">
                  {option.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
```

Explanation:

- `options` is an array and `.map()` renders one card per item. To add a new feature later, add one object.
- `CardActionArea` makes the whole card clickable. With `component={RouterLink}` it works as a `<Link>`, so there is no page reload.
- `gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }` is responsive: one column on phones, two columns from 600px up.
- `user` cannot be `null` here, because this page is inside `ProtectedRoute`.
- Login and Signup already redirect to `/`, so no change is needed there. The home page now lives at `/`, and Notes moved to `/notes`.

### Step 11: Routes (`src/App.jsx`)

```jsx
import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Notes from "./pages/Notes";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <Notes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
```

Every page except login and signup is wrapped in `ProtectedRoute`, so a visitor without a valid cookie is redirected to `/login`.

### Step 12: Header navigation (`src/components/Header.jsx`)

```jsx
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { AppBar, Button, Toolbar, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, color: "inherit", textDecoration: "none" }}
        >
          MERN Demo
        </Typography>

        {user && (
          <>
            <Button color="inherit" component={RouterLink} to="/notes">
              Notes
            </Button>
            <Button color="inherit" component={RouterLink} to="/chat">
              Chat
            </Button>
            <Typography sx={{ mx: 2 }}>{user.name || user.email}</Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
```

- The title is a link to `/` (the home page). `component={RouterLink}` turns the MUI `Typography` into a router link. `color: "inherit"` and `textDecoration: "none"` remove the default blue underlined link style.
- The Notes and Chat buttons use `component={RouterLink}`, so they navigate without reloading the page.

### MUI components new in this level

| Component                              | What it is                                                                                                     | Where used                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `CardActionArea`                       | Makes a whole `Card` clickable, with a hover and ripple effect. Works as a link with `component={RouterLink}`. | `Home.jsx`                  |
| `CircularProgress` (`size={18}`)       | Small spinner                                                                                                  | "Thinking..." in `Chat.jsx` |
| `Paper variant="outlined"`             | A bordered panel without shadow                                                                                | The message area            |
| `TextField multiline maxRows`          | A text area that grows up to a maximum number of rows                                                          | The chat input              |
| `fullWidth`                            | Makes a component fill the available width                                                                     | The chat input              |
| `sx` with nested selectors (`"& pre"`) | Styles elements rendered inside the component                                                                  | Markdown styling            |

---

## Run and test

```bash
# Terminal 1
cd server
node --watch server.js

# Terminal 2
cd client
npm run dev
```

Open `http://localhost:5173` and check:

1. Log in. You land on **Welcome, ...** with two cards.
2. Click **AI Chat**, send "Explain what a JWT is in 2 sentences". You see "Thinking..." and then the reply.
3. Ask "Write a JavaScript function that adds two numbers" and check the formatted code block.
4. Refresh the page. The conversation is still there, because it was loaded from MongoDB.
5. Log in as another user in an incognito window. Their chat is empty, because conversations are separate.
6. Click **Clear chat** and confirm.
7. Click **MERN Demo** in the header to return to the home page, then open **Notes**.
8. In MongoDB Compass, open `mern_demo` -> `chats` and see one document per user with a `messages` array.

---

## Troubleshooting

| Problem                                                                 | Cause and fix                                                                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `OPENROUTER_API_KEY is missing`                                         | The variable is not in `server/.env`, or the server was not restarted after editing it.                            |
| 401 from OpenRouter (in the server log)                                 | The API key is wrong or revoked. Create a new one.                                                                 |
| 402                                                                     | The account balance is negative. Top up, even for free models.                                                     |
| 429 / "free AI limit reached"                                           | You hit the free limits. Wait, or buy credits to raise the daily limit.                                            |
| 404 / "No endpoints found"                                              | That free model no longer exists. Re-run the listing command and update `OPENROUTER_MODELS`.                       |
| Error about the "system" or "developer instruction" not being supported | Some free models reject the system role. Remove the system message from `routes/chat.js`, or choose another model. |
| Empty reply                                                             | Some models answer with hidden reasoning only. Try another model.                                                  |
| Slow replies                                                            | Free models can be busy. After 25 seconds the next model in your list is tried.                                    |
| Chat page shows 401                                                     | You are logged out, or `protect` is missing on `/api/chat` in `server.js`.                                         |
| "Too many messages"                                                     | Your own limiter (10 per minute). Raise `limit` while testing.                                                     |
| Markdown shows as plain text                                            | `react-markdown` is not installed, or you render `{m.content}` directly.                                           |
| After login you land on Notes, not Home                                 | `App.jsx` still has Notes at `/`. Check the routes in Step 11.                                                     |
| `user` is null error on Home                                            | The page is not wrapped in `ProtectedRoute`.                                                                       |
| Cannot connect to MongoDB (Atlas timeouts)                              | See the Level 3 README. Use local MongoDB with `MONGO_URI=mongodb://127.0.0.1:27017/mern_demo`.                    |

---

## Security checklist

- The key lives only in `server/.env`, which is git-ignored. If it ever leaks, delete it in OpenRouter and create a new one.
- Never put the key in React or in any `VITE_` variable.
- The server validates the message length and ignores any user id from the client. It uses `req.user` from the verified cookie.
- The rate limiter protects your free quota.
- OpenRouter error details stay in the server log. Users see a generic message.
- Do not paste secrets or private data into the chat.

---

## Concepts recap

| Concept            | One-line summary                                                         |
| ------------------ | ------------------------------------------------------------------------ |
| LLM API            | You send a list of messages, and get the next assistant message back     |
| Roles              | `system` sets behavior, `user` is the person, `assistant` is the AI      |
| No memory          | The model forgets everything, so you resend recent messages each time    |
| `:free` models     | Free to use, but with shared account-wide limits, and they can disappear |
| Fallback list      | Try several models in order so one failure does not break the chat       |
| Embedded documents | Messages stored inside the chat document in MongoDB                      |
| Rate limiting      | Caps requests per minute to protect your quota                           |
| Optimistic update  | Show the user's message immediately, then fix it when the server answers |
| `useRef`           | A handle to a DOM element or value that does not trigger a re-render     |
| Markdown rendering | Shows AI formatting (code, lists) properly                               |

---

## Commit and push

```bash
git status      # .env files and cookies.txt must NOT be listed
git add -A
git commit -m "Level 4: AI chat with OpenRouter free models and home page"
git push -u origin level-4
```

---

## Ideas for next steps

- **Streaming:** show the AI reply word by word as it is generated.
- **Multiple conversations:** a sidebar with several chats per user.
- **Syntax highlighting:** `react-syntax-highlighter` for code blocks.
- **Update and delete for notes:** full CRUD with the ownership check (`{ _id, user: req.user._id }`).
- **Deployment:** host the backend, frontend and database online.
