/**
 * Utilidades para procesamiento y compresión de tickets e imágenes en el cliente
 */

export async function processFileForUpload(file: File): Promise<{
  nombre: string;
  tipo: string;
  dataUrl: string;
  tamanoBytes: number;
}> {
  return new Promise((resolve, reject) => {
    // Si es un archivo PDF, lo leemos directamente sin procesar como imagen
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          nombre: file.name,
          tipo: file.type,
          dataUrl: reader.result as string,
          tamanoBytes: file.size,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // Para imágenes, comprimimos suavemente en un canvas para optimizar almacenamiento
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            nombre: file.name,
            tipo: file.type,
            dataUrl: e.target?.result as string,
            tamanoBytes: file.size,
          });
          return;
        }

        // Fondo blanco para prevenir transparencias negras en PNGs convertidos a JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Calidad 0.82 proporciona excelente nitidez para texto contable ocupando solo ~80-150KB
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve({
          nombre: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
          tipo: 'image/jpeg',
          dataUrl: compressedDataUrl,
          tamanoBytes: Math.round(compressedDataUrl.length * 0.75),
        });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes?: number): string {
  if (!bytes) return '0 KB';
  const k = 1024;
  if (bytes < k) return bytes + ' B';
  if (bytes < k * k) return (bytes / k).toFixed(1) + ' KB';
  return (bytes / (k * k)).toFixed(2) + ' MB';
}

/**
 * Genera un comprobante visual SVG en Data URL para los datos iniciales de ejemplo
 */
export function createSampleReceiptDataUrl(
  proveedor: string,
  cif: string,
  concepto: string,
  total: number,
  fecha: string,
  tipo: 'Ticket' | 'Factura'
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background:#ffffff; font-family: 'Courier New', Courier, monospace;">
      <defs>
        <pattern id="zigzag" x="0" y="0" width="20" height="12" patternUnits="userSpaceOnUse">
          <path d="M 0,0 L 10,12 L 20,0 Z" fill="#f8fafc" />
        </pattern>
      </defs>
      
      <!-- Fondo papel ticket -->
      <rect width="600" height="800" fill="#fbfbfa"/>
      <rect x="25" y="25" width="550" height="750" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
      
      <!-- Cabecera -->
      <g fill="#0f172a" text-anchor="middle">
        <text x="300" y="80" font-size="24" font-weight="bold" letter-spacing="2">${escapeXml(proveedor.toUpperCase())}</text>
        <text x="300" y="110" font-size="14" fill="#64748b">NIF/CIF: ${escapeXml(cif)}</text>
        <text x="300" y="130" font-size="12" fill="#94a3b8">C/ Principal, 42 - 28001 Madrid</text>
        <text x="300" y="150" font-size="12" fill="#94a3b8">Tel: 91 555 01 99 · info@proveedor.es</text>
      </g>
      
      <!-- Línea divisoria -->
      <line x1="50" y1="180" x2="550" y2="180" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6,4"/>
      
      <!-- Datos documento -->
      <g fill="#334155" font-size="14">
        <text x="60" y="215"><tspan font-weight="bold">DOCUMENTO:</tspan> ${tipo.toUpperCase()}</text>
        <text x="60" y="240"><tspan font-weight="bold">FECHA:</tspan> ${fecha}</text>
        <text x="360" y="215"><tspan font-weight="bold">Nº DOC:</tspan> FT-${Math.floor(Math.random() * 89999 + 10000)}</text>
        <text x="360" y="240"><tspan font-weight="bold">HORA:</tspan> 14:32</text>
      </g>
      
      <!-- Línea divisoria -->
      <line x1="50" y1="270" x2="550" y2="270" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6,4"/>
      
      <!-- Cabecera tabla -->
      <g fill="#64748b" font-size="13" font-weight="bold">
        <text x="60" y="300">DESCRIPCIÓN</text>
        <text x="350" y="300" text-anchor="end">CANT.</text>
        <text x="540" y="300" text-anchor="end">TOTAL EUR</text>
      </g>
      <line x1="50" y1="315" x2="550" y2="315" stroke="#e2e8f0" stroke-width="1"/>
      
      <!-- Línea de producto -->
      <g fill="#0f172a" font-size="15">
        <text x="60" y="350">${escapeXml(concepto)}</text>
        <text x="350" y="350" text-anchor="end">1.00</text>
        <text x="540" y="350" text-anchor="end">${total.toFixed(2)} €</text>
      </g>
      
      <!-- Separador sumatorio -->
      <line x1="50" y1="420" x2="550" y2="420" stroke="#cbd5e1" stroke-width="1.5"/>
      
      <!-- Totales e Impuestos -->
      <g fill="#334155" font-size="14">
        <text x="320" y="460">BASE IMPONIBLE:</text>
        <text x="540" y="460" text-anchor="end">${(total / 1.21).toFixed(2)} €</text>
        
        <text x="320" y="490">IVA (21% / 10%):</text>
        <text x="540" y="490" text-anchor="end">${(total - (total / 1.21)).toFixed(2)} €</text>
      </g>
      
      <line x1="300" y1="520" x2="550" y2="520" stroke="#0f172a" stroke-width="2"/>
      
      <!-- Total Final -->
      <g fill="#0f172a">
        <text x="300" y="560" font-size="20" font-weight="bold">TOTAL A PAGAR:</text>
        <text x="540" y="560" font-size="24" font-weight="bold" text-anchor="end">${total.toFixed(2)} €</text>
      </g>
      
      <!-- Pie de ticket -->
      <g fill="#64748b" font-size="12" text-anchor="middle">
        <text x="300" y="650">FORMA DE PAGO: TARJETA / EFECTIVO</text>
        <text x="300" y="675">*** GRACIAS POR SU VISITA ***</text>
        <text x="300" y="700">Documento justificativo contable</text>
        
        <!-- Código de barras simulado -->
        <rect x="180" y="720" width="4" height="30" fill="#334155"/>
        <rect x="190" y="720" width="8" height="30" fill="#334155"/>
        <rect x="204" y="720" width="3" height="30" fill="#334155"/>
        <rect x="212" y="720" width="6" height="30" fill="#334155"/>
        <rect x="225" y="720" width="4" height="30" fill="#334155"/>
        <rect x="235" y="720" width="10" height="30" fill="#334155"/>
        <rect x="250" y="720" width="5" height="30" fill="#334155"/>
        <rect x="260" y="720" width="3" height="30" fill="#334155"/>
        <rect x="270" y="720" width="7" height="30" fill="#334155"/>
        <rect x="282" y="720" width="4" height="30" fill="#334155"/>
        <rect x="295" y="720" width="8" height="30" fill="#334155"/>
        <rect x="310" y="720" width="3" height="30" fill="#334155"/>
        <rect x="320" y="720" width="9" height="30" fill="#334155"/>
        <rect x="335" y="720" width="5" height="30" fill="#334155"/>
        <rect x="345" y="720" width="3" height="30" fill="#334155"/>
        <rect x="355" y="720" width="7" height="30" fill="#334155"/>
        <rect x="370" y="720" width="5" height="30" fill="#334155"/>
        <rect x="382" y="720" width="8" height="30" fill="#334155"/>
        <rect x="395" y="720" width="4" height="30" fill="#334155"/>
        <rect x="405" y="720" width="6" height="30" fill="#334155"/>
        <rect x="415" y="720" width="5" height="30" fill="#334155"/>
      </g>
    </svg>
  `.trim();

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
