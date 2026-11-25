# Level 3: React Frontend (Signup, Login, Protected Notes Page)

In this level we build the **frontend** of the MERN project with React. It talks to the backend from Levels 1 and 2:

- Signup and login pages
- A protected Notes page that only logged-in users can open
- Automatic "am I already logged in?" check when the website loads, using the httpOnly cookie from Level 2

---

## What you will learn

- How to create a React app with **Vite**
- How to call your backend with **Axios** (with cookies)
- How to share login state across the app with **React Context**
- How to protect pages with a **ProtectedRoute**
- The difference between **`<Link>`**, **`<Navigate>`** and **`useNavigate()`**
- What the **Material UI (MUI)** components used in this project do
- How to show popup messages with **react-hot-toast**

---

## Tech stack

| Tool                              | Purpose                                                              |
| --------------------------------- | -------------------------------------------------------------------- |
| React                             | Builds the user interface from components                            |
| Vite                              | Dev server and build tool (replaces the deprecated Create React App) |
| React Router (`react-router-dom`) | Pages and navigation without reloading                               |
| Axios                             | Sends HTTP requests to the backend                                   |
| Material UI (MUI)                 | Ready-made styled components                                         |
| react-hot-toast                   | Popup success and error messages                                     |

---

## How the login check works

```
Visitor opens the website
        |
React calls GET /api/auth/me   (the browser attaches the httpOnly cookie)
        |
   200 -> user is logged in  -> show the Notes page
   401 -> not logged in      -> redirect to /login
```

React never sees or stores the token. The cookie is httpOnly, so JavaScript cannot read it. React only asks the server "is this cookie valid?".

---

## Project structure

```
mern-demo/
├── server/                        <- backend (Levels 1 and 2)
└── client/                        <- frontend (this level)
    ├── .env                       <- API address
    └── src/
        ├── api.js                 <- Axios setup
        ├── context/
        │   └── AuthContext.jsx    <- shared login state (user, login, logout)
        ├── components/
        │   ├── Header.jsx         <- top bar with logout button
        │   └── ProtectedRoute.jsx <- blocks pages when not logged in
        ├── pages/
        │   ├── Login.jsx
        │   ├── Signup.jsx
        │   └── Notes.jsx
        ├── App.jsx                <- list of routes
        └── main.jsx               <- entry point
```

---

## Step 1: Create the project

Start the backend first. Then, in a new terminal from the `mern-demo` folder:

```bash
git checkout -b level-3
npm create vite@latest client -- --template react
cd client
npm install
npm install axios react-router-dom react-hot-toast @mui/material @emotion/react @emotion/styled
```

If Vite asks about experimental options or "Install and start now?", choose **No**.

Create the folders and files:

```bash
mkdir src/components src/context src/pages
touch .env src/api.js src/context/AuthContext.jsx src/components/Header.jsx src/components/ProtectedRoute.jsx src/pages/Login.jsx src/pages/Signup.jsx src/pages/Notes.jsx
```

Delete `src/App.css` and `src/index.css`. We do not use them.

Package notes:

- `@emotion/react` and `@emotion/styled` are required by MUI for styling.
- `react-router-dom` gives you routing.

---

## Step 2: Environment variable (`client/.env`)

```
VITE_API_URL=http://localhost:5000/api
```

- Vite only exposes variables that start with `VITE_`.
- Read it with `import.meta.env.VITE_API_URL`.
- Anything starting with `VITE_` ends up in the browser, so never put secrets here.
- After editing `.env`, restart `npm run dev`.

---

## Step 3: Axios setup (`src/api.js`)

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export default api;
```

- `axios.create` makes a pre-configured instance, so every call starts with the backend address. You write `api.get("/notes")` instead of the full URL.
- **`withCredentials: true` is essential.** Without it, the browser will not send or save the cookie, and `/auth/me` will always return 401. It pairs with `credentials: true` in the server's CORS settings.

---

## Step 4: Auth context (`src/context/AuthContext.jsx`)

```jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signup = async (name, email, password) => {
    const res = await api.post("/auth/signup", { name, email, password });
    setUser(res.data.user);
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data.user);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Explanation

