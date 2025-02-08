"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  LinearProgress
} from "@mui/material";
import Loading from "../../../../components/Loading"


import calculateTokens from "@/utils/calculateTokens";

export default function ChatSession() {

  const [chatParams, setChatParams] = useState<any>(null);
  const [dialog, setDialog] = useState<
    { role: string; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [chatEnded, setChatEnded] = useState(false);

  const [tokenCount, setTokenCount] = useState(0);

  const [transcripts, setTranscripts] = useState<{ role: string; content: string }[]>([]);
  
  const router = useRouter();
  interface ChatParams {
    system: string;
    temperature: number;
    topP: number;
    topK: number;
    maxTokens: number;
    stopSequences: string[];
    prompt: string;
  }
  

  const saveTranscriptAndEndChat = async (
    chatParamId: string,
    transcripts: { role: string; content: string }[],
    router: any
  ) => {
    try {
      const response = await fetch("/api/chatParam/updateTranscript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatParamId,
          transcripts,
        }),
      });
  
      if (!response.ok) {
        console.error("Error updating transcript:", await response.json());
        alert("Failed to save transcript.");
        return;
      }
  
      router.push(`/chat-history/${chatParamId}`);
    } catch (error) {
      console.error("Error ending chat:", error);
      alert("An unexpected error occurred.");
    }
  };
  const { chatParamId } = useParams() as { chatParamId: string }

  if (!chatParamId) {
    console.error("Missing or invalid chatParamId parameter in the URL.");
    setError("Missing session ID.");
    return null; // Return early to avoid further rendering
  }
  useEffect(()=>{
    if (chatParams && tokenCount > chatParams.maxTokens) {
      setChatEnded(true)
      return;
    }
  }, [tokenCount, chatParams, chatParamId, router])

  useEffect(() => {
    const fetchChatParamInvocation = async () => {
  
      try {
        const response = await fetch("/api/chatParam/getChatParamInvokation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: chatParamId }),
        });
  
        if (!response.ok) {
          console.error(
            `Error fetching ChatParamInvocation: ${response.statusText}`
          );
          setError("Failed to fetch session data.");
          return;
        }
  
        const data = await response.json();
        setChatParams(data);
  
        // Initialize dialog with the system prompt and the model's first prompt
        setDialog([
          { role: "user", content: "Let's begin." }, // Placeholder user message
          { role: "assistant", content: data.prompt }, // Model's prompt
        ]);
        setTranscripts([{ role: "assistant", content: data.prompt }]); // Initialize transcript array

        setTokenCount(
          calculateTokens(data.system) + calculateTokens(data.prompt)
        );
        // Optionally pass system and other params into the backend for setup
        setChatParams((prev: ChatParams | null) => ({
          ...prev,
          system: data.system,
          temperature: data.temperature,
          topP: data.topP,
          topK: data.topK,
          maxTokens: data.maxTokens,
          stopSequences: data.stopSequences,
        }));
      } catch (error) {
        console.error("An unexpected error occurred:", error);
        setError("An unexpected error occurred.");
      }
    };
  
    fetchChatParamInvocation();
  }, [chatParamId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setDialog((prev) => [...prev, userMessage]);
    setTranscripts((prev) => [...prev, userMessage]); // Add to transcripts

    setTokenCount((prev) => prev + calculateTokens(input)); // Add tokens for user message

    setInput("");
    setIsLoading(true);

    try {
      // Send conversation to the model
      const response = await fetch("/api/chat/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: [...dialog, userMessage], // Include chat history
          model: chatParams?.model, // Example model
          system: chatParams?.system ,
          temperature: chatParams?.temperature,
          top_p: chatParams?.top_p,
          top_k: chatParams?.top_k || 250,
          max_tokens: chatParams?.max_tokens || 300,
          stop_sequences: chatParams?.stop_sequences || ["\n\nHuman:"],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const aiMessage = { role: "assistant", content: data.response };
        setDialog((prev) => [...prev, aiMessage]);
        setTranscripts((prev) => [...prev, aiMessage]); // Add AI response to transcripts
        setTokenCount((prev) => prev + calculateTokens(data.response)); // Add tokens for AI response

      } else {
        console.error("Error communicating with the AI:", data.error);
        alert("Failed to get a response from the AI.");
      }
    } catch (error) {
      console.error("Error communicating with the AI:", error);
      alert("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!chatParams) {
    return <Loading message="Loading Chat Session"></Loading>
  }

  return (
    <Box display="flex" >
      {/* Dialog Section */}
      <Paper
        elevation={3}
        sx={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          padding: 2,
          margin: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Dialog
        </Typography>
        <Box
          sx={{
            flex: 1,
            overflowY: "scroll",
            padding: 2,
            border: "1px solid #ddd",
            borderRadius: "8px",
            marginBottom: 2,
          }}
        >
          {dialog.slice(1,).map((message, index) => (
            <Typography
              key={index}
              align={message.role === "assistant" ? "left" : "right"}
              gutterBottom
              sx = {{
                margin: "16px"
              }}
            >
              <strong>{message.role === "assistant" ? "AI" : "You"}:</strong>{" "}
              {message.content}
            </Typography>
          ))}
        </Box>
        {!chatEnded && <Box display="flex" gap={2}>
          <TextField
            variant="outlined"
            fullWidth
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "Send"}
          </Button>
        </Box>}
        {tokenCount > chatParams.maxTokens && (
          <Box mb="8px" display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="secondary"
              onClick={() => saveTranscriptAndEndChat(chatParamId, transcripts, router)}
              >
              End Chat
            </Button>
          </Box>
        )}
        <Box sx={{ marginTop: "8px", padding: 2, backgroundColor: "#f5f5f5" }}>
          <Typography variant="body2" align="center" gutterBottom>
            {`Token Usage: ${tokenCount} / ${chatParams.maxTokens}`}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(tokenCount / chatParams.maxTokens) * 100}
            sx={{
              height: 10,
              borderRadius: 5,
              "& .MuiLinearProgress-bar": {
                backgroundColor: (tokenCount / chatParams.maxTokens) >= 0.9 ? "red" : "green",
              },
            }}
          />
        </Box>
      </Paper>

      {/* Metrics Section */}
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          padding: 2,
          margin: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Session Info
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>System Prompt:</strong> {chatParams.system}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Initial Prompt:</strong> {chatParams.prompt}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Temperature:</strong> {chatParams.temperature}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Top P:</strong> {chatParams.topP}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Top K:</strong> {chatParams.topK}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Max Tokens:</strong> {chatParams.maxTokens}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Stop Sequences:</strong>{" "}
          {chatParams.stopSequences?.join(", ")}
        </Typography>
      </Paper>
    </Box>
  );
}