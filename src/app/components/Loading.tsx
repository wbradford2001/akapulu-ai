"use client";

import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

const Loading: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      //height="100vh"
    >
      <LinearProgress sx={{ width: "100%", marginBottom: 2 }} />
      <Typography variant="h6" sx={{ marginTop: 2 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;