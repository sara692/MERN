# Level 5: Soft Floral Design (Theme, Backgrounds, Colorful Notes and Chat)

In this level we make the app **beautiful and comfortable to look at**. Only the frontend changes. We add:

- One **color system** (a MUI theme) for the whole app
- **Flower and leaf backgrounds** drawn in code (SVG)
- A shared **login/signup layout** with a round image badge
- A pretty **home page** with colored cards
- A **notes page** with a banner image and a **different pastel color for each note**
- **Colored chat bubbles** (one color for you, one for the AI)
- Friendly fonts and matching popup messages

The goal is a design that is soft, clean, readable and not tiring for the eyes: natural pastel colors, no dark colors.

<img width="1909" height="910" alt="image" src="https://github.com/user-attachments/assets/3a06e8d8-8b34-4763-a252-9fe881bb01bc" />

---

## What you will learn

- How to build a **MUI theme** (`createTheme`, `ThemeProvider`) so you set colors once and every component follows
- How to override the default look of MUI components (buttons, inputs, app bar)
- How to use **Google Fonts locally** with `@fontsource`
- How to draw **SVG shapes** as React components (flowers, leaves)
- How to make a **fixed background layer** behind the page
- How to create a **reusable layout component** with `children`
- How to give each item a **stable color** from its id
- How to build **responsive layouts** with CSS Grid and the `sx` prop
- How to import **images** in Vite
- How to read a blank page error in the browser Console

---

## The color plan

Colors look matched when you follow a few rules:

1. **Few colors:** one cream base, six pastels, one green and one rose accent.
2. **One text color on everything.** All pastels are light, so the same soft dark-green text is readable on each of them.
3. **Pastels for surfaces, strong colors for actions.** Notes, cards and bubbles are pastel. Buttons and links use the leaf green.

| Role        | Color                                     | Hex                                                         | Used for                                     |
| ----------- | ----------------------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| Base        | Cream                                     | `#FFF8F3`                                                   | Page background                              |
| Primary     | Leaf green                                | `#4F7F5E`                                                   | Buttons, links, focus (white text on it)     |
| Secondary   | Rose                                      | `#B5546F`                                                   | Hover and highlights                         |
| Text        | Soft moss                                 | `#4A5545`                                                   | All main text                                |
| Text (soft) | Sage grey                                 | `#65715F`                                                   | Subtitles and hints (only on cream or white) |
| Pastels     | Blush, peach, butter, mint, lavender, sky | `#FADADD` `#FFE5D0` `#FFF3C4` `#DDF1E0` `#E8E0F5` `#DCEEF7` | Notes, cards, bubbles                        |

The text is a soft green-brown instead of black, so nothing looks harsh, and it still contrasts well with every pastel.

Each area has its own mood, built from the same palette:

| Page                | Gradient name | Colors                   |
| ------------------- | ------------- | ------------------------ |
| Login, Signup, Home | `blush`       | pink -> peach -> mint    |
| Notes               | `meadow`      | mint -> butter -> blush  |
| Chat                | `lavender`    | lavender -> sky -> blush |

---

## Files changed or added

```
client/
└── src/
    ├── assets/
    │   ├── cats.png               <- NEW: your cats image
    │   └── notes-banner.png       <- NEW: your "notes" lettering image
    ├── components/
    │   ├── AuthLayout.jsx         <- NEW: shared frame for login and signup
    │   ├── PageBackground.jsx     <- NEW: gradient + flowers and leaves
    │   └── Header.jsx             <- updated: handwritten title
    ├── pages/
    │   ├── Login.jsx              <- updated: uses AuthLayout
    │   ├── Signup.jsx             <- updated: uses AuthLayout
    │   ├── Home.jsx               <- updated: background, image, colored cards
    │   ├── Notes.jsx              <- updated: banner, two columns, colored notes
    │   └── Chat.jsx               <- updated: background, colored bubbles
    ├── theme.js                   <- NEW: colors, fonts, component styles
    └── main.jsx                   <- updated: ThemeProvider and fonts
```

---

## Step 1: Branch, fonts and images

```bash
git checkout -b level-5-design
cd client
npm install @fontsource/nunito @fontsource/dancing-script
```

- **Nunito** is a rounded, friendly font for normal text.
- **Dancing Script** is a handwritten font, used only for big titles.
- `@fontsource` installs the fonts as npm packages, so they work offline and no request goes to Google.

