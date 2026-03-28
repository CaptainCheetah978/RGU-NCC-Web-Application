import { describe, it, expect } from 'vitest'
import { getColorOfTheDay, generateUuid } from '../src/lib/utils'

describe('getColorOfTheDay', () => {
  it('should return an object with name and hex properties', () => {
    const color = getColorOfTheDay();
    expect(color).toHaveProperty('name');
    expect(color).toHaveProperty('hex');
    expect(typeof color.name).toBe('string');
    expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should return the same color when called twice on the same day', () => {
    const first = getColorOfTheDay();
    const second = getColorOfTheDay();
    expect(first.hex).toBe(second.hex);
    expect(first.name).toBe(second.name);
  });
});

describe('generateUuid', () => {
  it('should return a valid UUID string', () => {
    const uuid = generateUuid();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
