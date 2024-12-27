import { NextApiRequest, NextApiResponse } from 'next';
import { Webhook } from 'svix';
import { buffer } from 'micro';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

export const config = {
  api: {
    bodyParser: false, // Disables body parsing to handle raw requests
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    console.log("HELLO")
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = (await buffer(req)).toString();
  const headers = req.headers;

  const svixHeaders = {
    'svix-id': headers['svix-id'] as string,
    'svix-timestamp': headers['svix-timestamp'] as string,
    'svix-signature': headers['svix-signature'] as string,
  };

  const wh = new Webhook(webhookSecret);

  let event: any;

  try {
    event = wh.verify(payload, svixHeaders);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return res.status(400).json({ error: 'Webhook verification failed' });
  }

  if (event.type === 'user.created') {
    const clerkUser = event.data;

    // Sync user to your database
    const userExists = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });

    if (!userExists) {
      await prisma.user.create({
        data: {
          id: clerkUser.id,
          firstName: clerkUser.first_name || '',
          lastName: clerkUser.last_name || '',
          email: clerkUser.email_addresses[0]?.email_address || '',
          credits: 0,
        },
      });
    }
  }

  res.status(200).json({ success: true });
};

export default handler;
