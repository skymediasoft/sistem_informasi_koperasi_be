import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request.url;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || exception.message;
        error = (resp.error as string) || exception.name;
        if (resp.details !== undefined) {
          details = resp.details;
        }
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    } else if (Array.isArray(exception) && exception.length > 0 && this.isValidationError(exception[0])) {
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message = 'Validation failed';
      details = exception.map((err) => ({
        field: err.property,
        constraints: err.constraints,
        children: err.children?.length ? this.formatValidationErrors(err.children) : undefined,
      }));
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error,
      timestamp,
      path,
      ...(details !== undefined && { details }),
    });
  }

  private formatValidationErrors(errors: unknown[]): Record<string, unknown>[] {
    return errors.map((err: unknown) => {
      const e = err as Record<string, unknown>;
      return {
        field: e.property,
        constraints: e.constraints,
        children: Array.isArray(e.children) && e.children.length
          ? this.formatValidationErrors(e.children as unknown[])
          : undefined,
      };
    });
  }

  private isValidationError(obj: unknown): obj is Record<string, unknown> {
    if (!obj || typeof obj !== 'object') return false;
    const e = obj as Record<string, unknown>;
    return typeof e.property === 'string' && (e.constraints === undefined || typeof e.constraints === 'object');
  }
}