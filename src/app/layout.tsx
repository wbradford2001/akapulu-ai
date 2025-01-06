"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

const theme = createTheme();



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en" style={{ height: "100%", margin: 0 }}>
        <body style={{ height: "100%", margin: 0 }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}