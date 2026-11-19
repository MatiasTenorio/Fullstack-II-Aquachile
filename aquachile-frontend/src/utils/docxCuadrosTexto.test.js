import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { adaptarCuadrosDeTexto, aplanarDocumentXml } from './docxCuadrosTexto';

const ESPACIOS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ' +
  'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" ' +
  'xmlns:v="urn:schemas-microsoft-com:vml"';

const parrafo = (texto) => `<w:p><w:r><w:t>${texto}</w:t></w:r></w:p>`;

// Cuadro de texto flotante como lo guarda Word: formato nuevo (Choice) y antiguo (Fallback) con el mismo texto.
function cuadro(texto, distanciaVertical) {
  const contenido = `<w:txbxContent>${parrafo(texto)}</w:txbxContent>`;
  return `<w:r><mc:AlternateContent>
    <mc:Choice Requires="wps"><w:drawing><wp:anchor>
      <wp:positionH relativeFrom="margin"><wp:posOffset>0</wp:posOffset></wp:positionH>
      <wp:positionV relativeFrom="paragraph"><wp:posOffset>${distanciaVertical}</wp:posOffset></wp:positionV>
      <wps:wsp><wps:txbx>${contenido}</wps:txbx></wps:wsp>
    </wp:anchor></w:drawing></mc:Choice>
    <mc:Fallback><w:pict><v:shape style="position:absolute"><v:textbox>${contenido}</v:textbox></v:shape></w:pict></mc:Fallback>
  </mc:AlternateContent></w:r>`;
}

const documento = (cuerpo) => `<w:document ${ESPACIOS}><w:body>${cuerpo}<w:sectPr/></w:body></w:document>`;

// Textos de los párrafos del cuerpo, en orden; "[SALTO]" marca un salto de página.
function textos(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const cuerpo = doc.getElementsByTagNameNS(W, 'body')[0];
  return Array.from(cuerpo.children)
    .filter((e) => e.localName === 'p')
    .map((p) => {
      const salto = Array.from(p.getElementsByTagNameNS(W, 'br')).some((b) => b.getAttributeNS(W, 'type') === 'page');
      const texto = Array.from(p.getElementsByTagNameNS(W, 't')).map((t) => t.textContent).join('');
      return (salto ? '[SALTO]' : '') + texto;
    });
}

describe('docxCuadrosTexto', () => {
  it('no cambia un documento sin cuadros de texto', () => {
    // docxCuadrosTexto
    // Devuelve null para indicar que no hay nada que adaptar
    expect(aplanarDocumentXml(documento(parrafo('Hola')))).toBeNull();
  });

  it('saca el texto de los cuadros y lo ordena de arriba hacia abajo', () => {
    // docxCuadrosTexto
    // Los cuadros quedan como párrafos según su posición vertical, sin duplicar el formato antiguo
    const xml = documento(
      parrafo('Título') +
      `<w:p>${cuadro('Experiencia', 3000000)}${cuadro('Datos personales', 100000)}${cuadro('Arriba', -50000)}</w:p>`
    );
    const resultado = aplanarDocumentXml(xml);
    expect(resultado).not.toContain('txbxContent');
    expect(textos(resultado)).toEqual(['Título', 'Arriba', '', 'Datos personales', 'Experiencia']);
  });

  it('respeta los saltos de página dentro del párrafo que ancla los cuadros', () => {
    // docxCuadrosTexto
    // Los cuadros anclados después del salto quedan en la página siguiente, aunque estén un poco más arriba
    const xml = documento(
      `<w:p>${cuadro('Página 1', 200000)}<w:r><w:br w:type="page"/></w:r>${cuadro('Página 2 abajo', 500000)}${cuadro('Página 2 título', -30000)}</w:p>`
    );
    expect(textos(aplanarDocumentXml(xml))).toEqual(['', 'Página 1', '[SALTO]', 'Página 2 título', 'Página 2 abajo']);
  });

  it('adapta el archivo .docx completo', async () => {
    // docxCuadrosTexto
    // Devuelve un archivo nuevo marcado como adaptado, con el texto del cuadro como párrafo normal
    const zip = new JSZip();
    zip.file('word/document.xml', documento(`<w:p>${cuadro('Contenido', 0)}</w:p>`));
    const original = await zip.generateAsync({ type: 'blob' });

    const { blob, adaptado } = await adaptarCuadrosDeTexto(original);
    expect(adaptado).toBe(true);
    const xml = await (await JSZip.loadAsync(blob)).file('word/document.xml').async('string');
    expect(textos(xml)).toEqual(['', 'Contenido']);
  });

  it('devuelve el archivo original si no es un .docx válido', async () => {
    // docxCuadrosTexto
    // Ante un archivo dañado no falla: deja que el visor muestre su propio error
    const roto = new Blob(['no es un zip']);
    const { blob, adaptado } = await adaptarCuadrosDeTexto(roto);
    expect(adaptado).toBe(false);
    expect(blob).toBe(roto);
  });
});
