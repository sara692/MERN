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
