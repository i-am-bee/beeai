/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
  AcpErrorResponse,
  ApiErrorCode,
  ApiErrorResponse,
  ApiValidationErrorResponse,
  StreamErrorResponse,
} from './types';

abstract class CustomError extends Error {
  name: string;
  response?: Response;

  constructor({ message, response }: { message?: string; response?: Response }) {
    super(message);

    this.name = new.target.name;
    this.response = response;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ApiError extends CustomError {
  error: ApiErrorResponse;
  code: ApiErrorCode;

  constructor({ error, response }: { error: ApiErrorResponse; response?: Response }) {
    super({ message: error.message, response });

    this.error = error;
    this.code = error.code;
  }
}

export class HttpError extends CustomError {
  code: number;

  constructor({ message, response }: { message?: string; response: Response }) {
    super({ message, response });

    this.code = response.status;
  }
}

export class AcpError extends CustomError {
  error: AcpErrorResponse;
  code: AcpErrorResponse['error']['code'];

  constructor({ error, response }: { error: AcpErrorResponse; response?: Response }) {
    super({ message: error.error.message, response });

    this.error = error;
    this.code = error.error.code;
  }
}

export class ApiValidatioError extends CustomError {
  error: ApiValidationErrorResponse;

  constructor({ error, response }: { error: ApiValidationErrorResponse; response?: Response }) {
    super({ message: JSON.stringify(error.detail), response });

    this.error = error;
  }
}

export class StreamError extends CustomError {
  error: StreamErrorResponse;
  code: StreamErrorResponse['status_code'];

  constructor({ error, response }: { error: StreamErrorResponse; response?: Response }) {
    super({ message: error.detail, response });

    this.error = error;
    this.code = error.status_code;
  }
}
