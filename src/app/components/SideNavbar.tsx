"use client";

import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, useTheme, useMediaQuery } from "@mui/material";
import { useRouter } from "next/navigation";
import ForumIcon from '@mui/icons-material/Forum';
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DescriptionIcon from "@mui/icons-material/Description"; // or another icon of your choice

import HistoryIcon from "@mui/icons-material/History"; // For a "history" look

import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useClerk } from "@clerk/nextjs";


export default function SideNavbar({
    isDrawer = false,
    onClose,
  }: {
    isDrawer?: boolean;
    onClose?: () => void;
  }) {
  const router = useRouter();
  const theme = useTheme();

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { signOut } = useClerk();



  const handleNavClick = (href: string) => {
    if (href === "/logout"){
        signOut({redirectUrl: "/sign-in" })
        router.push("/sign-in")
        return
    }
    router.push(href);
    if (isDrawer && onClose) {
      onClose(); // Close the drawer on small screens
    }
  };


  const navItems = [
    { href: "/chat", icon: <ForumIcon />, label: "Chat" },
    { href: "/chat-history", icon: <HistoryIcon />, label: "Chat History" },
    { href: "/scripts", icon: <DescriptionIcon />, label: "Scripts" },
  ];

  return (
    <Box
      sx={{
        width: "250px",
        height: isSmallScreen ?  "100vh": "calc(100vh - 65px)", // Full viewport height minus top navbar height
        backgroundColor: "background.paper",
        borderRight: isDrawer ? "none" : "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between", // Push bottom items to the bottom
        position: "fixed", // Fix sidebar under the top navbar
        top: {sm: "65px"}, // Height of the top navbar
        left: 0,
        zIndex: 1000, // Ensure it's above the main content
      }}
    >
      {/* Navigation Links */}
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label}>
            <ListItemButton
                onClick={() => handleNavClick(item.href)}
              
              sx={{
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer Section */}
      <List>
        <Divider sx={{ margin: "16px 0" }} />
        <ListItem>
          <ListItemButton onClick={() => handleNavClick("/profile")}>
            <ListItemIcon>
              <AccountCircleIcon />
            </ListItemIcon>
              <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>
        <ListItem>
          <ListItemButton onClick={() => handleNavClick("/logout")}>
            <ListItemIcon>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText primary="Log Out" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}