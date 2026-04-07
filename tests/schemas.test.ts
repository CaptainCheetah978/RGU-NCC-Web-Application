import { describe, it, expect } from 'vitest'
import { CreateCadetSchema } from '../src/lib/schemas'

describe('CreateCadetSchema Validation', () => {
  it('should validate a correct cadet object', () => {
    const validCadet = {
      name: 'Aditya Singh',
      regimentalNumber: 'AS21SDA123456',
      rank: 'CSUO',
      wing: 'Army',
      gender: 'SD',
      unitNumber: '30',
      unitName: 'Assam Bn NCC',
      enrollmentYear: 2021,
      bloodGroup: 'B+',
      pin: 'A92B'
    }
    const result = CreateCadetSchema.safeParse(validCadet)
    if (!result.success) {
      console.error(result.error)
    }
    expect(result.success).toBe(true)
  })

  it('should reject a weak or common PIN', () => {
    const cadetWithWeakPin = {
      name: 'Aditya Singh',
      regimentalNumber: 'AS21SDA123456',
      rank: 'CSUO',
      wing: 'Army',
      gender: 'SD',
      unitNumber: '30',
      unitName: 'Assam Bn NCC',
      enrollmentYear: 2021,
      bloodGroup: 'B+',
      pin: '1234' // Blacklisted!
    }
    const result = CreateCadetSchema.safeParse(cadetWithWeakPin)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("too common and insecure")
    }
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
      rank: 'CSUO',
      wing: 'Army',
      gender: 'SD',
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
