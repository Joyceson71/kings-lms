// Shared utility functions

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const reverseString = (s: string) => s.split('').reverse().join('');

export const isEven = (n: number) => n % 2 === 0;

export const isOdd = (n: number) => n % 2 !== 0;

export const sumArray = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

