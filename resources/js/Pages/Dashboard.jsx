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

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Función para formatear un número:
 * - Si es entero, lo muestra sin decimales
 * - Si tiene parte decimal, muestra 2 decimales
 */
function formatNumber(value) {
  if (value == null) return "0";
  const num = parseFloat(value);
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
}

// Componente de tarjeta (stats)
function StatCard({ title, value, icon: Icon, color }) {
  return (
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
}

/**
 * Componente para la gráfica "Top Artículos" en barras horizontales
 */
function TopArticulosChart({ data }) {
  // data => array con { Articulo, CantidadVendida }
  // Ordenamos desc
  const sorted = [...data].sort((a, b) => {
    const valA = parseFloat(a.CantidadVendida) || 0;
    const valB = parseFloat(b.CantidadVendida) || 0;
    return valB - valA; // mayor primero
  });

  const chartData = {
    labels: sorted.map(item => item.Articulo || 'Sin nombre'),
    datasets: [
      {
        label: 'Cantidad Vendida',
        data: sorted.map(item => parseFloat(item.CantidadVendida) || 0),
        backgroundColor: 'rgba(255,99,132,0.5)',
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    indexAxis: 'y', // barras horizontales
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { beginAtZero: true }
    },
    plugins: {
      legend: { display: true, position: 'top' }
    }
  };

  return (
    <div style={{ height: '400px' }}>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

/**
 * Componente para la gráfica "Ventas por Sucursal" en barras horizontales
 */
function VentasPorSucursalChart({ data }) {
  // data => array con { Sucursal, MontoTotal }
  // Ordenar desc
  const sorted = [...data].sort((a, b) => {
    const valA = parseFloat(a.MontoTotal) || 0;
    const valB = parseFloat(b.MontoTotal) || 0;
    return valB - valA;
  });

  const chartData = {
    labels: sorted.map(item => item.Sucursal || 'N/A'),
    datasets: [
      {
        label: 'MontoTotal',
        data: sorted.map(item => parseFloat(item.MontoTotal) || 0),
        backgroundColor: 'rgba(153,102,255,0.5)',
        borderColor: 'rgba(153,102,255,1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    indexAxis: 'y', // barras horizontales
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { beginAtZero: true }
    },
    plugins: {
      legend: { display: true, position: 'top' }
    }
  };

  return (
    <div style={{ height: '400px' }}>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

export default function Dashboard() {
  // Filtros: 
  // Se inicia el mes en null ("Todos Meses") y el año con el año actual
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Carga y error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data
  const [stats, setStats] = useState({
    total_ventas: 0,
    total_transacciones: 0,
    promedio_venta: 0,
    clientes_unicos: 0
  });
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [ventasPorFormaPago, setVentasPorFormaPago] = useState([]);
  const [topArticulos, setTopArticulos] = useState([]);

  // NUEVO: Estado para Ventas por Sucursal
  const [ventasPorSucursal, setVentasPorSucursal] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (selectedMonth !== null) params.mes = selectedMonth;
      if (selectedYear !== null) params.anio = selectedYear;
      params.limite = 10; // top 10 artículos

      // Llamada al endpoint
      const response = await axios.get('/api/dashboard/graficos', { params });
      if (response.data.success) {
        const {
          stats = {},
          ventasPorDia = [],
          ventasPorFormaPago = [],
          topArticulos = [],
          ventasPorSucursal = []
        } = response.data.data || {};

        setStats(stats);
        setVentasPorDia(ventasPorDia);
        setVentasPorFormaPago(ventasPorFormaPago);
        setTopArticulos(topArticulos);
        // Guardar la nueva data
        setVentasPorSucursal(ventasPorSucursal);
      } else {
        throw new Error(response.data.message || 'Error al cargar datos');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Gráfica Ventas por Día
  const barData = {
    labels: ventasPorDia.map(item => `Día ${item.Dia || ''}`),
    datasets: [
      {
        label: 'Ventas por Día',
        data: ventasPorDia.map(item => parseFloat(item.MontoTotal) || 0),
        backgroundColor: 'rgba(75,192,192,0.5)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1
      }
    ]
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true }
    },
    plugins: {
      legend: { display: true, position: 'top' }
    }
  };

  // Gráfica Ventas por Forma de Pago
  const doughnutData = {
    labels: ventasPorFormaPago.map(item => item.FormaPago || 'N/A'),
    datasets: [
      {
        label: 'Forma de Pago',
        data: ventasPorFormaPago.map(item => parseFloat(item.MontoTotal) || 0),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ]
      }
    ]
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'right' }
    }
  };

  // Generación dinámica de opciones para años
  const currentYear = new Date().getFullYear();
  const startYear = 2020;
  const yearOptions = [];
  for (let year = startYear; year <= currentYear; year++) {
    yearOptions.push(year);
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-4">
            <select
              className="w-48 px-4 py-2 border rounded"  // Se asigna un ancho mayor (w-48)
              value={selectedMonth ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseInt(e.target.value);
                setSelectedMonth(val);
              }}
            >
              <option value="">Todos los Meses</option>
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

            {/* Se inserta la palabra "del" entre ambos selects */}
            <span className="self-center">del</span>

            <select
              className="px-7 py-2 border rounded"
              value={selectedYear ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : parseInt(e.target.value);
                setSelectedYear(val);
              }}
            >
              <option value="">Todos los Años</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Cargando / Error */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : (
          <>
            {/* Tarjetas (stats) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Ventas"
                value={`S/ ${stats.total_ventas?.toFixed(2) ?? '0.00'}`}
                icon={CurrencyDollarIcon}
                color="bg-blue-500"
              />
              <StatCard
                title="Transacciones"
                value={stats.total_transacciones ?? 0}
                icon={DocumentTextIcon}
                color="bg-green-500"
              />
              <StatCard
                title="Promedio por Venta"
                value={`S/ ${stats.promedio_venta?.toFixed(2) ?? '0.00'}`}
                icon={ChartBarIcon}
                color="bg-yellow-500"
              />
              <StatCard
                title="Clientes Únicos"
                value={stats.clientes_unicos ?? 0}
                icon={UserGroupIcon}
                color="bg-purple-500"
              />
            </div>

            {/* Gráficas principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Ventas por Día */}
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

              {/* Ventas por Forma de Pago */}
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

            {/* Gráfica: Top Artículos */}
            <div className="bg-white rounded-lg shadow p-4 mb-6" style={{ height: '500px' }}>
              <h2 className="text-xl font-bold mb-2">Top Artículos</h2>
              {topArticulos.length > 0 ? (
                <TopArticulosChart data={topArticulos} />
              ) : (
                <p className="text-gray-500">No hay datos</p>
              )}
            </div>

            {/* NUEVA Gráfica: Ventas por Sucursal */}
            <div className="bg-white rounded-lg shadow p-4 mb-6" style={{ height: '500px' }}>
              <h2 className="text-xl font-bold mb-2">Ventas por Sucursal</h2>
              {ventasPorSucursal.length > 0 ? (
                <VentasPorSucursalChart data={ventasPorSucursal} />
              ) : (
                <p className="text-gray-500">No hay datos</p>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
