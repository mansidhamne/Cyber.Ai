import React from 'react';

const FileUpload = ({ onUpload }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="mt-4">
      <input
        type="file"
        onChange={handleFileChange}
        accept=".pdf,image/*"
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded"
      >
        Upload File (PDF or Image)
      </label>
    </div>
  );
};

export default FileUpload;