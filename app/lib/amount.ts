// Ввод суммы в текстовых полях. Пользователь может набрать запятую или точку; внутри храним
// строку с точкой (чтобы parseFloat работал), до 2 знаков после разделителя.
// Раньше поля вырезали всё, кроме цифр (replace(/\D/g, '')), и сумма 14798.99 при правке
// или сохранении превращалась в 1479899.
export function sanitizeAmountInput(raw: string): string {
  let s = raw.replace(/,/g, '.').replace(/[^\d.]/g, '')
  const i = s.indexOf('.')
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '').slice(0, 2)
  if (s.startsWith('.')) s = '0' + s
  return s
}

export function parseAmount(raw: string): number {
  const n = parseFloat(raw.replace(/,/g, '.'))
  return isNaN(n) ? NaN : Math.round(n * 100) / 100
}

// Для показа в поле: десятичная запятая, как привыкли в русской локали
export function displayAmountInput(raw: string): string {
  return raw.replace('.', ',')
}

// Начальное значение поля из числа (без хвостов вроде 0.30000000000000004)
export function amountToInput(n: number): string {
  return String(Math.round(Math.abs(n) * 100) / 100)
}
