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
      setNotes((prev) => [res.data, ...prev]); // add the new note at the top
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
