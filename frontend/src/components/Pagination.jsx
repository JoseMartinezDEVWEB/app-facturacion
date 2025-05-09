/* eslint-disable react/prop-types */
import React from 'react';
import { motion } from 'framer-motion';

const Pagination = ({ 
  currentPage, 
  totalItems, 
  pageSize, 
  onPageChange 
}) => {
  // Calcular el número total de páginas
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Si solo hay una página, no mostrar paginación
  if (totalPages <= 1) return null;
  
  // Determinar qué números de página mostrar
  const getPageNumbers = () => {
    const pages = [];
    // Siempre mostrar la primera página
    pages.push(1);
    
    // Calcular el rango de páginas alrededor de la página actual
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Ajustar para mostrar 3 páginas cuando sea posible
    if (startPage > 2) pages.push('...');
    
    // Añadir páginas intermedias
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Añadir elipsis si hay más páginas después
    if (endPage < totalPages - 1) pages.push('...');
    
    // Siempre mostrar la última página si hay más de una
    if (totalPages > 1) pages.push(totalPages);
    
    return pages;
  };
  
  // Versión simplificada para móviles
  const getMobilePageNumbers = () => {
    const pages = [];
    // Mostrar solo página actual, anterior y siguiente
    if (currentPage > 1) pages.push(currentPage - 1);
    pages.push(currentPage);
    if (currentPage < totalPages) pages.push(currentPage + 1);
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  const mobilePageNumbers = getMobilePageNumbers();
  
  return (
    <div className="flex justify-center items-center mt-4 sm:mt-6 px-2">
      {/* Botón Anterior */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-2 sm:px-3 py-1 rounded-md ${
          currentPage === 1 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        }`}
        aria-label="Página anterior"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </motion.button>
      
      {/* Números de página para dispositivos móviles */}
      <div className="flex sm:hidden space-x-1">
        {mobilePageNumbers.map((page, index) => (
          <motion.button
            key={`mobile-${index}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(page)}
            className={`min-w-[32px] px-2 py-1 text-sm rounded-md ${
              currentPage === page 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {page}
          </motion.button>
        ))}
      </div>
      
      {/* Números de página para tablet/desktop */}
      <div className="hidden sm:flex space-x-1">
        {pageNumbers.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-1 text-gray-500">...</span>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(page)}
                className={`min-w-[36px] px-3 py-1 rounded-md ${
                  currentPage === page 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page}
              </motion.button>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Botón Siguiente */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-2 sm:px-3 py-1 rounded-md ${
          currentPage === totalPages 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        }`}
        aria-label="Página siguiente"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
      
      {/* Indicador de página actual y total - visible solo en móvil */}
      <div className="sm:hidden ml-2 text-xs text-gray-500">
        {currentPage} / {totalPages}
      </div>
    </div>
  );
};

export default Pagination;