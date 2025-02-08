"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";

import Loading from '../../../components/Loading'

export default function ChatParamDetails() {
  const { chatParamInvokationId } = useParams() as { chatParamInvokationId: string };
  const [chatParam, setChatParam] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchChatParam = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/chatParam/getChatParamInvokation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: chatParamInvokationId }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch chat param invocation.");
        }

        const data = await response.json();
        setChatParam(data);
      } catch (error: any) {
        setError(error.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchChatParam();
  }, [chatParamInvokationId]);

  if (loading) {
    return <Loading></Loading>  }

  if (error) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!chatParam) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
        <Typography color="error">No data found for this ChatParamInvocation.</Typography>
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Chat Param Invocation Details
      </Typography>
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Information" />
          <Tab label="Transcript" />
        </Tabs>
        {tabValue === 0 && (
            <Box p={3}>
                <Typography variant="h6" gutterBottom>
                    Information
                </Typography>
                <Table>
                    <TableBody>
                    <TableRow>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell>{chatParam.id}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><strong>System Prompt</strong></TableCell>
                        <TableCell>{chatParam.system}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><strong>Initial Prompt</strong></TableCell>
                        <TableCell>{chatParam.prompt}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><strong>Max Tokens</strong></TableCell>
                        <TableCell>{chatParam.maxTokens}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><strong>Created At</strong></TableCell>
                        <TableCell>{new Date(chatParam.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                    </TableBody>
                </Table>
                </Box>
        )}
        {tabValue === 1 && (
          <Box p={3}>
            <Typography variant="h6">Transcript</Typography>
            <Typography>Transcript data will go here...</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}