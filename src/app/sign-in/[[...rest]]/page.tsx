"use client";

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "@mui/material/styles";

export default function SignInPage() {
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
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  );
}