import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AttendanceExport } from '../src/components/attendance/export-button'
import { PdfExportButton } from '../src/components/attendance/pdf-export-button'
import React from 'react'
import { Role, Wing, Gender, ClassSession } from '../src/types'

// --- MOCKS ---

// Use a class for jsPDF to avoid Vitest vi.fn() complaining about instantiation
vi.mock('jspdf', () => {
  return {
    jsPDF: class {
      setFontSize() {}
      setTextColor() {}
      text() {}
      save() {}
      internal = { pageSize: { height: 297, getHeight: () => 297 } }
    }
  }
})

vi.mock('jspdf-autotable', () => ({
  default: vi.fn()
}))

describe('Export Components', () => {
  const mockClassSession: ClassSession = {
    id: 'class-1',
    title: 'Drill Test',
    date: '2026-03-22',
    time: '08:00',
    instructorId: 'inst-1',
    description: 'Test session',
    attendees: ['cadet-1']
  }

  const mockCadets = [
    {
      id: 'cadet-1',
      name: 'John Doe',
      regimentalNumber: 'AS20SDA123456',
      role: Role.CADET,
      rank: Role.CADET,
      wing: Wing.ARMY,
      gender: Gender.MALE,
      unitNumber: '30',
      unitName: 'Assam BN',
      enrollmentYear: 2026,
      bloodGroup: 'O+',
      status: 'active' as const
    }
  ]

  const mockAttendance = [
    {
      id: 'att-1',
      classId: 'class-1',
      cadetId: 'cadet-1',
      status: 'PRESENT' as const,
      timestamp: '2026-03-22T08:00:00.000Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock URL.createObjectURL and document link operations
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    
    // Safety check in case JSDOM doesn't support it perfectly
    if (typeof HTMLAnchorElement !== 'undefined' && HTMLAnchorElement.prototype) {
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('AttendanceExport (CSV)', () => {
    it('disables button when no class session is provided', () => {
      render(
        <AttendanceExport 
          cadets={mockCadets} 
          attendance={mockAttendance} 
        />
      )
      
      const btn = screen.getByRole('button', { name: /Export CSV/i })
      expect(btn).toBeDisabled()
    })

    it('triggers CSV download when clicked', () => {
      render(
        <AttendanceExport 
          classSession={mockClassSession}
          cadets={mockCadets} 
          attendance={mockAttendance} 
        />
      )
      
      const btn = screen.getByRole('button', { name: /Export CSV/i })
      expect(btn).not.toBeDisabled()
      
      fireEvent.click(btn)
    })
  })

  describe('PdfExportButton', () => {
    it('disables button when no class session is provided', () => {
      render(
        <PdfExportButton 
          cadets={mockCadets} 
          attendance={mockAttendance} 
        />
      )
      
      const btn = screen.getByRole('button', { name: /Export PDF/i })
      expect(btn).toBeDisabled()
    })

    it('generates and saves PDF when clicked', () => {
      render(
        <PdfExportButton 
          classSession={mockClassSession}
          cadets={mockCadets} 
          attendance={mockAttendance} 
        />
      )
      
      const btn = screen.getByRole('button', { name: /Export PDF/i })
      expect(btn).not.toBeDisabled()
      
      fireEvent.click(btn)
    })
  })
})
