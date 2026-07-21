import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next({
        statusCode: 400,
        code: "validation_error",
        message: result.error.issues.map((i) => i.message).join(", "),
      });
    }
    req.body = result.data;
    next();
  };
}
