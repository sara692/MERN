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
