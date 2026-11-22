import * as React from 'react';

export interface MoneyDisplayProps {
  amountMinor: number;
  currency?: string;
  className?: string;
  showDecimals?: boolean;
}

/**
 * Renders minor paise currency representations strictly without floating-point errors.
 * Example: 149900 minor paise -> ₹1,499.00 or ₹1,499
 */
export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amountMinor,
  currency = 'INR',
  className = '',
  showDecimals = true,
}) => {
  const isNegative = amountMinor < 0;
  const absMinor = Math.abs(amountMinor);
  const major = Math.floor(absMinor / 100);
  const minor = absMinor % 100;

  // Format integer major part using Indian numbering convention (lakh/crore)
  const majorFormatted = major.toLocaleString('en-IN');
  const minorFormatted = minor.toString().padStart(2, '0');

  const symbol = currency === 'INR' ? '₹' : `${currency} `;

  return (
    <span className={`inline-flex items-baseline font-medium ${className}`}>
      {isNegative && '-'}
      <span>{symbol}</span>
      <span>{majorFormatted}</span>
      {showDecimals && <span className="text-[0.85em] opacity-80">.{minorFormatted}</span>}
    </span>
  );
};