- **Context** shares data with any component without passing props through every level. Any component can call `useAuth()` to get `user`, `loading`, `signup`, `login` and `logout`.
- **`useState`** stores values that, when they change, re-render the screen.
  - `user` is `null` when nobody is logged in, or an object `{ id, name, email }`.
  - `loading` starts as **`true`** because, when the page opens, we do not know yet whether the visitor is logged in.
- **`useEffect(..., [])`** runs once when the app loads. It calls `/auth/me`:
  - Success: save the user.
  - Failure (401): `user` stays `null`.
  - `.finally`: set `loading` to `false`. Now we know.
- **Why `loading` matters:** without it, a logged-in user would see the login page flash on every refresh.
- A red 401 line in the browser console before login is normal. It is how we detect "not logged in".
- `children` is whatever is placed between `<AuthProvider>` and `</AuthProvider>`.

---

## Step 5: Protected route (`src/components/ProtectedRoute.jsx`)

```jsx
import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
```

### Explanation

It is a **wrapper component**. In `App.jsx` we use it like this:

```jsx
<ProtectedRoute>
  <Notes />
</ProtectedRoute>
```

Whatever is placed between the tags is passed in as the special prop **`children`**. Here `children` is `<Notes />`.

| Situation         | Result                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| `loading` is true | Shows a spinner (the server has not answered yet)                                                 |
| No `user`         | Redirects to `/login`. `Notes` is never rendered, so it does not call the API or flash on screen. |
| `user` exists     | Returns `children`, so `Notes` appears                                                            |

Think of it as a guard at a door: the visitor reaches the room (`Notes`) only if the guard (`ProtectedRoute`) lets them in.

`loading` and `user` are not created here. They are created in `AuthContext.jsx` and read through `useAuth()`.

**Important:** this protects the _screen_, not the _data_. Real protection is the `protect` middleware on the backend, which checks the cookie on every request. The frontend guard is only for good user experience.

---

## Step 6: Header (`src/components/Header.jsx`)

```jsx
import { useNavigate } from "react-router-dom";
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
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          MERN Demo
        </Typography>
        {user && (
          <>
            <Typography sx={{ mr: 2 }}>{user.name || user.email}</Typography>
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

- The logout button only shows when a `user` exists (`{user && (...)}`).
- `handleLogout` waits for the server to clear the cookie, shows a message, then moves to `/login` with `navigate`.

---

## Step 7: Login page (`src/pages/Login.jsx`)

```jsx
import { useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { Box, Button, Link, Paper, TextField, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8, px: 2 }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 4, width: "100%", maxWidth: 400, display: "grid", gap: 2 }}
      >
        <Typography variant="h5">Login</Typography>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </Button>
        <Typography variant="body2">
          No account?{" "}
          <Link component={RouterLink} to="/signup">
            Sign up
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
```

### Explanation

- **Controlled inputs:** each field's value lives in state. `onChange` updates the state, and the field always shows the state value.
- **`e.preventDefault()`** stops the browser's default form submit, which would reload the page.
- **`submitting`** disables the button during the request, so the form cannot be sent twice.
- **`err.response?.data?.error`:** Axios puts the server's JSON error in `err.response.data`. Your backend sends `{ error: "..." }`, so users see messages like "Invalid email or password". The `?.` prevents a crash if there is no response (for example when the server is down).
- **`try / catch / finally`:** `finally` runs in both success and failure, so the button always becomes clickable again.
- The `if (user) return <Navigate ... />` line comes after all hooks. Hooks must always run in the same order, so never place a hook after an early `return`.

---

## Step 8: Signup page (`src/pages/Signup.jsx`)

```jsx
import { useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { Box, Button, Link, Paper, TextField, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signup(name, email, password);
      toast.success("Account created!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8, px: 2 }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 4, width: "100%", maxWidth: 400, display: "grid", gap: 2 }}
      >
        <Typography variant="h5">Sign up</Typography>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password (min 8 characters)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          slotProps={{ htmlInput: { minLength: 8 } }}
        />
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? "Creating..." : "Create account"}
        </Button>
        <Typography variant="body2">
          Already registered?{" "}
          <Link component={RouterLink} to="/login">
            Login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
```

Same structure as Login, with an extra `name` field. `slotProps={{ htmlInput: { minLength: 8 } }}` passes the native `minLength` attribute to the real `<input>`. In older MUI versions this was written `inputProps={{ minLength: 8 }}`.

---

## Step 9: Notes page (`src/pages/Notes.jsx`)

```jsx
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import api from "../api";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    api
      .get("/notes")
      .then((res) => setNotes(res.data))
      .catch(() => toast.error("Could not load notes"));
  }, []);

  const addNote = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/notes", { title, content });
      setNotes((prev) => [res.data, ...prev]);
      setTitle("");
      setContent("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not save note");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        My notes
      </Typography>

      <Box
        component="form"
        onSubmit={addNote}
        sx={{ display: "grid", gap: 2, mb: 4 }}
      >
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <TextField
          label="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          multiline
          rows={3}
        />
        <Button type="submit" variant="contained">
          Add note
        </Button>
      </Box>

      {notes.length === 0 && <Typography>No notes yet.</Typography>}

      {notes.map((note) => (
        <Card key={note._id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{note.title}</Typography>
            <Typography color="text.secondary">{note.content}</Typography>
          </CardContent>
        </Card>
      ))}
    </Container>
  );
}
```

### Explanation

- `useEffect(..., [])` loads notes once, when the page opens.
- `setNotes((prev) => [res.data, ...prev])` adds the new note at the top without reloading the list. Using the `prev` form is safer than reading `notes` directly.
- `key={note._id}` lets React track each list item. MongoDB's `_id` is unique, so it is ideal.
- Notes are not linked to users yet, so every user sees the same notes. This is fixed in a later level.

---

## Step 10: Routes (`src/App.jsx`)

```jsx
import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Notes from "./pages/Notes";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Notes />
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