Save your two pictures into `client/src/assets/`:

```
client/src/assets/cats.png
client/src/assets/notes-banner.png
```

Tips:

- If your files use another extension (`.jpg`, `.webp`), use that extension in the imports.
- On Windows, hidden extensions can create names like `cats.png.png`. In Git Bash, `ls src/assets` shows the real names.
- Keep each image under about 300 KB so pages load fast. Compress at squoosh.app if needed.
- Only use images you have the right to use if you publish the project.

Create the new files:

```bash
touch src/theme.js src/components/PageBackground.jsx src/components/AuthLayout.jsx
```

---

## Step 2: The theme (`src/theme.js`)

The theme is the single place where colors, fonts and component styles live.

```js
import { createTheme } from "@mui/material/styles";

// Soft pastels for notes, chat bubbles and cards
export const noteColors = [
  "#FADADD", // blush
  "#FFE5D0", // peach
  "#FFF3C4", // butter
  "#DDF1E0", // mint
  "#E8E0F5", // lavender
  "#DCEEF7", // sky
];

// The same id always gives the same color, so colors don't change on refresh
export const colorForId = (id = "") =>
  noteColors[
    [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % noteColors.length
  ];

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4F7F5E", contrastText: "#FFFFFF" },
    secondary: { main: "#B5546F", contrastText: "#FFFFFF" },
    background: { default: "#FFF8F3", paper: "#FFFFFF" },
    text: { primary: "#4A5545", secondary: "#65715F" },
    divider: "#F0DCD8",
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Nunito", "Segoe UI", sans-serif',
    h3: { fontFamily: '"Dancing Script", cursive', fontWeight: 700 },
    h4: { fontFamily: '"Dancing Script", cursive', fontWeight: 700 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 800 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiAppBar: {
      defaultProps: { color: "transparent", elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(90deg, #F9D5DC 0%, #FFE5D0 50%, #DDF1E0 100%)",
          color: "#4A5545",
          borderBottom: "1px solid #F0DCD8",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, padding: "8px 22px" },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 12px rgba(79,127,94,0.3)" },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#C9B1AE" },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#B5546F",
          },
        },
      },
    },
  },
});

export default theme;
```

### Explanation

- **`createTheme`** builds a theme object. MUI components read their colors, fonts and radius from it, so you do not color every component by hand.
- **`palette`** defines the colors:
  - `primary` is used by `<Button variant="contained">`, links and focus outlines.
  - `secondary` is the rose accent.
  - `background.default` is the page color. `paper` is the color of `Paper` and `Card`.
  - `text.primary` and `text.secondary` are the two text colors.
  - `contrastText` is the text color placed on top of that color (white on green).
- **`shape.borderRadius: 16`** is the base roundness. In `sx`, a number like `borderRadius: 2` means 2 x 16 = 32px, while a string like `"20px"` is exact.
- **`typography`** sets the font. Headings `h3` and `h4` use the handwritten font, and `textTransform: "none"` stops buttons from shouting in capitals.
- **`components`** overrides how specific MUI components look everywhere:
  - `defaultProps` changes the default props (the AppBar is `transparent`, so our gradient shows instead of MUI's default fill).
  - `styleOverrides.root` changes the root element's CSS.
- **`noteColors`** and **`colorForId`**: the function adds up the character codes of the id and uses the remainder to pick a color. The same id always gives the same color, so a note keeps its color after refresh, unlike a color based on list position, which would change when a new note is added at the top.

---

## Step 3: Apply the theme (`src/main.jsx`)

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CssBaseline, ThemeProvider } from "@mui/material";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@fontsource/dancing-script/700.css";
import App from "./App.jsx";
import theme from "./theme.js";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#FFFFFF",
                color: "#4A5545",
                border: "1px solid #F0DCD8",
                borderRadius: "14px",
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
```

- **`ThemeProvider`** makes the theme available to every MUI component below it, so it must wrap the whole app.
- **`CssBaseline`** applies the theme's background and text color to the page. It sits inside `ThemeProvider`, so it uses the theme.
- The `@fontsource` imports load only the font weights we use (400, 600, 700, 800 for Nunito, and 700 for Dancing Script). Every weight you import adds to the download size.
- `toastOptions.style` gives the popup messages the same soft look.

If your project still has leftover Vite template styles (`index.css`, `App.css`) that set a body or `#root` background, delete them. They can cover the flower background.

