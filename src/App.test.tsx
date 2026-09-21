import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('renders the Phase 1 scaffold placeholder', () => {
    render(<App />)

    expect(screen.getByText('TorqueTrack Diesel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scaffold ready/i })).toBeInTheDocument()
  })
})
