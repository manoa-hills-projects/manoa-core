/**
 * Errores del módulo Treasury con status HTTP tipados.
 */

export class TreasuryError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = "TreasuryError";
  }
}

export class TreasuryNotFoundError extends TreasuryError {
  constructor(entity: string, id?: string) {
    super(
      id ? `${entity} con ID "${id}" no encontrado` : `${entity} no encontrado`,
      404
    );
    this.name = "TreasuryNotFoundError";
  }
}

export class TreasuryConflictError extends TreasuryError {
  constructor(message: string) {
    super(message, 409);
    this.name = "TreasuryConflictError";
  }
}

export class TreasuryForbiddenError extends TreasuryError {
  constructor(message: string) {
    super(message, 403);
    this.name = "TreasuryForbiddenError";
  }
}
