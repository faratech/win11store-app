import React from 'react'
import { Check } from 'lucide-react'

interface ComparisonRow {
  feature: string
  home: boolean
  pro: boolean
  m365: boolean
}

const rows: ComparisonRow[] = [
  { feature: 'Windows 11 Operating System', home: true, pro: true, m365: false },
  { feature: 'Office Apps (Word, Excel, PowerPoint)', home: false, pro: false, m365: true },
  { feature: '1TB OneDrive Cloud Storage', home: false, pro: false, m365: true },
  { feature: 'Outlook Premium Email', home: false, pro: false, m365: true },
  { feature: 'Microsoft Defender Advanced', home: false, pro: false, m365: true },
  { feature: 'BitLocker Encryption', home: false, pro: true, m365: false },
  { feature: 'Remote Desktop Host', home: false, pro: true, m365: false },
  { feature: 'Hyper-V Virtualization', home: false, pro: true, m365: false },
  { feature: 'Direct Microsoft Support', home: false, pro: false, m365: true },
  { feature: 'Works on Multiple Devices', home: false, pro: false, m365: true },
  { feature: 'Annual Updates Included', home: false, pro: false, m365: true },
  { feature: 'One-time Purchase', home: true, pro: true, m365: false },
]

const Cell: React.FC<{ on: boolean }> = ({ on }) => (
  <td className="p-3 text-center">
    {on ? (
      <Check className="mx-auto h-5 w-5 text-accent" aria-label="Included" />
    ) : (
      <span className="text-muted" aria-label="Not included">—</span>
    )}
  </td>
)

const ComparisonTable: React.FC = () => (
  <div className="overflow-x-auto rounded-lg border border-edge bg-panel shadow-[var(--shadow-depth)]">
    <table className="w-full min-w-[560px] text-sm">
      <caption className="sr-only">Feature comparison of Windows 11 Home, Windows 11 Pro, and Microsoft 365</caption>
      <thead>
        <tr className="border-b border-edge bg-panel-alt text-left">
          <th scope="col" className="p-3 font-semibold text-ink">Feature</th>
          <th scope="col" className="p-3 text-center font-semibold text-ink">Windows 11 Home</th>
          <th scope="col" className="p-3 text-center font-semibold text-ink">Windows 11 Pro</th>
          <th scope="col" className="p-3 text-center font-semibold text-ink">Microsoft 365</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row.feature} className={idx % 2 === 1 ? 'bg-panel-alt/60' : undefined}>
            <th scope="row" className="p-3 text-left font-medium text-ink2">{row.feature}</th>
            <Cell on={row.home} />
            <Cell on={row.pro} />
            <Cell on={row.m365} />
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default ComparisonTable
