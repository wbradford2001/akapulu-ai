export class CustomError extends Error {
    statusCode: number;
    customMessage: string;
  
    constructor(statusCode: number, customMessage: string) {
      super(customMessage);
      this.statusCode = statusCode;
      this.customMessage = customMessage;
    }
  }