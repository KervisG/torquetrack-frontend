// El navegador bloquea abrir un data URL como página, así que "Open" lo
// convierte a un Blob URL en el click. La descarga sí funciona con el data URL.
function openCertificate(dataUrl: string): void {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl)
  if (!match) return
  const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: match[1] }))
  window.open(url, '_blank', 'noopener')
  // La pestaña nueva ya cargó el archivo; se libera la memoria del Blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function CertificateLinks({ name, dataUrl }: { name: string; dataUrl: string }) {
  const fileName = name || 'tax-exemption-certificate'

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <button
        type="button"
        className="underline underline-offset-4"
        onClick={() => openCertificate(dataUrl)}
      >
        Open certificate
      </button>
      <a href={dataUrl} download={fileName} className="underline underline-offset-4">
        Download {fileName}
      </a>
    </div>
  )
}
