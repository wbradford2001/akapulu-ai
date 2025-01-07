"use client";

import { SignUp } from "@clerk/nextjs";
import { useTheme } from "@mui/material/styles";

export default function SignUpPage() {
  const theme = useTheme(); // Access your theme's colors

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh", // Full viewport height
        backgroundColor: theme.palette.background.default, // Use theme's background color
      }}
    >
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
      />
    </div>
  );
}