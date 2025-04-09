import React, { useState, useEffect } from 'react';

const DataTable = ({ columns, data: initialData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filteredData, setFilteredData] = useState(initialData);
  
  // Handle search and filtering
  useEffect(() => {
    const results = initialData.filter(row => 
      columns.some(col => 
        row[col.field] && 
        row[col.field].toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    setFilteredData(results);
    setCurrentPage(1);
  }, [searchTerm, initialData, columns]);
  
  // Handle sorting
  const handleSort = (field) => {
    let direction = 'asc';
    
    if (sortConfig.key === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key: field, direction });
    
    const sortedData = [...filteredData].sort((a, b) => {
      if (a[field] === null) return 1;
      if (b[field] === null) return -1;
      
      const aValue = typeof a[field] === 'string' ? a[field].toLowerCase() : a[field];
      const bValue = typeof b[field] === 'string' ? b[field].toLowerCase() : b[field];
      
      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredData(sortedData);
  };
  
  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pageNumbers.push(i);
        }
      }
    }
    
    return pageNumbers;
  };
  
  return (
    <div className="space-y-4">
      {/* Search and rows per page - Separated from table */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2 w-64"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filas por página:</span>
          <select
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
      
      {/* Table - With its own border radius */}
      <div className="overflow-hidden rounded-lg shadow border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {columns.map((col, idx) => (
                  <th 
                    key={col.field || idx} 
                    className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => col.field && handleSort(col.field)}
                  >
                    <div className="flex items-center">
                      {col.label}
                      {sortConfig.key === col.field && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <tr key={row.id ? row.id : rowIndex} className="hover:bg-gray-50">
                    {columns.map((col, colIndex) => (
                      <td 
                        key={`${row.id || rowIndex}-${col.field || colIndex}`} 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {row[col.field]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination - Separated from table */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Mostrando <span className="font-medium">{Math.min(filteredData.length, (currentPage - 1) * rowsPerPage + 1)}</span> a{' '}
          <span className="font-medium">{Math.min(filteredData.length, currentPage * rowsPerPage)}</span> de{' '}
          <span className="font-medium">{filteredData.length}</span> resultados
        </div>
        
        <div className="flex space-x-1">
          <button
            className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            «
          </button>
          <button
            className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          
          {generatePageNumbers().map(number => (
            <button
              key={number}
              className={`px-3 py-1 rounded-md text-sm ${
                currentPage === number
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setCurrentPage(number)}
            >
              {number}
            </button>
          ))}
          
          <button
            className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
          <button
            className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;