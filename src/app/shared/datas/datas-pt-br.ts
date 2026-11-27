import { Injectable, Provider } from '@angular/core';
import {
  DateAdapter,
  MAT_NATIVE_DATE_FORMATS,
  MAT_DATE_FORMATS,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { DataHoraIso, DataIso } from '../models/datas';

const DD_MM_AAAA = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/**
 * O adaptador nativo do Material lê texto com `Date.parse`, que entende "04/05/2026" como
 * 5 de abril (formato americano). Este adaptador lê dd/mm/aaaa (padrão Adapter).
 */
@Injectable()
export class AdaptadorDataPtBr extends NativeDateAdapter {
  override parse(valor: unknown, formato: object): Date | null {
    if (typeof valor !== 'string') {
      return super.parse(valor, formato);
    }
    const texto = valor.trim();
    if (texto === '') {
      return null;
    }
    const partes = DD_MM_AAAA.exec(texto);
    if (!partes) {
      return this.invalid();
    }
    const [dia, mes, ano] = partes.slice(1).map(Number);
    const data = new Date(ano, mes - 1, dia);
    // O Date "corrige" datas inexistentes (31/02 vira 03/03): se mudou, a data não existe.
    const existe = data.getDate() === dia && data.getMonth() === mes - 1;
    return existe ? data : this.invalid();
  }
}

/** Textos do calendário, anunciados pelo leitor de tela. */
@Injectable()
export class DatepickerIntlPtBr extends MatDatepickerIntl {
  override calendarLabel = 'Calendário';
  override openCalendarLabel = 'Abrir calendário';
  override closeCalendarLabel = 'Fechar calendário';
  override prevMonthLabel = 'Mês anterior';
  override nextMonthLabel = 'Próximo mês';
  override prevYearLabel = 'Ano anterior';
  override nextYearLabel = 'Próximo ano';
  override prevMultiYearLabel = '24 anos anteriores';
  override nextMultiYearLabel = 'Próximos 24 anos';
  override switchToMonthViewLabel = 'Escolher data';
  override switchToMultiYearViewLabel = 'Escolher mês e ano';
}

export function provideDatasPtBr(): Provider[] {
  return [
    { provide: DateAdapter, useClass: AdaptadorDataPtBr },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    { provide: MatDatepickerIntl, useClass: DatepickerIntlPtBr },
  ];
}

/** Data do calendário → `AAAA-MM-DD`, pelos campos locais (dia que o usuário escolheu). */
export function paraDataIso(data: Date): DataIso {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}` as DataIso;
}

/** Instante → `AAAA-MM-DDThh:mm:ss`, na hora local. */
export function paraDataHoraIso(instante: Date): DataHoraIso {
  const doisDigitos = (numero: number) => String(numero).padStart(2, '0');
  const hora = [instante.getHours(), instante.getMinutes(), instante.getSeconds()]
    .map(doisDigitos)
    .join(':');
  return `${paraDataIso(instante)}T${hora}` as DataHoraIso;
}