- `<Routes>` shows the first `<Route>` whose `path` matches the URL.
- `path="*"` matches anything else, and sends the visitor home.
- `<>...</>` is a fragment: a wrapper that adds no extra element to the page.
- `Header` is outside `<Routes>`, so it appears on every page.

---

## Step 11: Entry point (`src/main.jsx`)

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CssBaseline } from "@mui/material";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CssBaseline />
        <App />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

The order matters:

- `BrowserRouter` is outside, so routing works everywhere.
- `AuthProvider` is inside it, so every component can call `useAuth()`.
- `Toaster` renders the popup messages.
- `StrictMode` helps catch bugs in development. In dev it runs some effects twice, so you may see two `/auth/me` calls. That is normal and does not happen in production.

---

## Link vs Navigate vs useNavigate

All three move the user to another page. The difference is **when and how** the move happens.

| Tool            | Type      | Use it when                                             |
| --------------- | --------- | ------------------------------------------------------- |
| `<Link>`        | Component | The **user clicks** something to go somewhere           |
| `<Navigate>`    | Component | You want to **redirect automatically while rendering**  |
| `useNavigate()` | Hook      | You want to move **from code**, after something happens |

### 1. `<Link>`: a clickable link

Replaces `<a href>`. It changes the URL **without reloading the page**, so React state (like the logged-in user) is kept.

```jsx
<Link to="/signup">Sign up</Link>
```

With MUI, `<Link component={RouterLink} to="/signup">` uses MUI's styling and React Router's navigation. `RouterLink` is React Router's `Link` imported under another name, to avoid a clash with MUI's `Link`.

### 2. `<Navigate>`: redirect during render

As soon as this component appears, the user is sent elsewhere. No click needed.

```jsx
if (!user) return <Navigate to="/login" replace />;
```

`replace` swaps the current history entry instead of adding a new one. Without it, pressing Back would return to the protected page, which would redirect again, and the user gets stuck in a loop.

### 3. `useNavigate()`: move from code

Returns a function you call when something finishes, such as an API call.

```jsx
const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  await login(email, password);
  navigate("/");
};
```

Call `navigate(...)` inside event handlers, async functions or `useEffect`, not directly in the render body (that is what `<Navigate>` is for).

```jsx
navigate("/login", { replace: true }); // replace the history entry
navigate(-1); // go back one page
```