---

## Step 4: Flower background (`src/components/PageBackground.jsx`)

The flowers and leaves are drawn as **SVG in code**, so they need no image files, stay sharp at any size, and use your palette.

```jsx
import { Box } from "@mui/material";

const gradients = {
  blush: "linear-gradient(160deg, #FDE7EA 0%, #FFF3EA 50%, #E9F5EA 100%)",
  meadow: "linear-gradient(160deg, #EAF6EC 0%, #FFF8E6 55%, #FDEBEE 100%)",
  lavender: "linear-gradient(160deg, #EFE9FA 0%, #EAF4FA 55%, #FDEBEE 100%)",
};

function Flower({ size = 120, petal = "#F9C6D0", center = "#FFE08A", sx }) {
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <Box
      component="svg"
      viewBox="0 0 100 100"
      aria-hidden="true"
      sx={{ position: "absolute", width: size, height: size, ...sx }}
    >
      {angles.map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="26"
          rx="13"
          ry="22"
          fill={petal}
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="11" fill={center} />
    </Box>
  );
}

function Leaf({ size = 120, color = "#CFE8D3", sx }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 100 100"
      aria-hidden="true"
      sx={{ position: "absolute", width: size, height: size, ...sx }}
    >
      <path d="M50 95 C10 70 10 25 50 5 C90 25 90 70 50 95 Z" fill={color} />
      <path
        d="M50 90 L50 15"
        stroke="#FFFFFF"
        strokeWidth="2"
        opacity="0.7"
        fill="none"
      />
    </Box>
  );
}

export default function PageBackground({ variant = "blush" }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        pointerEvents: "none",
        background: gradients[variant],
      }}
    >
      {/* top left */}
      <Flower
        size={170}
        petal="#F9C6D0"
        sx={{ top: -40, left: -40, opacity: 0.8 }}
      />
      <Flower
        size={100}
        petal="#E3D7F5"
        sx={{ top: 130, left: 80, opacity: 0.7 }}
      />
      <Leaf
        size={140}
        sx={{ top: 40, left: 130, transform: "rotate(40deg)", opacity: 0.8 }}
      />

      {/* bottom right */}
      <Flower
        size={210}
        petal="#FFD9BF"
        sx={{ bottom: -70, right: -50, opacity: 0.8 }}
      />
      <Flower
        size={120}
        petal="#F9C6D0"
        sx={{ bottom: 110, right: 130, opacity: 0.7 }}
      />
      <Leaf
        size={150}
        sx={{
          bottom: 30,
          right: 20,
          transform: "rotate(-30deg)",
          opacity: 0.8,
        }}
      />

      {/* sides */}
      <Flower
        size={90}
        petal="#CFE8F3"
        sx={{ top: "45%", right: -20, opacity: 0.7 }}
      />
      <Leaf
        size={120}
        color="#DDEFD5"
        sx={{ bottom: 60, left: -20, transform: "rotate(25deg)", opacity: 0.8 }}
      />
    </Box>
  );
}
```

### Explanation

- **The background layer:**
  - `position: "fixed"` with `inset: 0` makes a layer that covers the whole screen and stays in place while the page scrolls.
  - `zIndex: -1` puts it behind all content.
  - `pointerEvents: "none"` lets clicks pass through it.
  - `overflow: "hidden"` hides the parts of flowers that extend past the screen edge (negative `top`, `left`, and so on), which makes them look like they grow from the corners.
- **`gradients`** is an object, and `gradients[variant]` picks one by name. Each page chooses a `variant`.
- **`Flower`:**
  - SVG `viewBox="0 0 100 100"` creates a 100x100 drawing space that scales to any `size`.
  - Each petal is an `<ellipse>` placed above the center (`cy="26"`), then rotated around the center point (50, 50) by a different angle. The `angles` array with `.map()` repeats it 6 times, so you write the petal once.
  - A `<circle>` in the middle is the flower's heart.
