import React from 'react'
import { AlertCircle } from 'lucide-react'

const requirements = [
  { label: 'Processor', value: '1 GHz or faster, 2+ cores, 64-bit compatible' },
  { label: 'RAM', value: '4 GB minimum (8 GB recommended)' },
  { label: 'Storage', value: '64 GB or larger storage device' },
  { label: 'Display', value: 'HD display (720p), 9" or greater diagonal' },
  { label: 'Graphics', value: 'DirectX 12 compatible graphics / WDDM 2.x' },
  { label: 'Firmware', value: 'UEFI, Secure Boot capable' },
  { label: 'TPM', value: 'Trusted Platform Module (TPM) version 2.0' },
  { label: 'Internet', value: 'Internet connection for setup and updates' },
]

const SystemRequirements: React.FC = () => (
  <div className="rounded-lg border border-edge bg-panel p-6 shadow-[var(--shadow-depth)]">
    <h3 className="mb-4 text-lg font-semibold font-display text-ink">
      Windows 11 system requirements
    </h3>
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {requirements.map(req => (
        <div key={req.label} className="flex gap-2 text-sm">
          <dt className="shrink-0 font-semibold text-ink">{req.label}:</dt>
          <dd className="text-ink2">{req.value}</dd>
        </div>
      ))}
    </dl>
    <p className="mt-5 flex items-start gap-2 rounded-md bg-accent-soft p-3 text-sm text-ink2">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <span>
        Windows 11 has stricter hardware requirements than Windows 10 — verify TPM 2.0
        and Secure Boot before buying a license for an older PC. Unsure? Ask in the forum.
      </span>
    </p>
  </div>
)

export default SystemRequirements
