/* ============================================================
   Subida de fotos y videos de la boda -> carpeta de Google Drive
   1) Pega los ID de tus carpetas (fotos y videos) abajo
   2) Ejecuta la función "autorizar" una vez
   3) Implementar > Nueva implementación > Aplicación web
      (Ejecutar como: Yo · Quién tiene acceso: Cualquier persona)
   ============================================================ */
const CARPETA_FOTOS  = '1iMeYnOssXSYUniCLqSQ_kgk-5-4FKzv5';
const CARPETA_VIDEOS = '1U1sMIyIz1V1zR3SjBS5Rp_CzFzpnFLzg';
const ORIGEN_PERMITIDO = 'https://kristalyarturo2026.github.io';   // tu GitHub Pages (sin / al final)
const MAX_BYTES = 3 * 1024 * 1024 * 1024;                       // 3 GB por archivo

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action !== 'init') return salida({ ok: false, error: 'Acción no válida' });

    const mime = String(d.mimeType || '');
    if (!/^(image|video)\//.test(mime)) return salida({ ok: false, error: 'Solo se aceptan fotos y videos' });
    if (!(d.size > 0) || d.size > MAX_BYTES) return salida({ ok: false, error: 'Archivo demasiado grande' });

    const quien = String(d.quien || '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 40);
    const original = String(d.name || 'archivo').replace(/[\\/:*?"<>|]/g, '_').slice(-80);
    const sello = Utilities.formatDate(new Date(), 'America/Hermosillo', 'yyyyMMdd_HHmmss');
    const nombre = (quien ? quien + '_' : '') + sello + '_' + Math.floor(Math.random() * 1000) + '_' + original;

    const r = UrlFetchApp.fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
      {
        method: 'post',
        contentType: 'application/json; charset=UTF-8',
        headers: {
          Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
          'X-Upload-Content-Type': mime,
          'X-Upload-Content-Length': String(d.size),
          Origin: ORIGEN_PERMITIDO
        },
        payload: JSON.stringify({ name: nombre, parents: [mime.indexOf('video/') === 0 ? CARPETA_VIDEOS : CARPETA_FOTOS] }),
        muteHttpExceptions: true
      }
    );
    if (r.getResponseCode() !== 200) return salida({ ok: false, error: 'Drive respondió ' + r.getResponseCode() });
    const h = r.getAllHeaders();
    const url = h['Location'] || h['location'];
    if (!url) return salida({ ok: false, error: 'Sin enlace de subida' });
    return salida({ ok: true, url: url });
  } catch (err) {
    return salida({ ok: false, error: String(err) });
  }
}

function doGet() { return ContentService.createTextOutput('Listo ✔'); }

function salida(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* Ejecuta esta función UNA vez para dar permisos */
function autorizar() {
  Logger.log('Fotos: ' + DriveApp.getFolderById(CARPETA_FOTOS).getName());
  Logger.log('Videos: ' + DriveApp.getFolderById(CARPETA_VIDEOS).getName());
  UrlFetchApp.fetch('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
}