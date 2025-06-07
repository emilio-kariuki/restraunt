'use client';

import { useState, useRef } from 'react';
import { 
  Upload, Download, FileText, AlertCircle, CheckCircle, 
  X, RefreshCw, Eye, Trash2, Edit3, Plus
} from 'lucide-react';
import { apiService } from '../../lib/api';

interface BulkMenuUploadProps {
  restaurantId: string;
  onUploadComplete: () => void;
  onNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: string[];
  created: any[];
  updated: any[];
}

interface ValidationResult {
  total: number;
  valid: number;
  invalid: number;
  errors: string[];
}

export default function BulkMenuUpload({ 
  restaurantId, 
  onUploadComplete, 
  onNotification 
}: BulkMenuUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [options, setOptions] = useState({
    overwrite: false,
    skipDuplicates: true,
    validateOnly: false
  });
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'json' | 'preview'>('upload');
  const [jsonInput, setJsonInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      setValidationResult(null);
      setPreviewData(null);
      
      // Auto-preview for small files
      if (file.size < 1024 * 1024) { // 1MB
        handlePreviewFile(file);
      }
    }
  };

  const handlePreviewFile = async (file: File) => {
    try {
      if (file.type === 'application/json') {
        const text = await file.text();
        const data = JSON.parse(text);
        setPreviewData(Array.isArray(data) ? data.slice(0, 10) : []);
      } else if (file.type === 'text/csv') {
        const text = await file.text();
        const lines = text.split('\n').slice(0, 11); // Header + 10 rows
        const headers = lines[0]?.split(',');
        const rows = lines.slice(1).map(line => {
          const values = line.split(',');
          const obj: any = {};
          headers?.forEach((header, index) => {
            obj[header.trim()] = values[index]?.trim();
          });
          return obj;
        }).filter(row => Object.values(row).some(val => val));
        setPreviewData(rows);
      }
    } catch (error) {
      console.error('Preview error:', error);
      onNotification('error', 'Could not preview file');
    }
  };

  const handleValidate = async () => {
    if (!selectedFile && !jsonInput.trim()) {
      onNotification('error', 'Please select a file or enter JSON data');
      return;
    }

    try {
      setIsValidating(true);
      let items: any[] = [];

      if (selectedFile) {
        const result = await apiService.menu.uploadMenuFromFile(selectedFile, {
          restaurantId,
          ...options,
          validateOnly: true
        });
        setValidationResult(result.results);
      } else if (jsonInput.trim()) {
        items = JSON.parse(jsonInput);
        const result = await apiService.menu.validateBulkMenu(items);
        setValidationResult(result.results);
      }

      onNotification('info', 'Validation completed');
    } catch (error: any) {
      console.error('Validation error:', error);
      onNotification('error', error.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile && !jsonInput.trim()) {
      onNotification('error', 'Please select a file or enter JSON data');
      return;
    }

    try {
      setIsUploading(true);
      let result: any;

      if (selectedFile) {
        result = await apiService.menu.uploadMenuFromFile(selectedFile, {
          restaurantId,
          ...options
        });
      } else if (jsonInput.trim()) {
        const items = JSON.parse(jsonInput);
        result = await apiService.menu.bulkUploadMenu(items, {
          restaurantId,
          ...options
        });
      }

      setUploadResult(result.results);
      
      if (result.success) {
        onNotification('success', result.message);
        onUploadComplete();
      } else {
        onNotification('error', result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      onNotification('error', error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const result = await apiService.menu.getBulkUploadTemplate(format);
      onNotification('success', `${format.toUpperCase()} template downloaded`);
    } catch (error: any) {
      console.error('Download template error:', error);
      onNotification('error', error.message || 'Failed to download template');
    }
  };

  const handleExportMenu = async (format: 'csv' | 'json' | 'excel' = 'csv') => {
    try {
      const result = await apiService.menu.exportMenu(format, restaurantId);
      onNotification('success', `Menu exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error('Export menu error:', error);
      onNotification('error', error.message || 'Failed to export menu');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setJsonInput('');
    setUploadResult(null);
    setValidationResult(null);
    setPreviewData(null);
    setActiveTab('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        <Upload className="w-4 h-4 mr-2" />
        Bulk Upload Menu
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Menu Upload</h2>
            <p className="text-sm text-gray-600">Upload multiple menu items at once</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Upload Controls */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'upload' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                File Upload
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'json' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                JSON Input
              </button>
              {previewData && (
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'preview' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Preview
                </button>
              )}
            </div>

            {/* File Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                {/* Template Downloads */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Download Templates</h3>
                  <div className="flex space-x-2 mb-3">
                    <button
                      onClick={() => handleDownloadTemplate('csv')}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      CSV Template
                    </button>
                    <button
                      onClick={() => handleDownloadTemplate('json')}
                      className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      JSON Template
                    </button>
                  </div>
                </div>

                {/* Export Current Menu */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Export Current Menu</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExportMenu('csv')}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleExportMenu('excel')}
                      className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </button>
                    <button
                      onClick={() => handleExportMenu('json')}
                      className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export JSON
                    </button>
                  </div>
                </div>

                {/* File Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.json,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {selectedFile ? selectedFile.name : 'Choose CSV, JSON, or Excel file'}
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Files
                    </button>
                    {selectedFile && (
                      <div className="mt-3 text-sm text-gray-500">
                        Size: {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* JSON Input Tab */}
            {activeTab === 'json' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JSON Menu Data
                  </label>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`[\n  {\n    "name": "Pizza Margherita",\n    "description": "Classic pizza with tomato and mozzarella",\n    "price": 12.99,\n    "category": "pizza",\n    "available": true\n  }\n]`}
                    className="w-full h-64 p-3 border border-gray-300 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {jsonInput && (
                  <div className="text-sm text-gray-600">
                    {(() => {
                      try {
                        const parsed = JSON.parse(jsonInput);
                        return `✓ Valid JSON with ${Array.isArray(parsed) ? parsed.length : 1} item(s)`;
                      } catch {
                        return '✗ Invalid JSON format';
                      }
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && previewData && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Data Preview</h3>
                <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {Object.keys(previewData[0] || {}).map(key => (
                          <th key={key} className="text-left py-2 px-3 font-medium text-gray-700">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          {Object.values(row).map((value: any, i) => (
                            <td key={i} className="py-2 px-3 text-gray-600">
                              {String(value).substring(0, 30)}
                              {String(value).length > 30 && '...'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 5 && (
                    <p className="text-gray-500 text-center mt-3">
                      ... and {previewData.length - 5} more items
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Upload Options */}
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-gray-900">Upload Options</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.skipDuplicates}
                    onChange={(e) => setOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Skip duplicate items</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.overwrite}
                    onChange={(e) => setOptions(prev => ({ ...prev, overwrite: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Overwrite existing items</span>
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">Important Notes:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Validate your data before uploading</li>
                      <li>• Duplicate checking is case-insensitive</li>
                      <li>• Overwrite will update existing items completely</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleValidate}
                disabled={isValidating || (!selectedFile && !jsonInput.trim())}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isValidating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Validate
              </button>
              
              <button
                onClick={handleUpload}
                disabled={isUploading || (!selectedFile && !jsonInput.trim())}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload
              </button>
              
              <button
                onClick={resetForm}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Results</h3>
            
            {/* Validation Results */}
            {validationResult && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Validation Results</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{validationResult.valid}</div>
                      <div className="text-sm text-gray-600">Valid</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{validationResult.invalid}</div>
                      <div className="text-sm text-gray-600">Invalid</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{validationResult.total}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                  </div>
                  
                  {validationResult.errors.length > 0 && (
                    <div>
                      <h5 className="font-medium text-red-800 mb-2">Validation Errors:</h5>
                      <div className="bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                        {validationResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-700 mb-1">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Results */}
            {uploadResult && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Upload Results</h4>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{uploadResult.successful}</div>
                      <div className="text-sm text-gray-600">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{uploadResult.failed}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{uploadResult.skipped}</div>
                      <div className="text-sm text-gray-600">Skipped</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{uploadResult.total}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((uploadResult.successful / uploadResult.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(uploadResult.successful / uploadResult.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Created Items */}
                  {uploadResult.created.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-green-800 mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Created Items ({uploadResult.created.length})
                      </h5>
                      <div className="bg-white rounded-lg p-3 max-h-32 overflow-y-auto">
                        {uploadResult.created.slice(0, 10).map((item, index) => (
                          <div key={index} className="text-sm text-gray-700 mb-1">
                            ✓ {item.name} - ${item.price}
                          </div>
                        ))}
                        {uploadResult.created.length > 10 && (
                          <div className="text-sm text-gray-500">
                            ... and {uploadResult.created.length - 10} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Updated Items */}
                  {uploadResult.updated.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Updated Items ({uploadResult.updated.length})
                      </h5>
                      <div className="bg-white rounded-lg p-3 max-h-32 overflow-y-auto">
                        {uploadResult.updated.slice(0, 10).map((item, index) => (
                          <div key={index} className="text-sm text-gray-700 mb-1">
                            ↻ {item.name} - ${item.price}
                          </div>
                        ))}
                        {uploadResult.updated.length > 10 && (
                          <div className="text-sm text-gray-500">
                            ... and {uploadResult.updated.length - 10} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Errors */}
                  {uploadResult.errors.length > 0 && (
                    <div>
                      <h5 className="font-medium text-red-800 mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Errors ({uploadResult.errors.length})
                      </h5>
                      <div className="bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                        {uploadResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-700 mb-1">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!validationResult && !uploadResult && (
              <div className="text-center py-12">
                <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Upload results will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}