- **`Leaf`:** one curved `<path>` (the `C` commands are Bezier curves) plus a white line for the vein.
- **`component="svg"`** makes MUI's `Box` render an `<svg>` element while still accepting the `sx` prop.
- **`aria-hidden="true"`** tells screen readers to ignore decorations.
- **`...sx`** merges the position and opacity passed in by each use.
- **Customizing:** to move a decoration, change `top`/`left`/`bottom`/`right`. To recolor, change `petal` or `color`. To resize, change `size`. To add or remove flowers, copy or delete a `<Flower />` or `<Leaf />` line.

---

## Step 5: Shared layout for login and signup (`src/components/AuthLayout.jsx`)

Login and Signup need the same frame, so we write it once and reuse it.

```jsx
import { Box, Paper, Typography } from "@mui/material";
import PageBackground from "./PageBackground";
import catsImg from "../assets/cats.png";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <>
      <PageBackground variant="blush" />
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 420,
            p: { xs: 3, sm: 4 },
            borderRadius: "28px",
            bgcolor: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(6px)",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 16px 40px rgba(181,84,111,0.16)",
          }}
        >
          <Box
            component="img"
            src={catsImg}
            alt=""
            sx={{
              display: "block",
              mx: "auto",
              mb: 1,
              width: 140,
              height: 140,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <Typography variant="h4" align="center">
            {title}
          </Typography>
          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
          {children}
        </Paper>
      </Box>
    </>
  );
}
```

### Explanation

- **Props:** `title` and `subtitle` are text, and **`children`** is whatever the page places between `<AuthLayout>` and `</AuthLayout>` (the form).
- **`import catsImg from "../assets/cats.png"`:** Vite processes the file and gives you its URL. If the path or extension is wrong, you get `Failed to resolve import`.
- **`minHeight: "calc(100vh - 64px)"`** fills the screen below the 64px header, and flexbox centers the card both ways.
- **Frosted glass card:** `rgba(255,255,255,0.88)` is white at 88% opacity. `backdropFilter: "blur(6px)"` blurs what is behind it. Together the flowers glow softly behind the card while the form stays readable.
- **Round image:** `borderRadius: "50%"` makes a circle, and `objectFit: "cover"` crops the picture to fill it without stretching. `alt=""` marks a decorative image.
- **`p: { xs: 3, sm: 4 }`** is responsive padding: smaller on phones, larger from 600px.

### Using it in `Login.jsx`

Keep all the logic. The imports and the returned JSX change:

```jsx
import { useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { Box, Button, Link, TextField, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
```

```jsx
return (
  <AuthLayout
    title="Welcome back"
    subtitle="Log in to your little garden of notes"
  >
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "grid", gap: 2 }}
    >
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
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={submitting}
      >
        {submitting ? "Logging in..." : "Login"}
      </Button>
      <Typography variant="body2" align="center">
        No account?{" "}
        <Link component={RouterLink} to="/signup">
          Sign up
        </Link>
      </Typography>
    </Box>
  </AuthLayout>
);
```

### Using it in `Signup.jsx`

```jsx
import { useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { Box, Button, Link, TextField, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
```

```jsx
return (
  <AuthLayout title="Join us" subtitle="Create an account and start blooming">
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "grid", gap: 2 }}
    >
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
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={submitting}
      >
        {submitting ? "Creating..." : "Create account"}
      </Button>
      <Typography variant="body2" align="center">
        Already registered?{" "}
        <Link component={RouterLink} to="/login">
          Login
        </Link>
      </Typography>
    </Box>
  </AuthLayout>
);
```

`Paper` is no longer imported in these two files, because `AuthLayout` provides the card.

**Important:** every component you use in JSX must be imported. If `AuthLayout` is missing from the imports, React throws `ReferenceError: AuthLayout is not defined` and the page goes **blank**. See "Blank page" in the troubleshooting section.

---

## Step 6: Header title (`src/components/Header.jsx`)

The theme already colors the bar, so only the title changes:

```jsx
<Typography
  component={RouterLink}
  to="/"
  sx={{
    flexGrow: 1,
    color: "inherit",
    textDecoration: "none",
    fontFamily: '"Dancing Script", cursive',
    fontWeight: 700,
    fontSize: 30,
  }}
>
  🌷 MERN Demo
</Typography>
```

The Notes, Chat and Logout buttons use `color="inherit"`, so they take the soft moss text color from the app bar.

---

