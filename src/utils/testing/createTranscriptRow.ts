import { Role } from "@prisma/client"
import { TranscriptRow } from "@prisma/client"

interface createTranscriptRowInput{
    role: Role,
    content: string,
    chatParamInvocationId: string,
    order: number,
    convoNodeId?: string
}


export default function createTranscriptRow(input: createTranscriptRowInput): TranscriptRow {
    const {
        role,
        content,
        chatParamInvocationId,
        order,
        convoNodeId = null,
      } = input;
    const node: TranscriptRow = {
        role,
        content,
        order,
        chatParamInvocationId,
        id: chatParamInvocationId + "transcriptNode" + content,
        convoNodeId: convoNodeId,
        createdAt: new Date(),
        updatedAt: new Date(),

    }

    return node

}