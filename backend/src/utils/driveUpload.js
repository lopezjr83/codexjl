import { google } from 'googleapis';
import { Readable } from 'stream';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

const getAuth = () => {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no está configurado');
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
};

/**
 * Uploads a base64 image to Google Drive.
 * @param {string} base64     - data:image/jpeg;base64,....
 * @param {string} fileName   - e.g. "Cliente_01_Jose_Lopez_2026-05-08.jpg"
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export const uploadToDrive = async (base64, fileName) => {
  if (!base64 || !FOLDER_ID) return null;

  // Strip the data URI prefix and convert to buffer
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const stream = Readable.from(buffer);

  const auth  = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [FOLDER_ID],
      mimeType: 'image/jpeg'
    },
    media: {
      mimeType: 'image/jpeg',
      body: stream
    },
    fields: 'id, webViewLink, webContentLink'
  });

  const fileId = response.data.id;

  // Make the file publicly readable so the app can display it
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' }
  });

  // Direct image URL (renders in <img> tags)
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};
