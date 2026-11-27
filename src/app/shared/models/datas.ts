/**
 * Data civil sem fuso horário, no formato `AAAA-MM-DD` (ex.: `'2026-04-27'`).
 * O tipo rejeita outros formatos em tempo de compilação, mas não valida dia e mês.
 */
export type DataIso = `${number}-${number}-${number}`;

/** Data e hora local, no formato `AAAA-MM-DDThh:mm:ss` (ex.: `'2026-04-27T12:35:11'`). */
export type DataHoraIso = `${DataIso}T${number}:${number}:${number}`;
