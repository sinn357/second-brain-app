'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { toast } from 'sonner'

interface ExportPdfButtonProps {
  noteTitle: string
  contentElementId?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function ExportPdfButton({
  noteTitle,
  contentElementId = 'note-content',
  className,
  variant = 'outline',
  size = 'sm',
}: ExportPdfButtonProps) {
  const handleExport = () => {
    const source = document.getElementById(contentElementId)
    if (!source) {
      toast.error('내보낼 노트 콘텐츠를 찾지 못했습니다.')
      return
    }

    const printWindow = window.open('', '_blank', 'width=1024,height=768')
    if (!printWindow) {
      toast.error('팝업이 차단되어 PDF 내보내기를 시작할 수 없습니다.')
      return
    }

    const title = noteTitle?.trim() || 'note'
    const safeTitle = escapeHtml(title)
    const contentHtml = source.innerHTML

    printWindow.document.write(`
      <!doctype html>
      <html lang="ko">
        <head>
          <meta charset="utf-8" />
          <title>${safeTitle}</title>
          <style>
            body {
              margin: 24px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              line-height: 1.65;
              color: #0f172a;
            }
            h1, h2, h3, h4, h5, h6 {
              margin-top: 1.25em;
              margin-bottom: 0.55em;
            }
            pre {
              background: #0f172a;
              color: #e2e8f0;
              border-radius: 8px;
              padding: 12px 16px;
              overflow: auto;
            }
            code {
              background: rgba(15, 23, 42, 0.08);
              padding: 1px 4px;
              border-radius: 4px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 6px 8px;
              text-align: left;
            }
            @media print {
              body {
                margin: 12mm;
              }
            }
          </style>
        </head>
        <body>
          <article>${contentHtml}</article>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 200)
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={handleExport} className={className}>
      <FileDown className="h-4 w-4 mr-1" />
      PDF
    </Button>
  )
}
