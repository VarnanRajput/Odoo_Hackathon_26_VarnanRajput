import React, { useState, useRef } from 'react';

const FileUpload = ({
  label = '',
  onChange,
  value = null, // base64 string or image preview URL
  error = '',
  helperText = '',
  required = false,
  disabled = false,
  className = '',
  accept = 'image/*'
}) => {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    
    // Read file and convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      if (onChange) {
        onChange(e.target.result); // base64 string
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onChange) onChange(null);
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-200 min-h-40 ${
          value ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-300 dark:border-slate-800'
        } ${dragging ? 'border-indigo-600 bg-indigo-50/20' : ''} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept={accept}
          className="hidden"
          disabled={disabled}
        />

        {value ? (
          <div className="relative w-full max-h-36 flex justify-center items-center overflow-hidden rounded-xl">
            <img src={value} alt="Preview" className="max-h-32 object-contain rounded-lg" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs hover:bg-rose-700 cursor-pointer shadow"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <div className="text-3xl">📥</div>
            <span className="text-sm font-semibold">
              Drag & Drop file here, or <span className="text-indigo-600">Browse</span>
            </span>
            <span className="text-xs text-slate-400">Supports PNG, JPG, JPEG (Max 5MB)</span>
          </div>
        )}
      </div>

      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
      {!error && helperText && <span className="text-xs text-slate-500">{helperText}</span>}
    </div>
  );
};

export default FileUpload;
export { FileUpload };
