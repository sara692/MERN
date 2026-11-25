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
