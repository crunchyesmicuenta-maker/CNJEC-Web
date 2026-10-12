(() => {
  const form = document.getElementById('enrollment-form');
  const button = document.getElementById('download-contract');
  const status = document.getElementById('enrollment-status');
  const templateUrl = 'Contrato_Inscripcion_Editable_Colegio_Juan_Eudoro_Caceres_2027.docx';
  const wordNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  function dateParts(raw) {
    if (!raw) return ['', ''];
    const date = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(date.getTime())) return ['', ''];
    return [String(date.getDate()), new Intl.DateTimeFormat('es-PY', { month: 'long' }).format(date)];
  }

  function setParagraph(paragraphs, index, text) {
    const paragraph = paragraphs[index];
    const textNodes = Array.from(paragraph?.getElementsByTagNameNS(wordNs, 't') || []);
    if (!textNodes.length) throw new Error('No se encontró un campo esperado dentro del contrato.');
    textNodes[0].textContent = text;
    textNodes[0].setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    textNodes.slice(1).forEach(node => { node.textContent = ''; });
  }

  function fillBlanks(paragraphs, index, values) {
    const paragraph = paragraphs[index];
    const textNodes = Array.from(paragraph?.getElementsByTagNameNS(wordNs, 't') || []);
    let next = 0;
    for (const node of textNodes) {
      node.textContent = node.textContent.replace(/_{2,}/g, blank => {
        const replacement = String(values[next] ?? '').trim();
        next += 1;
        return replacement || blank;
      });
      node.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    }
  }

  function applyAnswers(xml, answers) {
    const paragraphs = Array.from(xml.getElementsByTagNameNS(wordNs, 'p'));
    const [contractDay, contractMonth] = dateParts(answers.signedDate);
    fillBlanks(paragraphs, 11, [contractDay, contractMonth, '2027']);

    fillBlanks(paragraphs, 13, [answers.fatherName, answers.fatherId]);
    setParagraph(paragraphs, 14, `Lugar de trabajo: ${answers.fatherWork || '__________________'}   Teléfono: ${answers.fatherPhone || '__________________'}`);
    fillBlanks(paragraphs, 15, [answers.motherName, answers.motherId]);
    setParagraph(paragraphs, 16, `Lugar de trabajo: ${answers.motherWork || '__________________'}   Teléfono: ${answers.motherPhone || '__________________'}`);
    fillBlanks(paragraphs, 17, [answers.guardianName, answers.guardianId]);
    setParagraph(paragraphs, 18, `Lugar de trabajo: ${answers.guardianWork || '__________________'}   Teléfono: ${answers.guardianPhone || '__________________'}`);
    setParagraph(paragraphs, 19, `Domicilio de la persona con quien vive el/la alumno/a: ${answers.homeAdultAddress || '__________________'}   Parentesco: ${answers.homeAdultRelation || '__________________'}`);
    fillBlanks(paragraphs, 20, [answers.familyNeighborhood]);
    fillBlanks(paragraphs, 21, [answers.familyCity, answers.civilStatus]);
    fillBlanks(paragraphs, 22, [answers.profession]);
    fillBlanks(paragraphs, 23, [answers.familyWork]);
    fillBlanks(paragraphs, 24, [answers.familyPhone, answers.familyCell]);
    fillBlanks(paragraphs, 25, [answers.email]);

    fillBlanks(paragraphs, 28, [answers.studentSurnames]);
    fillBlanks(paragraphs, 29, [answers.studentNames]);
    fillBlanks(paragraphs, 30, [answers.studentAge, answers.studentId]);
    const [birthDay, birthMonth] = dateParts(answers.birthDate);
    const birthYear = answers.birthDate ? new Date(`${answers.birthDate}T12:00:00`).getFullYear() : '';
    fillBlanks(paragraphs, 31, [birthDay && birthMonth ? `${birthDay} de ${birthMonth} de ${birthYear}` : '', answers.nationality]);
    fillBlanks(paragraphs, 32, [answers.birthPlace]);
    fillBlanks(paragraphs, 33, [answers.studentAddress, answers.studentNeighborhood]);
    fillBlanks(paragraphs, 34, [answers.studentCell]);
    fillBlanks(paragraphs, 35, [answers.grade, answers.emphasis]);
    setParagraph(paragraphs, 36, `Turno: ${answers.shift}   Adecuación: ${answers.adaptation}   Documentos presentados: ${answers.documents}`);
    const currentStudent = answers.studentStatus === 'current';
    setParagraph(paragraphs, 38, `Ya es alumno/a: ${currentStudent ? 'SÍ (X)' : 'NO'}     Alumno/a nuevo/a: ${currentStudent ? 'NO' : 'SÍ (X)'}`);

    fillBlanks(paragraphs, 76, [answers.signFatherId, answers.signFatherName]);
    fillBlanks(paragraphs, 77, [answers.signMotherId, answers.signMotherName]);
    fillBlanks(paragraphs, 78, [answers.signGuardianId, answers.signGuardianName, answers.emergencyContact, answers.emergencyPhone]);
    const [signedDay, signedMonth] = dateParts(answers.signedDate);
    setParagraph(paragraphs, 80, `Asunción, ${signedDay || '__________'} de ${signedMonth || '__________________'} de 2027.`);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!window.JSZip) {
      status.dataset.error = 'true';
      status.textContent = 'No se pudo cargar el generador del contrato. Comprueba tu conexión e inténtalo otra vez.';
      return;
    }

    button.disabled = true;
    status.removeAttribute('data-error');
    status.textContent = 'Preparando tu copia del contrato…';
    try {
      const response = await fetch(templateUrl);
      if (!response.ok) throw new Error('No se pudo abrir el contrato original.');
      const zip = await JSZip.loadAsync(await response.arrayBuffer());
      const documentFile = zip.file('word/document.xml');
      if (!documentFile) throw new Error('El archivo original no contiene el documento esperado.');
      const xmlText = await documentFile.async('string');
      const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
      if (xml.querySelector('parsererror')) throw new Error('No se pudo leer el contrato original.');

      const answers = Object.fromEntries(new FormData(form).entries());
      answers.signFatherId ||= answers.fatherId;
      answers.signFatherName ||= answers.fatherName;
      answers.signMotherId ||= answers.motherId;
      answers.signMotherName ||= answers.motherName;
      answers.signGuardianId ||= answers.guardianId;
      answers.signGuardianName ||= answers.guardianName;
      applyAnswers(xml, answers);
      zip.file('word/document.xml', new XMLSerializer().serializeToString(xml));
      const file = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const fileUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      const safeName = `${answers.studentSurnames}_${answers.studentNames}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_|_$/g, '');
      link.href = fileUrl;
      link.download = `${safeName || 'Estudiante'}_Contrato_Inscripcion_2027.docx`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(fileUrl), 30000);
      status.textContent = 'Contrato listo. Guarda la copia descargada, imprímela y firma donde corresponda.';
    } catch (error) {
      status.dataset.error = 'true';
      status.textContent = `${error.message || 'No se pudo preparar el contrato.'} Puedes volver a intentarlo.`;
    } finally {
      button.disabled = false;
    }
  });

  form.addEventListener('reset', () => {
    status.removeAttribute('data-error');
    status.textContent = 'Formulario limpio. Los datos anteriores no se guardan en esta página.';
  });
})();
