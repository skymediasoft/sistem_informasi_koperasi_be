import { BadRequestException } from '@nestjs/common';

/**
 * Builds `UPDATE table SET ... WHERE ...` from a dto. `columns` is the allow-list
 * (dtoKey -> columnName); unknown keys and `undefined` values are skipped, like
 * a partial-update semantics. `where` is a trusted SQL fragment with `?` marks.
 */
export function buildUpdate(
  table: string,
  columns: Record<string, string>,
  dto: Record<string, unknown>,
  where: string,
  whereParams: unknown[],
): { sql: string; params: unknown[] } {
  const keys = Object.keys(columns).filter((k) => dto[k] !== undefined);
  if (!keys.length) throw new BadRequestException('No fields to update');
  return {
    sql: `UPDATE ${table} SET ${keys.map((k) => `${columns[k]} = ?`).join(', ')} WHERE ${where}`,
    params: [...keys.map((k) => dto[k]), ...whereParams],
  };
}
