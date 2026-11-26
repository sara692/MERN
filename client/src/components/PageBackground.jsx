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
