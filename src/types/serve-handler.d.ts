// Type definition for handler function's
declare module "serve-handler" {
    import { IncomingMessage, ServerResponse } from "http";
  
    const handler: (
      req: IncomingMessage,
      res: ServerResponse,
      options?: object
    ) => Promise<void>;
  
    export default handler;
  }