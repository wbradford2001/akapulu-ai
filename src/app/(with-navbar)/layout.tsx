"use client";

import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import SideNavbar from "../components/SideNavbar"; // Adjust path to SideNavbar
import TopNavbar from "../components/TopNavbar"; // Adjust path to TopNavbar

export default function WithNavbarLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleHamburgerClick = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Navbar */}
      <TopNavbar onHamburgerClick={handleHamburgerClick} />

      {/* Main Content Wrapper */}
      <Box
        sx={{
          display: "flex",
          flex: 1, // Take up the remaining height below the top navbar
          marginTop: "65px", // Offset for fixed TopNavbar height
        }}
      >
        {/* Side Navbar */}
        {isSmallScreen ? (
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={handleDrawerClose}
            sx={{
              "& .MuiDrawer-paper": { width: "250px" },
            }}
          >
            <SideNavbar isDrawer onClose = {handleDrawerClose}/>
          </Drawer>
        ) : (
          <SideNavbar />
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto", // Allow main content to scroll
            padding: "20px",
            boxSizing: "border-box",
            marginLeft: {  sm: "250px" },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}