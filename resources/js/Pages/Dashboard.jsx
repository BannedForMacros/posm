import React, { useState, useEffect } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Íconos para las tarjetas
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  // -----------------------------
  // 1) Estados para mes/año
  // -----------------------------
  // Iniciamos en null => "todos"
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  // Manejo de carga y errores
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------
  // 2) Estados donde guardamos la data
  // -----------------------------
  // Estadísticas para las tarjetas
  const [stats, setStats] = useState({
    total_ventas: 0,
    total_transacciones: 0,
    promedio_venta: 0,
    clientes_unicos: 0
  });

  // Data para gráficas/tablas
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [ventasPorFormaPago, setVentasPorFormaPago] = useState([]);
  const [ventasPorArticulo, setVentasPorArticulo] = useState([]);
  const [topArticulos, setTopArticulos] = useState([]);

  // -----------------------------
  // 3) useEffect => cargar datos
  // -----------------------------
  useEffect(() => {
    fetchAllData();
  }, [selectedMonth, selectedYear]);

  // -----------------------------
  // 4) Llamar a 5 endpoints en paralelo
  // -----------------------------
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Construimos los params. 
      // Si mes o año son null, no los incluimos (o enviamos null).
      const params = {};
      if (selectedMonth !== null) params.mes = selectedMonth;
      if (selectedYear !== null) params.anio = selectedYear;

      // Copiamos para cada endpoint
      const paramsTopArt = { ...params, limite: 5 };

      // Promise.all con las 5 peticiones
      const [
        resStats,
        resDia,
        resFormaPago,
        resArticulo,
        resTop
      ] = await Promise.all([
        axios.get('/api/ventas/estadisticas-generales', { params }),
        axios.get('/api/ventas/grafica-ventas-por-dia', { params }),
        axios.get('/api/ventas/grafica-ventas-por-formapago', { params }),
        axios.get('/api/ventas/grafica-ventas-por-articulo', { params }),
        axios.get('/api/ventas/grafica-top-articulos', { params: paramsTopArt })
      ]);

      // Actualizamos los estados
      setStats(resStats.data);                   // { total_ventas, ... }
      setVentasPorDia(resDia.data);             // array
      setVentasPorFormaPago(resFormaPago.data); // array
      setVentasPorArticulo(resArticulo.data);   // array
      setTopArticulos(resTop.data);             // array
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 5) Preparar data de Gráficas
  // -----------------------------
  // A) Gráfica de Barras: Ventas por Día
  // Suponiendo que cada objeto en ventasPorDia es { Dia, MontoTotal }
  const ventasPorDiaLabels = ventasPorDia.map(item => `Día ${item.Dia || ''}`);
  const ventasPorDiaValues = ventasPorDia.map(item => item.MontoTotal);

  const barData = {
    labels: ventasPorDiaLabels,
    datasets: [
      {
        label: 'Ventas por Día',
        data: ventasPorDiaValues,
        backgroundColor: 'rgba(75,192,192,0.5)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,  // Para poder controlar altura
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // B) Gráfica de Dona: Ventas por Forma de Pago
  // Suponiendo { FormaPago, MontoTotal }
  const doughnutData = {
    labels: ventasPorFormaPago.map(item => item.FormaPago),
    datasets: [
      {
        label: 'Forma de Pago',
        data: ventasPorFormaPago.map(item => item.MontoTotal),
        backgroundColor: [
          '#FF6384', // rosa
          '#36A2EB', // celeste
          '#FFCE56', // amarillo
          '#4BC0C0', // turquesa
          '#9966FF', // morado
          '#FF9F40'  // naranja
        ]
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      }
    }
  };

  // -----------------------------
  // 6) Componente para tarjetas
  // -----------------------------
  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-4 flex items-center">
      <div className={`p-3 rounded-full ${color} bg-opacity-10 mr-4`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  // -----------------------------
  // 7) Render
  // -----------------------------
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        
        {/* Título y Selectores */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

          <div className="flex gap-4">
            {/* Selector Mes */}
            <select
              className="px-4 py-2 border rounded"
              value={selectedMonth ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseInt(e.target.value);
                setSelectedMonth(val);
              }}
            >
              <option value="">-- Todos Meses --</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>

            {/* Selector Año */}
            <select
              className="px-4 py-2 border rounded"
              value={selectedYear ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseInt(e.target.value);
                setSelectedYear(val);
              }}
            >
              <option value="">-- Todos Años --</option>
              <option value="2020">2020</option>
              <option value="2021">2021</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              {/* Agrega más años si quieres */}
            </select>
          </div>
        </div>

        {/* Cargando / Error */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">
            Error: {error}
          </div>
        ) : (
          <>
            {/* Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Ventas"
                value={`S/ ${stats.total_ventas.toFixed(2)}`}
                icon={CurrencyDollarIcon}
                color="bg-blue-500"
              />
              <StatCard
                title="Transacciones"
                value={stats.total_transacciones}
                icon={DocumentTextIcon}
                color="bg-green-500"
              />
              <StatCard
                title="Promedio por Venta"
                value={`S/ ${stats.promedio_venta.toFixed(2)}`}
                icon={ChartBarIcon}
                color="bg-yellow-500"
              />
              <StatCard
                title="Clientes Únicos"
                value={stats.clientes_unicos}
                icon={UserGroupIcon}
                color="bg-purple-500"
              />
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Ventas por Día (Bar) */}
              <div className="bg-white rounded-lg shadow p-4" style={{ height: '400px' }}>
                <h2 className="text-xl font-bold mb-2">Ventas por Día</h2>
                {ventasPorDia.length > 0 ? (
                  <div style={{ height: '320px' }}>
                    <Bar data={barData} options={barOptions} />
                  </div>
                ) : (
                  <p className="text-gray-500">No hay datos</p>
                )}
              </div>

              {/* Ventas por Forma de Pago (Doughnut) */}
              <div className="bg-white rounded-lg shadow p-4" style={{ height: '400px' }}>
                <h2 className="text-xl font-bold mb-2">Ventas por Forma de Pago</h2>
                {ventasPorFormaPago.length > 0 ? (
                  <div style={{ height: '320px' }}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                ) : (
                  <p className="text-gray-500">No hay datos</p>
                )}
              </div>
            </div>

            {/* Tablas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ventas por Artículo */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-bold mb-2">Ventas por Artículo</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Artículo</th>
                        <th className="py-2 text-right">MontoTotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasPorArticulo.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{item.Articulo}</td>
                          <td className="py-2 text-right">{item.MontoTotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Artículos */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-bold mb-2">Top Artículos</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Artículo</th>
                        <th className="py-2 text-right">CantidadVendida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topArticulos.map((art, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{art.Articulo}</td>
                          <td className="py-2 text-right">{art.CantidadVendida}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
