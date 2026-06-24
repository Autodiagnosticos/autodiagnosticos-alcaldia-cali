/**
 * ============================================================
 *  GOOGLE APPS SCRIPT — Receptor de Autodiagnósticos
 *  Alcaldía de Santiago de Cali · Control Interno
 * ============================================================
 *
 *  INSTRUCCIONES DE INSTALACIÓN (5 pasos):
 *
 *  1. Abrir Google Sheets → crear una hoja nueva → nombrarla
 *     "Respuestas" (o la que prefieras).
 *
 *  2. En el menú Extensiones → Apps Script → pegar TODO este código.
 *
 *  3. En la línea SHEET_ID (abajo), reemplazar el texto con el ID
 *     de tu Google Sheet. El ID está en la URL:
 *     https://docs.google.com/spreadsheets/d/ [ESTE_ES_EL_ID] /edit
 *
 *  4. Clic en Implementar → Nueva implementación:
 *       - Tipo: Aplicación web
 *       - Ejecutar como: Yo (tu cuenta)
 *       - Quién puede acceder: Cualquier usuario
 *     → Copiar la URL que te genera → pegarla en cada HTML
 *       donde dice: 'REEMPLAZAR_CON_URL_DE_APPS_SCRIPT'
 *
 *  5. ¡Listo! Cada vez que alguien guarde un autodiagnóstico,
 *     aparecerá una nueva fila en tu Google Sheet.
 * ============================================================
 */

// ⬇ REEMPLAZA CON EL ID DE TU GOOGLE SHEET ⬇
const SHEET_ID = 'PEGA_AQUI_EL_ID_DE_TU_GOOGLE_SHEET';
const SHEET_NAME = 'Respuestas'; // nombre de la pestaña

// Columnas del encabezado
const HEADERS = [
  'Fecha de Envío',
  'Nombre Funcionario',
  'Dependencia / Área',
  'Vigencia',
  'Tipo Autodiagnóstico',
  'Puntaje Total',
  'Opciones Seleccionadas',
  'Ítems a Priorizar',
  'Detalle Respuestas (JSON)'
];

/**
 * Maneja las peticiones POST desde los formularios HTML.
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Crear hoja si no existe
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Escribir encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      // Estilo del encabezado
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setBackground('#0B2B5C');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);
      sheet.setFrozenRows(1);
    }

    // Detectar tipo de autodiagnóstico desde las preguntas
    let tipo = 'Desconocido';
    if (payload.respuestas && payload.respuestas.length > 0) {
      const primerCodigo = payload.respuestas[0].codigo || '';
      const match = primerCodigo.match(/^([A-Z]+)/);
      if (match) tipo = match[1];
    }

    // Preparar fila
    const fechaEnvio = payload.fecha_envio
      ? new Date(payload.fecha_envio).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
      : new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

    const fila = [
      fechaEnvio,
      payload.nombre_funcionario || '',
      payload.dependencia || '',
      payload.vigencia || '',
      tipo,
      payload.puntaje_total || 0,
      payload.total_seleccionadas || 0,
      payload.a_priorizar || 0,
      JSON.stringify(payload.respuestas || [])
    ];

    sheet.appendRow(fila);

    // Ajustar anchos de columna (solo primera vez — filas <= 2)
    if (sheet.getLastRow() <= 2) {
      sheet.setColumnWidth(1, 160); // Fecha
      sheet.setColumnWidth(2, 200); // Nombre
      sheet.setColumnWidth(3, 200); // Dependencia
      sheet.setColumnWidth(4, 80);  // Vigencia
      sheet.setColumnWidth(5, 80);  // Tipo
      sheet.setColumnWidth(6, 90);  // Puntaje
      sheet.setColumnWidth(7, 100); // Seleccionadas
      sheet.setColumnWidth(8, 90);  // Priorizar
      sheet.setColumnWidth(9, 300); // JSON
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', mensaje: 'Datos guardados correctamente.' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('ERROR doPost: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', mensaje: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Maneja peticiones GET (prueba de conectividad).
 */
function doGet(e) {
  return ContentService
    .createTextOutput('✅ Apps Script activo — Receptor de Autodiagnósticos Alcaldía de Cali.')
    .setMimeType(ContentService.MimeType.TEXT);
}
