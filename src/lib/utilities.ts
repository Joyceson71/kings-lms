// Shared utility functions

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const reverseString = (s: string) => s.split('').reverse().join('');

export const isEven = (n: number) => n % 2 === 0;

export const isOdd = (n: number) => n % 2 !== 0;

export const sumArray = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

export const averageArray = (arr: number[]) => arr.length ? sumArray(arr) / arr.length : 0;

export const maxInArray = (arr: number[]) => Math.max(...arr);

export const minInArray = (arr: number[]) => Math.min(...arr);

