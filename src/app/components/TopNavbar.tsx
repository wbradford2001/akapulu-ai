"use client";

import { Box, Typography, IconButton, Avatar, Menu, MenuItem, useTheme, useMediaQuery } from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu"; 
import Logo from "/public/Logo.svg"; 
import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image"; 


export default function TopNavbar({ onHamburgerClick }: { onHamburgerClick: () => void }) {
    const router = useRouter();
    const theme = useTheme();

    // anchor element and open state for profile drop down
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);


    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm")); 
    const { signOut } = useClerk();
    const { user } = useUser();

    const [userData, setUserData] = useState<{ firstName: string; profilePicUrl: string | null } | null>(null);


    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.id) return;
    
            let attempts = 0; // Track the number of attempts
            const maxAttempts = 10; // Maximum number of retry attempts
            const baseDelay = 1000; // Base delay in milliseconds for exponential backoff
    
            while (attempts < maxAttempts) {
                try {
                    const response = await fetch(`/api/user/userDetails`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: user.id }), // Pass user ID in the payload
                    });
    
                    if (response.ok) {
                        const data = await response.json();

                        setUserData({
                            firstName: data.firstName,
                            profilePicUrl: data.profilePicUrl || null,
                        });

                        if (data.profilePicUrl){
                            return; // Exit the loop once data is successfully fetched, otherwise keep going
                        }
                    }
    
                    // If the response is not ok, assume user details are not yet created
                    console.warn(`Attempt ${attempts + 1}: User details not found, retrying...`);
                } catch (error) {
                    console.error(`Error fetching user data on attempt ${attempts + 1}:`, error);
                }
    
                // Exponential backoff with jitter
                const delay = baseDelay * 2 ** attempts + Math.random() * baseDelay;
                await new Promise((resolve) => setTimeout(resolve, delay));
    
                attempts += 1;
            }
    
            console.error("Failed to fetch user data after maximum attempts.");
        };
    
        fetchUserData();
    }, [user?.id]);



    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSignOut = () => {
        signOut( {redirectUrl: "/sign-in" })
        router.push("/sign-in")
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
                    <Image
                        src={Logo.src}
                        alt="Logo"
                        width={40} // Specify the width
                        height={40} // Specify the height
                        style={{
                            height: "40px", // Inline styles for custom layout
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

            {/* Right Section:Profile */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                }}
            >

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
                            <Typography variant="body1">{userData?.firstName}</Typography> {/* Display firstName */}
                            <Typography variant="body2" color="textSecondary">
                                {user?.primaryEmailAddress?.emailAddress}
                            </Typography>
                        </Box>
                    )}
                    <IconButton onClick={handleMenuOpen}>
                        <Avatar src={userData?.profilePicUrl || undefined} alt={userData?.firstName || "Profile"}>
                            {!userData?.profilePicUrl && userData?.firstName?.charAt(0)} {/* Use firstName initial */}
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