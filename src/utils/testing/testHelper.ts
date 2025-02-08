import { Webhook } from "svix";
import { createMocks } from "node-mocks-http";
import syncHandler from "../../pages/api/user/sync";
import { ConversationNode, Role } from "@prisma/client";
export async function initializeTestUser({
  userId,
  email,
  signingSecret,
  hasImage,
  imageUrl,
}: {
  userId: string;
  email: string;
  signingSecret: string;
  hasImage: boolean;
  imageUrl: string | null;
}) {
  const webhook = new Webhook(signingSecret);

  const payload = JSON.stringify({
    type: "user.created",
    data: {
      id: userId,
      email_addresses: [{ email_address: email }],
      first_name: "Test",
      last_name: "User",
      has_image: hasImage,
      image_url: imageUrl,
    },
  });

  const svixId = "test-id-create";
  const svixTimestamp = new Date();
  const svixSignature = webhook.sign(svixId, svixTimestamp, payload);

  const { req, res } = createMocks({
    method: "POST",
    body: JSON.parse(payload),
    headers: {
      "Content-Type": "application/json",
      "svix-id": svixId,
      "svix-timestamp": Math.floor(svixTimestamp.getTime() / 1000).toString(),
      "svix-signature": svixSignature,
    },
  });

  // Call the syncHandler
  await syncHandler(req, res);

  // Ensure the response is successful
  if (res._getStatusCode() !== 200) {
    throw new Error(`Failed to initialize test user: ${res._getData()}`);
  }
}

export async function cleanupTestUser({
  userId,
  signingSecret,
}: {
  userId: string;
  signingSecret: string;
}) {
  const webhook = new Webhook(signingSecret);

  const payload = JSON.stringify({
    type: "user.deleted",
    data: {
      id: userId,
    },
  });

  const svixId = "test-id-delete";
  const svixTimestamp = new Date();
  const svixSignature = webhook.sign(svixId, svixTimestamp, payload);

  const { req, res } = createMocks({
    method: "POST",
    body: JSON.parse(payload),
    headers: {
      "Content-Type": "application/json",
      "svix-id": svixId,
      "svix-timestamp": Math.floor(svixTimestamp.getTime() / 1000).toString(),
      "svix-signature": svixSignature,
    },
  });

  // Call the syncHandler
  await syncHandler(req, res);

  // Ensure the response is successful
  if (res._getStatusCode() !== 200) {
    throw new Error(`Failed to clean up test user: ${res._getData()}`);
  }
}


// function to find the first converation node by role given an array of conversation nodes (or conversationNode->ChatParamRelation)
export function findNodeByRole(nodes: Record<string, ConversationNode>[] | ConversationNode[], role: Role){

  for (const node of nodes){
    if ("conversationNode" in node){
      if (node.conversationNode.role === role){
        return node.conversationNode
      }
    } else {
      if (node.role === role){
        return node
      }
    }

  }

  throw new Error("No nodes returned in findNodeByRole!")
}