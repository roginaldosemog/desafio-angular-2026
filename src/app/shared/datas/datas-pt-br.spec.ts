import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { paraDataHoraIso, paraDataIso, provideDatasPtBr } from './datas-pt-br';

describe('Datas pt-BR', () => {
  let adaptador: DateAdapter<Date>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }, provideDatasPtBr()],
    });
    adaptador = TestBed.inject(DateAdapter);
  });

  describe('leitura do texto digitado', () => {
    it('DS-10: lê dd/mm/aaaa como dia, mês e ano', () => {
      const data = adaptador.parse('04/05/2026', null);

      expect(data).toEqual(new Date(2026, 4, 4));
    });

    it('DS-10: aceita dia e mês com um dígito', () => {
      expect(adaptador.parse('4/5/2026', null)).toEqual(new Date(2026, 4, 4));
    });

    it('DS-10: rejeita data que não existe no calendário', () => {
      const data = adaptador.parse('31/02/2026', null);

      expect(adaptador.isValid(data as Date)).toBe(false);
    });

    it('DS-10: rejeita texto fora do formato', () => {
      expect(adaptador.isValid(adaptador.parse('2026-05-04', null) as Date)).toBe(false);
      expect(adaptador.isValid(adaptador.parse('amanhã', null) as Date)).toBe(false);
    });

    it('campo vazio não é data', () => {
      expect(adaptador.parse('  ', null)).toBeNull();
    });
  });

  it('DS-10: exibe a data no formato dd/mm/aaaa', () => {
    const texto = adaptador.format(new Date(2026, 4, 4), {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    expect(texto).toBe('04/05/2026');
  });

  it('traduz os textos do calendário lidos pelo leitor de tela', () => {
    expect(TestBed.inject(MatDatepickerIntl).openCalendarLabel).toBe('Abrir calendário');
  });

  describe('paraDataHoraIso', () => {
    it('CL-22: converte para AAAA-MM-DDThh:mm:ss na hora local', () => {
      expect(paraDataHoraIso(new Date(2026, 4, 4, 9, 5, 7))).toBe('2026-05-04T09:05:07');
    });
  });

  describe('paraDataIso', () => {
    it('converte para AAAA-MM-DD usando a data local, sem fuso horário', () => {
      expect(paraDataIso(new Date(2026, 4, 4, 23, 59))).toBe('2026-05-04');
    });
  });
});