### How to choose

```
Is the user clicking a link?               -> <Link>
Redirect based on state while rendering?   -> <Navigate>
Redirect after an action (API call, etc.)? -> useNavigate()
```

### Where each one is used in this project

| File                      | Tool                          | Why                                   |
| ------------------------- | ----------------------------- | ------------------------------------- |
| `Login.jsx`               | `<Link>` to `/signup`         | The user clicks "Sign up"             |
| `Login.jsx`, `Signup.jsx` | `<Navigate>` if `user` exists | Already logged in, so skip the page   |
| `Login.jsx`, `Signup.jsx` | `navigate("/")`               | After a successful login or signup    |
| `ProtectedRoute.jsx`      | `<Navigate to="/login">`      | Not logged in                         |
| `Header.jsx`              | `navigate("/login")`          | After the logout request finishes     |
| `App.jsx`                 | `<Navigate to="/">`           | Unknown URL, so send the visitor home |

Avoid plain `<a href="/signup">` for internal pages. It reloads the whole page, which loses React state and repeats the `/auth/me` call.

---

## Material UI (MUI) components used

MUI is a library of ready-made, styled React components. Everything is imported from `@mui/material`.

| Component          | What it is                                                                                                                                                         | Where we use it             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| `CssBaseline`      | Resets browser default styles (like the default body margin) and applies consistent base styling. Place it once at the top.                                        | `main.jsx`                  |
| `Box`              | A generic wrapper, like a `<div>` that understands the `sx` prop. Used for layout (centering, spacing, grids).                                                     | Page layouts, forms         |
| `Container`        | Centers content horizontally and limits its maximum width (`maxWidth="sm"` is small).                                                                              | `Notes.jsx`                 |
| `Paper`            | A raised white surface (a card-like panel with a shadow). With `component="form"` it renders as a real `<form>`.                                                   | Login and Signup panels     |
| `Typography`       | Text with consistent styles. `variant` picks the style (`h5`, `h6`, `body2`...). Replaces `<h1>`, `<p>`, etc.                                                      | Titles and text everywhere  |
| `TextField`        | A complete input with a floating label, validation styles and helper text. `type` sets the kind (`email`, `password`). `multiline` and `rows` make it a text area. | Forms                       |
| `Button`           | A styled button. `variant="contained"` is the filled style. `disabled` greys it out. `color="inherit"` takes the parent's color.                                   | Forms, Header               |
| `Link`             | A styled text link. With `component={RouterLink}` it navigates with React Router.                                                                                  | "Sign up" and "Login" links |
| `AppBar`           | The top navigation bar. `position="static"` keeps it in the normal page flow.                                                                                      | `Header.jsx`                |
| `Toolbar`          | Lays out the content inside an `AppBar` with correct height and spacing.                                                                                           | `Header.jsx`                |
| `Card`             | A bordered, shadowed container for one item.                                                                                                                       | One note                    |
| `CardContent`      | Adds the right padding inside a `Card`.                                                                                                                            | One note                    |
| `CircularProgress` | A spinning loading indicator.                                                                                                                                      | `ProtectedRoute.jsx`        |

### MUI props you will see

| Prop                     | Meaning                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sx`                     | Inline styling with theme shortcuts. `mt: 8` means margin-top of 8 x 8px = 64px. `p: 4` is padding of 32px. `display: "grid"` and `gap: 2` space items out. |
| `variant`                | The visual style of a component (`contained` for buttons, `h5` for text).                                                                                   |
| `component`              | Changes which HTML element or component is rendered (`component="form"`, `component={RouterLink}`).                                                         |
| `maxWidth`               | The largest width a `Container` may reach (`xs`, `sm`, `md`...).                                                                                            |
| `color="text.secondary"` | A theme color name, here a softer grey text.                                                                                                                |
| `gutterBottom`           | Adds a small space below the text.                                                                                                                          |
| `slotProps`              | Passes props to inner parts of a component (like the real `<input>`).                                                                                       |

### Other libraries used

| Item                                         | What it does                                         |
| -------------------------------------------- | ---------------------------------------------------- |
| `toast.success("...")`, `toast.error("...")` | Shows a popup message                                |
| `<Toaster />`                                | The container that displays the popups. Add it once. |
| `axios.create(...)`                          | A reusable HTTP client with the base URL set         |

---

## Step 12: Run and test

Two terminals:

```bash
# Terminal 1: backend
cd server
node --watch server.js

