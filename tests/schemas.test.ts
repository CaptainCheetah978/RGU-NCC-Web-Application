import { describe, it, expect } from 'vitest'
import { CreateCadetSchema } from '../src/lib/schemas'

describe('CreateCadetSchema Validation', () => {
  it('should validate a correct cadet object', () => {
    const validCadet = {
      name: 'Aditya Singh',
      regimentalNumber: 'AS21SDA123456',
      rank: 'SUO',
      wing: 'Army',
      gender: 'Male',
      unitNumber: '30',
      unitName: 'Assam Bn NCC',
      enrollmentYear: 2021,
      bloodGroup: 'B+',
      pin: '1234'
    }
    const result = CreateCadetSchema.safeParse(validCadet)
    if (!result.success) {
      console.error(result.error)
    }
    expect(result.success).toBe(true)
  })

  it('should reject a cadet object with missing required fields', () => {
    const invalidCadet = {
      name: 'Aditya Singh'
      // missing regimentalNumber, rank, etc.
    }
    const result = CreateCadetSchema.safeParse(invalidCadet)
    expect(result.success).toBe(false)
  })

  it('should reject invalid blood groups', () => {
    const invalidBlood = {
      name: 'Aditya Singh',
      regimentalNumber: 'AS21SDA123456',
      rank: 'SUO',
      wing: 'Army',
      gender: 'Male',
      unitNumber: '30',
      unitName: 'Assam Bn NCC',
      enrollmentYear: 2021,
      bloodGroup: 'X-', // Invalid
      pin: '1234'
    }
    const result = CreateCadetSchema.safeParse(invalidBlood)
    expect(result.success).toBe(false)
  })
})
