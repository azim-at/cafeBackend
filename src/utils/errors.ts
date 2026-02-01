export class ServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message: string): ServiceError =>
  new ServiceError(400, message);

export const unauthorized = (message: string): ServiceError =>
  new ServiceError(401, message);

export const forbidden = (message: string): ServiceError =>
  new ServiceError(403, message);

export const notFound = (message: string): ServiceError =>
  new ServiceError(404, message);

export const conflict = (message: string): ServiceError =>
  new ServiceError(409, message);

export const isServiceError = (error: unknown): error is ServiceError =>
  error instanceof ServiceError;
