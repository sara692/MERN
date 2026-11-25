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