## Step 7: Home page (`src/pages/Home.jsx`)

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
import PageBackground from "../components/PageBackground";
import catsImg from "../assets/cats.png";

const options = [
  {
    title: "Notes",
    emoji: "📝",
    description: "Write down your thoughts and keep them in colorful cards.",
    to: "/notes",
    color: "#FADADD",
  },
  {
    title: "AI Chat",
    emoji: "💬",
    description: "Ask questions and chat with your AI assistant.",
    to: "/chat",
    color: "#DDF1E0",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <PageBackground variant="blush" />
      <Container maxWidth="md" sx={{ py: 6, textAlign: "center" }}>
        <Box
          component="img"
          src={catsImg}
          alt="Friendly cats saying hi"
          sx={{
            width: { xs: 150, sm: 190 },
            height: { xs: 150, sm: 190 },
            borderRadius: "50%",
            objectFit: "cover",
            boxShadow: "0 12px 30px rgba(181,84,111,0.2)",
          }}
        />
        <Typography variant="h3" sx={{ mt: 2 }}>
          Hi, {user.name || user.email}!
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 5 }}>
          What would you like to do today?
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            textAlign: "left",
          }}
        >
          {options.map((option) => (
            <Card
              key={option.to}
              elevation={0}
              sx={{
                bgcolor: option.color,
                borderRadius: "24px",
                boxShadow: "0 8px 24px rgba(74,85,69,0.12)",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 14px 30px rgba(74,85,69,0.18)",
                },
              }}
            >
              <CardActionArea
                component={RouterLink}
                to={option.to}
                sx={{ p: 2 }}
              >
                <CardContent>
                  <Typography sx={{ fontSize: 42, lineHeight: 1 }}>
                    {option.emoji}
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }} gutterBottom>
                    {option.title}
                  </Typography>
                  <Typography color="text.primary">
                    {option.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Container>
    </>
  );
}
```

### Explanation

- Each option has its own pastel `color`, applied with `bgcolor`. To add a feature card later, add one object to `options`.
- **Responsive size:** `width: { xs: 150, sm: 190 }` means 150px on phones and 190px from the `sm` breakpoint (600px).
- **Hover effect:** `"&:hover"` inside `sx` styles the hover state. `transition` animates the lift smoothly.
- **Readability:** on the pastel cards the description uses `text.primary` (the stronger text color). The softer `text.secondary` is only tuned for cream and white backgrounds.
- `user` is never `null` here, because the page is inside `ProtectedRoute`.

---

## Step 8: Notes page (`src/pages/Notes.jsx`)

Two columns on a computer, stacked on a phone. The left column holds your banner image and the "new note" form. The right column holds the colorful notes. The logic (loading, adding) is the same as before.

```jsx
import { useEffect, useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import toast from "react-hot-toast";
import api from "../api";
import PageBackground from "../components/PageBackground";
import { colorForId } from "../theme";
import notesImg from "../assets/notes-banner.png";

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
    <>
      <PageBackground variant="meadow" />
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: 2,
          py: 4,
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
          alignItems: "start",
        }}
      >
        {/* Left: banner image and the new-note form */}
        <Box
          sx={{
            display: "grid",
            gap: 2,
            position: { md: "sticky" },
            top: { md: 24 },
          }}
        >
          <Box
            component="img"
            src={notesImg}
            alt="Notes"
            sx={{
              width: "100%",
              borderRadius: "24px",
              boxShadow: "0 8px 24px rgba(181,84,111,0.18)",
            }}
          />
          <Paper
            component="form"
            onSubmit={addNote}
            elevation={0}
            sx={{
              p: 2.5,
              display: "grid",
              gap: 2,
              borderRadius: "20px",
              bgcolor: "rgba(255,255,255,0.88)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="h6">New note</Typography>
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
              rows={4}
            />
            <Button type="submit" variant="contained">
              Add note
            </Button>
          </Paper>
        </Box>

        {/* Right: the colorful notes */}
        <Box>
          <Typography variant="h4" sx={{ mb: 2 }}>
            My notes
          </Typography>

          {notes.length === 0 && (
            <Typography color="text.secondary">
              No notes yet. Write your first one!
            </Typography>
          )}

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            }}
          >
            {notes.map((note) => (
              <Paper
                key={note._id}
                elevation={0}
                sx={{
                  p: 2.5,
                  bgcolor: colorForId(note._id),
                  borderRadius: "20px",
                  boxShadow: "0 4px 14px rgba(74,85,69,0.10)",
                  transition: "transform 0.15s",
                  "&:hover": { transform: "translateY(-3px)" },
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ wordBreak: "break-word" }}
                >
                  {note.title}
                </Typography>
                <Typography
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {note.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 1.5 }}
                >
                  {new Date(note.createdAt).toLocaleDateString()}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
}
```

### Explanation

- **Two-column layout:** `gridTemplateColumns: { xs: "1fr", md: "320px 1fr" }` gives one column on phones, and from the `md` breakpoint (900px) a fixed 320px column on the left plus a flexible one on the right.
- **Sticky left column:** `position: { md: "sticky" }` with `top: { md: 24 }` keeps the form visible while you scroll a long list of notes (computers only).
- **Automatic card grid:** `repeat(auto-fill, minmax(220px, 1fr))` creates as many columns of at least 220px as fit, with no breakpoints needed.
- **Colors:** `bgcolor: colorForId(note._id)` gives every note its own stable pastel.
- **Long text:** `wordBreak: "break-word"` stops long words from overflowing the card. `whiteSpace: "pre-wrap"` keeps the line breaks you typed.
- **Date:** `new Date(note.createdAt).toLocaleDateString()` shows the creation date in the browser's format. `createdAt` exists because the Note schema uses `timestamps: true`.

---

## Step 9: Chat colors (`src/pages/Chat.jsx`)

Make three edits to your existing Chat page.

**1. Import the background:**

```jsx
import PageBackground from "../components/PageBackground";
```

Wrap the whole `return` in a fragment with the background first:

```jsx
return (
  <>
    <PageBackground variant="lavender" />
    <Container maxWidth="md" sx={{ mt: 3 }}>
      {/* everything that was inside the Container stays the same */}
    </Container>
  </>
);
```

**2. The message area.** In the `<Paper variant="outlined" sx={{...}}>`, add two keys:

```jsx
bgcolor: "rgba(255,255,255,0.78)",
borderColor: "divider",
```

**3. The bubbles.** Replace the `sx` of the message `Box` with:

```jsx
sx={{
  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
  maxWidth: "80%",
  px: 2,
  py: 1,
  borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
  bgcolor: m.role === "user" ? "#F9D5DC" : "#E1F2E4",
  color: "text.primary",
  boxShadow: "0 2px 8px rgba(74,85,69,0.08)",
  wordBreak: "break-word",
  "& p": { m: 0 },
  "& pre": {
    overflowX: "auto",
    p: 1.5,
    borderRadius: 1,
    bgcolor: "rgba(255,255,255,0.7)",
  },
}}
```

- Your messages are **blush pink** and the AI's are **mint green**, with the same text color on both.
- `borderRadius` with four values (`top-left top-right bottom-right bottom-left`) makes one corner less round. The less-round corner points toward the sender, which gives a chat-bubble look.
- The code block background (`rgba(255,255,255,0.7)`) is a translucent white, so code stands out on both bubble colors.

---

## Run and test

```bash
cd client
npm run dev
```

Check each page on a computer and on a narrow window (press `F12`, then the phone icon):

1. **Login and Signup:** flowers and leaves in the corners, a frosted card, and the round cats badge. Clicking "Sign up" and "Login" switches between them.
2. **Home:** the greeting under the cats, with a pink Notes card and a mint Chat card that lift on hover.
3. **Notes:** the banner and form on the left, and colorful cards on the right. Add several notes and check that each keeps its color after a refresh.
4. **Chat:** a lavender background, pink bubbles for you, and mint ones for the AI.
5. **Readability:** all text should be easy to read on every color. If a color is too strong or too pale, adjust it (see "Customizing" below).

---

## Customizing the look in one place

| What you want                   | Where to change it                                                             |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Main color of buttons and links | `palette.primary.main` in `theme.js` (keep a color dark enough for white text) |
| Accent and hover color          | `palette.secondary.main`                                                       |
| Note and card pastel colors     | The `noteColors` list in `theme.js`                                            |
| Page moods                      | `gradients` in `PageBackground.jsx`                                            |
| Fewer or more flowers           | Delete or copy `<Flower />` and `<Leaf />` lines                               |
| Flower colors and positions     | `petal`, `color`, `top`/`left`/`bottom`/`right` props                          |
| Chat bubble colors              | `bgcolor` in the bubble `sx` in `Chat.jsx`                                     |
| Fonts                           | `typography` in `theme.js` and the `@fontsource` imports                       |
| Top bar gradient                | `MuiAppBar` in `theme.js`                                                      |

**A rule to keep the design clean:** every background behind text should be a light color, and the text should stay the dark moss green. If you choose a darker background, switch that text to white.

---

## Troubleshooting

| Problem                                           | Cause and fix                                                                                                                                                                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Blank page** after navigating                   | A JavaScript error. Press `F12` and open the **Console**. A message like `ReferenceError: AuthLayout is not defined` means a missing import. Add `import AuthLayout from "../components/AuthLayout";` to the file. Missing imports are the most common cause of blank pages. |
| `Failed to resolve import "../assets/cats.png"`   | The file name or extension does not match. Check `client/src/assets/` (watch for `cats.png.png`) and update the import.                                                                                                                                                      |
| Fonts look plain                                  | The `@fontsource` imports are missing from `main.jsx`, or the packages are not installed. Run `npm install` and restart `npm run dev`.                                                                                                                                       |
| The flowers are hidden behind a white page        | Something sets a background on `body` or `#root`. Delete leftover Vite template CSS (`index.css`, `App.css`) and its imports.                                                                                                                                                |
| The app bar is grey or blue                       | `color: "transparent"` is missing in the AppBar `defaultProps` in `theme.js`.                                                                                                                                                                                                |
| Colors did not change                             | The theme is not applied. Check that `ThemeProvider` wraps `<App />` in `main.jsx`.                                                                                                                                                                                          |
| Images are slow or huge                           | Compress them to under about 300 KB (squoosh.app).                                                                                                                                                                                                                           |
| Cats image shows beige at the edges of the circle | Increase the badge size in `AuthLayout.jsx` (for example 160) so the crop covers the white circle.                                                                                                                                                                           |
| Rounded corners look too round or too flat        | In `sx`, strings (`"20px"`) are exact pixels. Numbers are multiplied by the theme radius (16).                                                                                                                                                                               |
| Notes all look the same color                     | Notes created before the change still get colors by id, but few notes can share a pastel. Add more colors to `noteColors` for more variety.                                                                                                                                  |
| `Unknown prop` warnings for `slotProps`           | An older MUI version. Use `inputProps={{ minLength: 8 }}` instead of `slotProps={{ htmlInput: ... }}`.                                                                                                                                                                       |

---

## Concepts recap

| Concept                        | One-line summary                                                     |
| ------------------------------ | -------------------------------------------------------------------- |
| Theme                          | One object that defines colors, fonts and shapes for every component |
| `ThemeProvider`                | Passes the theme down to all MUI components                          |
| `styleOverrides`               | Changes how a specific MUI component looks everywhere                |
| `sx` prop                      | Inline styles with theme shortcuts and responsive values             |
| Breakpoints (`xs`, `sm`, `md`) | Different values for different screen widths                         |
| SVG                            | Vector drawing in code, sharp at any size                            |
| Fixed layer with `zIndex: -1`  | A background that stays behind the page content                      |
| `children`                     | The content placed inside a wrapper component                        |
| CSS Grid                       | Responsive layouts with `gridTemplateColumns`                        |
| `auto-fill` with `minmax`      | As many columns as fit, with no breakpoints                          |
| `colorForId`                   | A stable color derived from an id                                    |
| Frosted glass                  | Semi-transparent white with `backdropFilter` blur                    |
| Browser Console                | Where JavaScript errors appear. Always check it for blank pages      |

---

## Commit and push

```bash
git status      # .env files and cookies.txt must NOT be listed
git add -A
git commit -m "Level 5: floral theme, backgrounds and colorful notes and chat"
git push -u origin level-5-design
```

---

## Ideas for next steps

- **Note colors saved in MongoDB:** a color picker on each note (add a `color` field to the Note model).
- **Update and delete for notes:** full CRUD with the ownership check (`{ _id, user: req.user._id }`).
- **Streaming chat replies:** show the AI answer word by word.
- **Dark mode toggle:** a second palette users can switch to.
- **Deployment:** host the backend, frontend and database online.
