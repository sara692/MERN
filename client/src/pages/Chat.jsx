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

  // Load the saved conversation when the page opens
  useEffect(() => {
    api
      .get("/chat")
      .then((res) => setMessages(res.data.messages))
      .catch(() => toast.error("Could not load the chat"));
  }, []);

  // Scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    // Show the user's message immediately (optimistic update)
    setMessages((prev) => [
      ...prev,
      { _id: `temp-${Date.now()}`, role: "user", content },
    ]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post("/chat", { content }, { timeout: 90000 });
      // Replace the temporary message with the saved user + assistant messages
      setMessages((prev) => [...prev.slice(0, -1), ...res.data.messages]);
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1)); // remove the temporary message
      setInput(content); // give the text back so it isn't lost
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
