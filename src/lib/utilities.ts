// Shared utility functions

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const reverseString = (s: string) => s.split('').reverse().join('');

export const isEven = (n: number) => n % 2 === 0;

export const isOdd = (n: number) => n % 2 !== 0;

export const sumArray = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

export const averageArray = (arr: number[]) => arr.length ? sumArray(arr) / arr.length : 0;

export const maxInArray = (arr: number[]) => Math.max(...arr);

export const minInArray = (arr: number[]) => Math.min(...arr);

export const removeDuplicates = <T>(arr: T[]): T[] => Array.from(new Set(arr));

export const isEmpty = (obj: any) => Object.keys(obj).length === 0;

export const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

export const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const kebabCase = (str: string) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

export const camelCase = (str: string) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

export const chunkArray = <T>(arr: T[], size: number): T[][] => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

export const shuffleArray = <T>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5);

export const truncateString = (str: string, num: number) => str.length > num ? str.slice(0, num > 3 ? num - 3 : num) + '...' : str;

export const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const isString = (val: any) => typeof val === 'string';

export const isNumber = (val: any) => typeof val === 'number' && !isNaN(val);

export const isBoolean = (val: any) => typeof val === 'boolean';

export const isFunction = (val: any) => typeof val === 'function';

export const isArray = (val: any) => Array.isArray(val);

export const isObject = (val: any) => val !== null && typeof val === 'object' && !Array.isArray(val);

export const isNull = (val: any) => val === null;

