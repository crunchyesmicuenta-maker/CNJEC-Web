import * as pdfjs from './vendor/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
const pdfUrl = 'contrato-inscripcion-2027.pdf';
const draftKey = 'cnjec-contract-2027-pdf';
const host = document.getElementById('pdf-scroll');
const stack = document.getElementById('pdf-stack');
const status = document.getElementById('enrollment-status');
const picker = document.getElementById('field-picker');
const editor = document.getElementById('active-field-editor');
const activeInput = document.getElementById('active-value');
const activeCheck = document.getElementById('active-check');
const downloadButton = document.getElementById('download-contract');
const saveButton = document.getElementById('save-draft');
const clearButton = document.getElementById('clear-contract');
const downloadLink = document.getElementById('download-ready');
const mobile = window.matchMedia('(max-width:600px)');
let fields = [], answers = {}, pdfBytes, documentPdf, pages = [], activeName = '', zoom = 1, renderVersion = 0, downloadUrl = '';
let renderTasks = [];
function message(text, error = false) { status.textContent = text; status.dataset.error = String(error); }
function fieldByName(name) { return fields.find(field => field.name === name); }
function findInput(name) { return Array.from(stack.querySelectorAll('[data-field]')).find(input => input.dataset.field === name); }
function fitText(input, field, scale) {
  if (field.type !== 'text') return;
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = '7.5px Arial';
  const width = measure.measureText(String(answers[field.name] || ' ')).width;
  input.style.fontSize = `${Math.min(7.5, Math.max(3.8, (field.width - 3) / Math.max(width, 1) * 7.5)) * scale}px`;
}
function setAnswer(name, value) {
  const field = fieldByName(name);
  if (!field) return;
  answers[name] = field.type === 'checkbox' ? Boolean(value) : String(value).slice(0,150);
  if (field.group && value) fields.filter(other => other.group === field.group && other.name !== name).forEach(other => {
    answers[other.name] = false;
    const input = findInput(other.name); if (input) input.checked = false;
  });
  const input = findInput(name);
  if (input) {
    if (field.type === 'checkbox') input.checked = Boolean(value);
    else { input.value = answers[name]; fitText(input, field, Number(input.dataset.scale)); }
  }
  if (activeName === name) {
    if (field.type === 'checkbox') activeCheck.checked = Boolean(value);
    else if (document.activeElement !== activeInput) activeInput.value = answers[name];
  }
  downloadLink.hidden = true;
}
function selectField(name, focusEditor = false, scroll = false) {
  const field = fieldByName(name); if (!field) return;
  activeName = name; picker.value = name; editor.hidden = false;
  document.getElementById('active-value-label').textContent = field.label;
  const isCheck = field.type === 'checkbox';
  activeInput.hidden = isCheck;
  document.getElementById('active-check-label').hidden = !isCheck;
  if (isCheck) activeCheck.checked = Boolean(answers[name]); else activeInput.value = answers[name] || '';
  stack.querySelectorAll('.is-selected').forEach(input => input.classList.remove('is-selected'));
  const input = findInput(name);
  if (input) { input.classList.add('is-selected'); if (scroll) input.scrollIntoView({block:'center',inline:'center',behavior:'smooth'}); }
  if (focusEditor) (isCheck ? activeCheck : activeInput).focus({preventScroll:true});
}
activeInput.addEventListener('input', () => setAnswer(activeName, activeInput.value));
activeCheck.addEventListener('change', () => setAnswer(activeName, activeCheck.checked));
picker.addEventListener('change', () => selectField(picker.value, true, true));
document.getElementById('next-field').addEventListener('click', () => {
  const index = fields.findIndex(field => field.name === activeName);
  selectField(fields[(index + 1) % fields.length].name, true, true);
});
document.getElementById('close-field').addEventListener('click', () => { editor.hidden = true; picker.focus(); });
async function renderDocument() {
  if (!documentPdf) return;
  const version = ++renderVersion;
  renderTasks.forEach(task => task.cancel()); renderTasks = [];
  const scale = Math.min(1.65, Math.max(.35,(host.clientWidth - 32) / 612)) * zoom;
  stack.replaceChildren(); stack.style.width = `${Math.max(host.clientWidth, 612 * scale + 32)}px`;
  document.getElementById('zoom-out').disabled = zoom <= 1;
  document.getElementById('zoom-in').disabled = zoom >= 3;
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const viewport = page.getViewport({scale});
    const sheet = document.createElement('section'); sheet.className = 'pdf-sheet';
    sheet.style.width = `${viewport.width}px`; sheet.style.height = `${viewport.height}px`;
    sheet.setAttribute('aria-label', `Página ${i + 1} del contrato`);
    const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden','true');
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(viewport.width * ratio); canvas.height = Math.round(viewport.height * ratio);
    sheet.append(canvas); stack.append(sheet);
    for (const field of fields.filter(item => item.page === i + 1)) {
      const input = document.createElement('input');
      input.className = 'pdf-field'; input.type = field.type === 'checkbox' ? 'checkbox' : 'text';
      input.dataset.field = field.name; input.dataset.scale = String(scale);
      input.setAttribute('aria-label',field.label); input.title = field.label; input.autocomplete = 'off';
      Object.assign(input.style,{left:`${field.x * scale}px`,top:`${field.top * scale}px`,width:`${field.width * scale}px`,height:`${field.height * scale}px`});
      if (field.type === 'checkbox') {
        input.checked = Boolean(answers[field.name]);
        input.addEventListener('change', () => { selectField(field.name); setAnswer(field.name,input.checked); });
      } else {
        input.value = answers[field.name] || ''; input.maxLength = 150; input.readOnly = mobile.matches;
        fitText(input,field,scale);
        input.addEventListener('input', () => setAnswer(field.name,input.value));
        input.addEventListener('focus', () => selectField(field.name,mobile.matches));
        input.addEventListener('click', () => selectField(field.name,mobile.matches));
      }
      if (field.name === activeName) input.classList.add('is-selected');
      sheet.append(input);
    }
    const task = page.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio === 1 ? undefined : [ratio,0,0,ratio,0,0],annotationMode:pdfjs.AnnotationMode.DISABLE});
    renderTasks.push(task);
    try { await task.promise; } catch (error) { if (error.name !== 'RenderingCancelledException') throw error; }
    if (version !== renderVersion) return;
    if (!page._cnjecText) page._cnjecText = (await page.getTextContent()).items.map(item => item.str).join(' ');
    const reading = document.createElement('p'); reading.className = 'sr-only'; reading.textContent = page._cnjecText; sheet.append(reading);
  }
}
function requestRender() { renderDocument().catch(error => message(`No se pudo mostrar el documento: ${error.message}`,true)); }
document.getElementById('zoom-in').addEventListener('click', () => { zoom = Math.min(3,zoom + .5); requestRender(); });
document.getElementById('zoom-out').addEventListener('click', () => { zoom = Math.max(1,zoom - .5); requestRender(); });
document.getElementById('zoom-fit').addEventListener('click', () => { zoom = 1; requestRender(); });
saveButton.addEventListener('click', () => {
  try { sessionStorage.setItem(draftKey,JSON.stringify(answers)); message('Borrador guardado en esta pestaña. Puedes recargarla y continuar; descarga el PDF antes de cerrarla.'); }
  catch { message('Este navegador no permite guardar el borrador. Puedes descargar el PDF para conservar los datos.',true); }
});
clearButton.addEventListener('click', () => {
  answers = {}; try { sessionStorage.removeItem(draftKey); } catch {}
  if (downloadUrl) { URL.revokeObjectURL(downloadUrl); downloadUrl = ''; }
  downloadLink.removeAttribute('href'); downloadLink.removeAttribute('download');
  editor.hidden = true; activeName = ''; picker.value = ''; downloadLink.hidden = true;
  requestRender(); message('Datos borrados del documento y del borrador de esta pestaña.');
});
downloadButton.addEventListener('click', async () => {
  downloadButton.disabled = true; message('Preparando tu PDF con los datos escritos…');
  try {
    const {PDFDocument,StandardFonts} = window.PDFLib;
    const pdf = await PDFDocument.load(pdfBytes.slice());
    const form = pdf.getForm(); const font = await pdf.embedFont(StandardFonts.Helvetica);
    for (const field of fields) {
      if (field.type === 'checkbox') { const check = form.getCheckBox(field.name); answers[field.name] ? check.check() : check.uncheck(); }
      else {
        const text = String(answers[field.name] || '').trim();
        try { font.encodeText(text); } catch { throw new Error(`Revisa «${field.label}»: usa letras, números y signos habituales, sin emojis.`); }
        const target = form.getTextField(field.name);
        const size = field.multiline ? 7 : Math.min(7.5,Math.max(3.8,(field.width - 3)/Math.max(font.widthOfTextAtSize(text || ' ',1),1)));
        target.setFontSize(size); target.setText(text);
      }
    }
    form.updateFieldAppearances(font);
    const bytes = await pdf.save();
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const name = `${answers.studentSurnames || ''}_${answers.studentNames || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
    downloadLink.href = downloadUrl; downloadLink.download = `${name || 'Estudiante'}_Contrato_Inscripcion_2027.pdf`; downloadLink.hidden = false; downloadLink.click();
    message('PDF listo con tus datos. Si el celular lo abre, usa la opción de guardar o compartir para conservarlo.');
  } catch (error) { message(error.message || 'No se pudo preparar el PDF. Inténtalo otra vez.',true); }
  finally { downloadButton.disabled = false; }
});
async function start() {
  const [response,fieldResponse] = await Promise.all([fetch(pdfUrl),fetch('contract-fields.json')]);
  if (!response.ok || !fieldResponse.ok) throw new Error('No se pudo abrir el contrato. Recarga la página o descarga el PDF editable en blanco.');
  pdfBytes = new Uint8Array(await response.arrayBuffer()); fields = await fieldResponse.json();
  try { const saved = JSON.parse(sessionStorage.getItem(draftKey) || '{}'); fields.forEach(field => { if (typeof saved[field.name] === (field.type === 'checkbox' ? 'boolean' : 'string')) answers[field.name] = field.type === 'checkbox' ? saved[field.name] : saved[field.name].slice(0,150); }); } catch {}
  fields.forEach(field => { const option = document.createElement('option'); option.value = field.name; option.textContent = `Pág. ${field.page} · ${field.label}`; picker.append(option); });
  documentPdf = await pdfjs.getDocument({data:pdfBytes.slice(),standardFontDataUrl:new URL('./vendor/standard_fonts/',import.meta.url).href,isEvalSupported:false}).promise;
  pages = await Promise.all(Array.from({length:documentPdf.numPages},(_,i) => documentPdf.getPage(i + 1)));
  await renderDocument();
  if (!window.PDFLib) throw new Error('No se pudo cargar el generador de PDF. Recarga la página.');
  [picker,downloadButton,saveButton,clearButton].forEach(control => { control.disabled = false; });
  message('Contrato abierto. Toca un espacio azul o elige «Ir a un campo» para empezar.');
  let width = host.clientWidth, timer;
  new ResizeObserver(() => { if (Math.abs(width - host.clientWidth) < 2) return; width = host.clientWidth; clearTimeout(timer); timer = setTimeout(requestRender,150); }).observe(host);
}
start().catch(error => message(error.message || 'No se pudo abrir el contrato.',true));
