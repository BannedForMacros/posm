import React from 'react';

const EstadoIndicador = ({ estado }) => {
  return (
    <div
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
        ${estado === 1
          ? 'text-green-700 bg-green-50 border-b-2 border-green-500'
          : 'text-red-700 bg-red-50 border-b-2 border-red-500'
        }
        transition-all duration-200 ease-in-out
        hover:shadow-sm
      `}
    >
      <span className={`
        w-2 h-2 rounded-full mr-2
        ${estado === 1 ? 'bg-green-500' : 'bg-red-500'}
      `}/>
      {estado === 1 ? 'Activo' : 'Inactivo'}
    </div>
  );
};

export default EstadoIndicador;