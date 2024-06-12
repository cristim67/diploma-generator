import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

const FileUpload: React.FC = () => {
  const [fileDocx, setFileDocx] = useState<File | null>(null);
  const [fileExcel, setFileExcel] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [templateFileName, setTemplateFileName] = useState<string>('');
  const [dataFileName, setDataFileName] = useState<string>('');
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  const handleFileDocxChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file.name.endsWith('.docx')) {
        setFileDocx(file);
      } else {
        setMessage('Vă rugăm să selectați un fișier cu extensia .docx.');
      }
    }
  };

  const handleFileExcelChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setFileExcel(file);
      } else {
        setMessage('Vă rugăm să selectați un fișier cu extensia .xlsx sau .xls.');
      }
    }
  };

  const handleSubmitDocx = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileDocx) {
      setMessage('Vă rugăm să selectați un fișier DOCX.');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileDocx);

    try {
      const response = await axios.post(
        'http://localhost:3000/upload-docx', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      setTemplateFileName(response.data.fileName);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Eroare la încărcarea fișierului DOCX.');
    }
  };

  const handleSubmitExcel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileExcel) {
      setMessage('Vă rugăm să selectați un fișier Excel.');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileExcel);

    try {
      const response = await axios.post(
        'http://localhost:3000/upload-excel', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      setDataFileName(response.data.fileName);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Eroare la încărcarea fișierului Excel.');
    }
  };

  const handleGenerateDiplomas = async () => {
    if (!templateFileName || !dataFileName) {
      setMessage('Vă rugăm să încărcați fișierele necesare înainte de a genera diplomele.');
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:3000/generate-diplomas?template=${templateFileName}&data=${dataFileName}`
      );
      setMessage(response.data.message);
      setDownloadLink('http://localhost:3000/download-diplomas');
    } catch (error) {
      setMessage('Eroare la generarea diplomelor.');
    }
  };

  return (
    <>
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Încărcare Fișiere</h1>
      <div className="mb-6">
        {message &&
            <p className={`mt-4 p-2 rounded ${message.includes('Eroare') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</p>}
        {downloadLink && (
          <a href={downloadLink} download="diplomas.zip" className="mt-4 block text-center text-blue-500 underline">Descărcați
            Diplome</a>
        )}
        <h2 className="text-xl font-semibold mb-4">Încărcare fișier DOCX</h2>
        <form onSubmit={handleSubmitDocx} className="space-y-4">
          <input
            type="file"
            onChange={handleFileDocxChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button type="submit"
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Încărcați DOCX
          </button>
        </form>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Încărcare fișier Excel</h2>
        <form onSubmit={handleSubmitExcel} className="space-y-4">
          <input
            type="file"
            onChange={handleFileExcelChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <button type="submit"
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Încărcați Excel
          </button>
        </form>
      </div>
      <button onClick={handleGenerateDiplomas}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600">Generează Diplome
      </button>
    </div>
    </>
  );
};

export default FileUpload;
