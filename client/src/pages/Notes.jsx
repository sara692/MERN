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