# Terminal 2: frontend
cd client
npm run dev
```

Open `http://localhost:5173` and check:

1. You are redirected to `/login` (no cookie yet).
2. Sign up, and you land on the Notes page.
3. Add a note and see it appear.
4. **Refresh the page.** You stay logged in. This proves the cookie check works.
5. Press `F12`, go to **Application**, then **Cookies**, and see `token` marked **HttpOnly**. Typing `document.cookie` in the console will not show it.
6. Click Logout, and you are sent to `/login`. Opening `/` now redirects back to login.

Keep `CLIENT_URL=http://localhost:5173` in `server/.env`, because the server's CORS setting needs it.

---

## Troubleshooting

| Problem                                                         | Cause and fix                                                                                                              |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| CORS error in the console                                       | `CLIENT_URL` in the server `.env` does not exactly match `http://localhost:5173`. Restart the server after editing `.env`. |
| Login works but a refresh logs you out                          | Axios is missing `withCredentials: true`, or the server's CORS lacks `credentials: true`.                                  |
| `Network Error`                                                 | The backend is not running, or `VITE_API_URL` is wrong. Restart `npm run dev` after editing `.env`.                        |
| `import.meta.env.VITE_API_URL` is undefined                     | The variable must start with `VITE_`, and `.env` must be inside `client/`.                                                 |
| Blank page                                                      | Open the console. Usually a typo in an import path or a missing file.                                                      |
| `Cannot destructure property 'user' of useAuth() as it is null` | `<AuthProvider>` is missing in `main.jsx`, or the component is outside it.                                                 |
| Red 401 on `/auth/me` before login                              | Expected. It is how we detect "not logged in".                                                                             |
| `/auth/me` called twice in development                          | Caused by `StrictMode`. It does not happen in production.                                                                  |

### MongoDB connection problems (backend)

If the backend prints `connect ETIMEDOUT` or `Server selection timed out` with Atlas:

- Make sure Atlas Network Access has `0.0.0.0/0` (Active) and the cluster is not paused.
- Test the three shard hosts with `Test-NetConnection <host> -Port 27017`. If one is unreachable, Atlas may be unusable from your network.
- Use **local MongoDB** instead. Install MongoDB Community Server, check `Get-Service MongoDB`, and set:

```
MONGO_URI=mongodb://127.0.0.1:27017/mern_demo
```

Restart the backend after editing `.env`. Look at your data with MongoDB Compass at `mongodb://127.0.0.1:27017`.

---

## Commit and push

Make sure `origin` points to your own repository (`git remote -v`):

```bash
git status      # .env files and node_modules must NOT be listed
git add .
git commit -m "Level 3: React frontend with login, signup and protected notes page"
git push -u origin level-3
```

Never paste `.env` contents (secrets, passwords) into chats or commits.

---

## Concepts recap

| Concept           | One-line summary                                                  |
| ----------------- | ----------------------------------------------------------------- |
| Vite              | Fast dev server and build tool for React                          |
| Component         | A function that returns UI                                        |
| `useState`        | Remembers a value and re-renders when it changes                  |
| `useEffect`       | Runs code at a certain moment (here: when the page loads)         |
| Context           | Shares data with every component without passing props            |
| `children`        | Whatever is placed between a component's opening and closing tags |
| ProtectedRoute    | A wrapper that shows its content only to logged-in users          |
| `withCredentials` | Lets the browser send and store cookies on cross-origin requests  |
| httpOnly cookie   | A cookie JavaScript cannot read, so the token is safe from XSS    |

---

## Next steps

- Link notes to the logged-in user, so each person sees only their own notes
- Add update and delete for notes (full CRUD)
- **Level 4:** add the AI chat feature. A backend `/api/chat` endpoint calls an AI API (key kept in `.env`), saves each user's conversation in MongoDB, and a React chat page shows the messages.
