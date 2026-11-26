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

// Same id always gives the same color, so colors don't change on refresh
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
