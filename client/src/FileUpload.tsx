import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';

const FileUpload: React.FC = () => {
  const [fileDocx, setFileDocx] = useState<File | null>(null);
  const [fileExcel, setFileExcel] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [templateFileName, setTemplateFileName] = useState<string>('');
  const [dataFileName, setDataFileName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    fileType: 'docx' | 'excel'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isDocx = fileType === 'docx' && file.name.endsWith('.docx');
    const isExcel = fileType === 'excel' && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'));

    if (isDocx) {
      setFileDocx(file);
      setMessage('');
    } else if (isExcel) {
      setFileExcel(file);
      setMessage('');
    } else {
      setMessage(`Error: Please select a file with the ${fileType === 'docx' ? '.docx' : '.xlsx'} extension.`);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
    fileType: 'docx' | 'excel'
  ) => {
    event.preventDefault();
    const file = fileType === 'docx' ? fileDocx : fileExcel;

    if (!file) {
      setMessage(`Error: Please select a ${fileType === 'docx' ? 'DOCX' : 'Excel'} file.`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await axios.post(
        `https://e2877c54-da8e-49d1-9eae-0a26fa70f398.dev-fkt.cloud.genez.io/upload-${fileType}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (fileType === 'docx') {
        setTemplateFileName(response.data.fileName);
      } else {
        setDataFileName(response.data.fileName);
      }

      setMessage(response.data.message);
    } catch (error) {
      setMessage(`Error uploading the ${fileType === 'docx' ? 'DOCX' : 'Excel'} file.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDiplomas = async () => {
    if (!templateFileName || !dataFileName) {
      setMessage('Error: Please upload the required files before generating diplomas.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `https://e2877c54-da8e-49d1-9eae-0a26fa70f398.dev-fkt.cloud.genez.io/generate-diplomas?template=${templateFileName}&data=${dataFileName}`
      );

      if (response.data.status === 200) {
        const pathName = response.data.pathName;
        console.log(response.data);
        const downloadResponse = await axios.get(
          `https://e2877c54-da8e-49d1-9eae-0a26fa70f398.dev-fkt.cloud.genez.io/download?pathName=${pathName}`,
          { responseType: 'blob' }
        );

        const blob = new Blob([downloadResponse.data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${pathName}.zip`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);

        setMessage('Diplomas have been successfully generated and downloaded.');
      } else {
        setMessage('Error generating diplomas.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Error generating or downloading diplomas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">File Upload</h1>
      {message && (
        <p className={`mt-4 p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </p>
      )}
      {loading && (
        <div className="flex justify-center mb-6">
          <ClipLoader size={35} color={"#123abc"} loading={loading} />
        </div>
      )}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload DOCX File</h2>
        <form onSubmit={(e) => handleSubmit(e, 'docx')} className="space-y-4">
          <input
            type="file"
            onChange={(e) => handleFileChange(e, 'docx')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button type="submit" className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Upload DOCX
          </button>
        </form>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Excel File</h2>
        <form onSubmit={(e) => handleSubmit(e, 'excel')} className="space-y-4">
          <input
            type="file"
            onChange={(e) => handleFileChange(e, 'excel')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <button type="submit" className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
            Upload Excel
          </button>
        </form>
      </div>
      <button onClick={handleGenerateDiplomas} className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600">
        Generate Diplomas
      </button>
    </div>
  );
};

export default FileUpload;
