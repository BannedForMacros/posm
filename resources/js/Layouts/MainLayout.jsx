// resources/js/Layouts/MainLayout.jsx
import React from 'react'
import Sidebar from '@/Components/Sidebar'  // Ajusta la ruta si tu Sidebar está en otro sitio

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar fijo a la izquierda */}
      <aside className="fixed top-0 left-0 w-64 h-screen bg-gray-900 text-white overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Contenido principal con margen izquierdo para no quedar debajo del sidebar */}
      <main className="ml-64 w-full p-4 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
