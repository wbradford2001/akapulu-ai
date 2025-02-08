"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  Tooltip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

export default function ChatSettings() {
  const router = useRouter();

  const { user } = useUser();

  const [params, setParams] = useState({
    system: "You are an AI assistant.",
    prompt: "How can I assist you?",
    maxTokens: 300,
  });

  const [preMadeChatParams, setPreMadeChatParams] = useState<
    { id: string; name: string; system: string; prompt: string; maxTokens: number }[]
  >([]);
  const [selectedPreMadeId, setSelectedPreMadeId] = useState<string | null>(
    null
  );

  const [errors, setErrors] = useState<{ system?: string; prompt?: string; maxTokens?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPreMadeLoading, setIsPreMadeLoading] = useState(false);

  useEffect(() => {
    const fetchPreMadeChatParams = async () => {
      setIsPreMadeLoading(true);
      try {
        const response = await fetch("/api/chatParam/getPreMadeChatParams");
        const data = await response.json();
        setPreMadeChatParams(data);
      } catch (error) {
        console.error("Error fetching pre-made chat params:", error);
        alert("Failed to load pre-made chat params.");
      } finally {
        setIsPreMadeLoading(false);
      }
    };

    fetchPreMadeChatParams();
  }, []);

  const validateField = (key: "system" | "prompt" | "maxTokens", value: any ) => {
    if (key === "maxTokens" && value && (value < 150 || value > 2000|| isNaN(value))) {
      return "Max Tokens must be a positive number between 150 and 2000";
    }
    if (typeof value === "string" && !value.trim()) {
      return "This field is required.";
    }
    return "";
  };

  const handleInputChange = (key: "system" | "prompt" | "maxTokens", value: any) => {
    // if (key === "maxTokens") {
    //   //const sanitizedValue = value?.toString().slice(0); // Ensure value is a string and sanitize

    //   setParams((prev) => ({
    //     ...prev,
    //     [key]: sanitizedValue === "0" ? Number(sanitizedValue.slice(1,)) : value, // Allow empty input
    //   }));
    // } else {
      const error = validateField(key, value);
      setParams((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: error }));
      setSelectedPreMadeId(null); // Switch to custom input when editing fields
    //}
  };

  const handlePreMadeSelection = (id: string | null) => {
    setSelectedPreMadeId(id);

    if (id) {
      const selectedPreMade = preMadeChatParams.find((param) => param.id === id);
      if (selectedPreMade) {
        setParams({ 
          system: selectedPreMade.system, 
          prompt: selectedPreMade.prompt,
          maxTokens: selectedPreMade.maxTokens,

        });
      }
    } else {
      setParams({ system: "", prompt: "" , maxTokens: 300}); // Reset fields for custom input
    }
  };

  const handleCreateSession = async () => {
    const newErrors = {
      system: validateField("system", params.system),
      prompt: validateField("prompt", params.prompt),
      maxTokens: validateField("maxTokens", params.maxTokens),
    };

    if (newErrors.system || newErrors.prompt || newErrors.maxTokens) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/chatParam/createChatParamInvokation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "unknownUser",
          ...params,
          preMadeChatParamId: selectedPreMadeId || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/chat/session/${data.id}`);
      } else {
        console.error("Error creating ChatParamInvocation:", data.error);
        alert("Failed to create chat session. Please try again.");
      }
    } catch (error) {
      console.error("Error creating chat session:", error);
      alert("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ padding: 4 }}
    >
      <Typography variant="h4" gutterBottom>
        Chat Session Settings
      </Typography>
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 600,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="pre-made-select-label">Select Pre-Made</InputLabel>
            <Select
              labelId="pre-made-select-label"
              label="Select Pre-Made"
              value={selectedPreMadeId || ""}
              onChange={(e) => handlePreMadeSelection(e.target.value || null)}
              fullWidth
              disabled={isPreMadeLoading}
              sx={{
                "& .MuiSelect-outlined": {
                  display: "flex",
                  alignItems: "center",
                },
              }}
            >
              {selectedPreMadeId && <MenuItem value="">
                <em>Custom</em>
              </MenuItem>}
              {preMadeChatParams.map((param) => (
                <MenuItem key={param.id} value={param.id}>
                  {param.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Select a pre-made configuration or use custom settings for your chat session.">
            <IconButton>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            label="System Prompt"
            variant="outlined"
            value={params.system}
            onChange={(e) => handleInputChange("system", e.target.value)}
            onBlur={() => setErrors((prev) => ({ ...prev, system: validateField("system", params.system) }))}
            multiline
            rows={4}
            fullWidth
            required
            error={!!errors.system}
            helperText={errors.system}
          />
          <Tooltip title="This is a system-level directive that sets the behavior and tone of the AI.">
            <IconButton>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            label="Initial Prompt"
            variant="outlined"
            value={params.prompt}
            onChange={(e) => handleInputChange("prompt", e.target.value)}
            onBlur={() => setErrors((prev) => ({ ...prev, prompt: validateField("prompt", params.prompt) }))}
            fullWidth
            required
            error={!!errors.prompt}
            helperText={errors.prompt}
          />
          <Tooltip title="This is the initial message sent to the AI to establish context for the chat.">
            <IconButton>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            label="Max Tokens"
            type="number"
            variant="outlined"
            value={params.maxTokens || ""}
            onChange={(e) => handleInputChange("maxTokens", parseInt(e.target.value, 10))}
            onBlur={() =>
              setErrors((prev) => ({
                ...prev,
                maxTokens: validateField("maxTokens", params.maxTokens),
              }))
            }
            fullWidth
            required
            error={!!errors.maxTokens}
            helperText={errors.maxTokens || "Specify the maximum number of tokens for the session."}
          />
          <Tooltip title="Set the maximum number of tokens for this chat session.">
            <IconButton>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateSession}
          disabled={isLoading}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : "Create"}
        </Button>
      </Paper>
    </Box>
  );
}