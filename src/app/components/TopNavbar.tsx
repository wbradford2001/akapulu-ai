"use client";

import { Box, Typography, Button, IconButton, Avatar, Menu, MenuItem, useTheme, useMediaQuery } from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu"; // Import MenuIcon
import Logo from "/public/Logo.svg"; // Adjust the path to your logo
import { useClerk, useUser } from "@clerk/nextjs";
import { useFetchUserData } from "@/utils/useFetchUserData";




export default function TopNavbar({ onHamburgerClick }: { onHamburgerClick: () => void }) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const router = useRouter();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm")); // Detect small screens
    const { signOut } = useClerk();
    const { user } = useUser();

    const { userData, error } = useFetchUserData(user?.id);
    console.log(error)



    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSignOut = () => {
        signOut( {redirectUrl: "/sign-in" })
    }

    return (
        <Box
            sx={{
                height: "65px",
                backgroundColor: theme.palette.grey[200],
                borderBottom: "1px solid",
                borderColor: "divider",
                position: "fixed", // Fix the navbar at the top
                top: 0,
                left: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px",
                zIndex: 1000,
            }}
        >
            {/* Left Section: Hamburger Menu and Logo */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                }}
            >
                {isSmallScreen && (
                    <IconButton onClick={onHamburgerClick} sx={{ marginRight: "8px" }}>
                        <MenuIcon />
                    </IconButton>
                )}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        justifyContent: isSmallScreen ? "center" : "flex-start",
                        cursor: "pointer"
                    }}
                    onClick={() => router.push("/")}

                >
                    <img
                        src={Logo.src}
                        alt="Logo"
                        style={{
                            height: "40px",
                            marginLeft: isSmallScreen ? "auto" : 0, // Centered logo for small screens
                        }}
                    />
                    {!isSmallScreen && (
                        <Typography variant="h6" noWrap>
                            Akapulu AI
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Right Section: Credits and Profile */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                {/* Credits Button */}
                <Button
                    onClick={() => router.push("/add-credits")}
                    variant="contained"
                    sx={{
                        textTransform: "none",
                        padding: { xs: "4px 8px", sm: "8px 16px" },
                        fontSize: { xs: "0.8rem", sm: "1rem" },
                    }}
                >
                    Credits: 10
                </Button>

                {/* Profile Section */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        justifyContent: { xs: "center", sm: "flex-end" },
                    }}
                >
                    {!isSmallScreen && (
                        <Box sx={{ textAlign: "right" }}>
                            <Typography variant="body1">{userData?.username}</Typography>
                            <Typography variant="body2" color="textSecondary">
                                {user?.primaryEmailAddress?.emailAddress }
                            </Typography>
                        </Box>
                    )}
                    <IconButton onClick={handleMenuOpen}>
                        <Avatar src={userData?.profilePictureUrl || undefined} alt={userData?.username || "Profile"}>
                            {!userData?.profilePictureUrl  && userData?.username?.charAt(0)}
                        </Avatar>
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
                        <MenuItem onClick={() => router.push("/profile")}>Profile</MenuItem>
                        <MenuItem onClick={handleSignOut}>Log Out</MenuItem>
                    </Menu>
                </Box>
            </Box>
        </Box>
    );
}