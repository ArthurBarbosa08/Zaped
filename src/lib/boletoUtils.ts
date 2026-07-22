/**
 * Utility functions for validating and parsing Brazilian boleto bancário codes
 */

/**
 * Removes all non-numeric characters from a string
 */
export function cleanString(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Calculates the modulo 10 validator for a given string of numbers
 * @param numString String of digits to calculate modulo 10 for
 * @returns The verificador digit
 */
export function modulo10(numString: string): number {
  let total = 0;
  let peso = 2;

  // Process from right to left
  for (let i = numString.length - 1; i >= 0; i--) {
    const digit = parseInt(numString.charAt(i));
    let product = digit * peso;

    // If product is two digits, sum the digits
    if (product > 9) {
      product = Math.floor(product / 10) + (product % 10);
    }

    total += product;

    // Alternate peso between 2 and 1
    peso = peso === 2 ? 1 : 2;
  }

  const resto = total % 10;
  return resto === 0 ? 0 : 10 - resto;
}

/**
 * Calculates the modulo 11 validator for a given string of numbers
 * @param numString String of digits to calculate modulo 11 for
 * @returns The verificador digit
 */
export function modulo11(numString: string): number {
  let total = 0;
  let peso = 2;

  // Process from right to left
  for (let i = numString.length - 1; i >= 0; i--) {
    const digit = parseInt(numString.charAt(i));
    total += digit * peso;

    // Increase peso from 2 to 9, then reset to 2
    peso = peso === 9 ? 2 : peso + 1;
  }

  const resto = total % 11;

  // If resto is 0 or 1, verificador is 0
  // Otherwise, verificador is 11 - resto
  if (resto === 0 || resto === 1) {
    return 0;
  }

  return 11 - resto;
}

/**
 * Validates a boleto barcode (código de barras)
 * @param codigoDeBarras The 44-digit barcode
 * @returns Object with validation results and extracted data
 */
export function validateBoletoBarcode(codigoDeBarras: string): {
  isValid: boolean;
  error?: string;
  codigoDeBarras?: string;
  data?: {
    banco: string;
    moeda: string;
    fatorVencimento: string;
    valor: string;
    campoLivre1: string;
    campoLivre2: string;
    campoLivre3: string;
    valorNominal: number;
    dataVencimento: string; // DD/MM/YYYY
  };
} {
  // Clean the input
  const cleanCode = cleanString(codigoDeBarras);

  // Check if it has exactly 44 digits
  if (cleanCode.length !== 44) {
    return {
      isValid: false,
      error: `Código de barras deve ter 44 dígitos. Informado: ${cleanCode.length}`
    };
  }

  // Extract parts according to boleto bancário standard
  const banco = cleanCode.substring(0, 3); // Bank code
  const moeda = cleanCode.substring(3, 4); // Currency (9 = Real)
  const fatorVencimento = cleanCode.substring(4, 8); // Expiration factor
  const valorNominalStr = cleanCode.substring(8, 16); // Nominal value (without zeros)
  const campoLivre1 = cleanCode.substring(16, 26); // Free field 1
  const campoLivre2 = cleanCode.substring(26, 35); // Free field 2
  const campoLivre3 = cleanCode.substring(35, 44); // Free field 3

  // Convert valor from string to actual value
  let valorNominal = 0;
  if (valorNominalStr !== '00000000') {
    valorNominal = parseInt(valorNominalStr) / 100;
  }

  // Convert fator de vencimento to actual date
  let dataVencimento = '00/00/0000';
  if (fatorVencimento !== '0000') {
    const fator = parseInt(fatorVencimento);
    const baseDate = new Date(1997, 9, 7); // October 7, 1997 (month is 0-indexed)
    const vencimentoDate = new Date(baseDate.getTime() + (fator * 24 * 60 * 60 * 1000));

    const dia = String(vencimentoDate.getDate()).padStart(2, '0');
    const mes = String(vencimentoDate.getMonth() + 1).padStart(2, '0');
    const ano = vencimentoDate.getFullYear();
    dataVencimento = `${dia}/${mes}/${ano}`;
  }

  // Basic validation: check if currency is 9 (Real)
  if (moeda !== '9') {
    return {
      isValid: false,
      error: 'Moeda inválida. Esperado "9" para Real.'
    };
  }

  return {
    isValid: true,
    data: {
      banco,
      moeda,
      fatorVencimento,
      valor: valorNominalStr,
      campoLivre1,
      campoLivre2,
      campoLivre3,
      valorNominal,
      dataVencimento
    }
  };
}

/**
 * Validates a boleto's linha digitável (the human-readable format)
 * @param linhaDigitavel The linha digitável (typically 47 characters with spaces and dots)
 * @returns Object with validation results and extracted data
 */
export function validateBoletoLinhaDigitavel(linhaDigitavel: string): {
  isValid: boolean;
  error?: string;
  codigoDeBarras?: string;
  data?: {
    banco: string;
    moeda: string;
    fatorVencimento: string;
    valor: string;
    campoLivre1: string;
    campoLivre2: string;
    campoLivre3: string;
    valorNominal: number;
    dataVencimento: string;
  };
} {
  // Clean the input (remove spaces and dots)
  const cleanLine = cleanString(linhaDigitavel);

  if (cleanLine.length !== 47) {
    return {
      isValid: false,
      error: `Linha digitável deve ter 47 dígitos. Informado: ${cleanLine.length}`
    };
  }

  const banco = cleanLine.substring(0, 3);
  const moeda = cleanLine.substring(3, 4);
  const dv = cleanLine.substring(32, 33);
  const fatorVencimento = cleanLine.substring(33, 37);
  const valorNominalStr = cleanLine.substring(37, 47);

  const campoLivre1 = cleanLine.substring(4, 9);
  const campoLivre2 = cleanLine.substring(10, 20);
  const campoLivre3 = cleanLine.substring(21, 31);

  const codigoDeBarras = `${banco}${moeda}${dv}${fatorVencimento}${valorNominalStr}${campoLivre1}${campoLivre2}${campoLivre3}`;

  // Validate the fields using modulo 10
  const field1 = cleanLine.substring(0, 9);
  const dv1 = parseInt(cleanLine.substring(9, 10));
  if (modulo10(field1) !== dv1) {
    return { isValid: false, error: 'Dígito verificador do primeiro campo é inválido.' };
  }

  const field2 = cleanLine.substring(10, 20);
  const dv2 = parseInt(cleanLine.substring(20, 21));
  if (modulo10(field2) !== dv2) {
    return { isValid: false, error: 'Dígito verificador do segundo campo é inválido.' };
  }

  const field3 = cleanLine.substring(21, 31);
  const dv3 = parseInt(cleanLine.substring(31, 32));
  if (modulo10(field3) !== dv3) {
    return { isValid: false, error: 'Dígito verificador do terceiro campo é inválido.' };
  }

  // Convert fator de vencimento to actual date
  let dataVencimento = '00/00/0000';
  if (fatorVencimento !== '0000') {
    const fator = parseInt(fatorVencimento);
    const baseDate = new Date(1997, 9, 7); // October 7, 1997 (month is 0-indexed)
    const vencimentoDate = new Date(baseDate.getTime() + (fator * 24 * 60 * 60 * 1000));

    const dia = String(vencimentoDate.getDate()).padStart(2, '0');
    const mes = String(vencimentoDate.getMonth() + 1).padStart(2, '0');
    const ano = vencimentoDate.getFullYear();
    dataVencimento = `${dia}/${mes}/${ano}`;
  }

  let valorNominal = 0;
  if (valorNominalStr !== '0000000000') {
    valorNominal = parseInt(valorNominalStr) / 100;
  }

  return {
    isValid: true,
    codigoDeBarras,
    data: {
      banco,
      moeda,
      fatorVencimento,
      valor: valorNominalStr,
      campoLivre1,
      campoLivre2,
      campoLivre3,
      valorNominal,
      dataVencimento
    }
  };
}