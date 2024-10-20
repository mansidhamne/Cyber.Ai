'use client'
import React, { useState } from 'react';
import axios from 'axios';

const DocumentSummarizer = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/summarize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error submitting file:', error);
      setError('An error occurred while summarizing the file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Document Summarizer</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Upload a file
          </label>
          <input 
            id="file-upload"
            type="file" 
            onChange={handleFileChange} 
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          disabled={isLoading || !file}
        >
          {isLoading ? 'Summarizing...' : 'Summarize'}
        </button>
      </form>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {isLoading && (
        <div className="mb-4 flex items-center">
          <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing your file, please wait...
        </div>
      )}
      {summary && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">Summary:</h2>
          <p className="p-4 bg-gray-100 rounded-md shadow">{summary}</p>
        </div>
      )}
    </div>
  );
};

export default DocumentSummarizer;