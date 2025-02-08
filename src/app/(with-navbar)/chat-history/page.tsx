"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from '@mui/material/styles';
import Link from "next/link";

import Loading from "../../components/Loading"; // Import the reusable Loading component

import {
  Box,
  Typography,
} from "@mui/material";
import { DataGrid,GridColDef } from "@mui/x-data-grid";
import { useUser } from "@clerk/nextjs";
import { ChatParamInvocation } from "@prisma/client";


export default function ChatHistory() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rows, setRows] = useState([])


  const theme = useTheme();

  const columns: GridColDef[] = [
    { field: "createdAt", headerName: "Created At", flex: 1,minWidth: 100},
    {
      field: "id",
      headerName: "ID",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Link
          href={`/chat-history/${params.value}`}
          style={{
            textDecoration: "none",
            color: theme.palette.primary.main,
          }}
        >
          {params.value}
        </Link>
      ),
    },  { field: "system", headerName: "System Prompt", flex: 1,minWidth: 300 },
    { field: "prompt", headerName: "Initial Prompt",flex: 1,minWidth: 250 },
    { field: "maxTokens", headerName: "Max Tokens", type: "number",flex: 1,minWidth: 100, align:"center", headerAlign: "center"},
  ];
  useEffect(() => {
    if (!isLoaded) return; // Wait for Clerk user data to load

    const fetchChatHistory = async () => {
      if (!user) {
        setError("User not logged in");
        return;
      }
  
      setLoading(true);
      try {
        const response = await fetch("/api/chatParam/getChatParamInvokations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id }), // Replace with actual userId
        });

        if (!response.ok) {
          throw new Error("Failed to fetch chat history.");
        }

        const data = await response.json();
        setRows(data.map((inv: ChatParamInvocation) => ({
          id: inv.id,
          system: inv.system,
          prompt: inv.prompt,
          maxTokens: inv.maxTokens,
          createdAt: new Date(inv.createdAt).toLocaleString(),
        })));
      } catch (error: any) {
        console.error("Error fetching chat history:", error);
        setError(error.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [isLoaded, user]);

  if (loading) {
    return <Loading message="Fetching Chat History" />;
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
        <Typography color="error" variant="body1">
          {error}
        </Typography>
      </Box>
    );
  }
  if (!isLoaded) {
    return <Loading message="Fetching Chat History..." />;
  }
  return (
    <Box style={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        //slots={{ toolbar: GridToolbar }} // Adds a search/filter toolbar
        disableRowSelectionOnClick // Updated from `disableSelectionOnClick` to `disableRowSelectionOnClick` in newer versions
        sx={{
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: theme.palette.primary.main, // Use the primary color from the theme
            color: '#ffffff'
          },
          '& .MuiDataGrid-footerContainer': {
            //backgroundColor: theme.palette.primary.main, // Use the primary color from the theme
            color: '#ffffff'
          },
        }}
      />
    </Box>
  );
}