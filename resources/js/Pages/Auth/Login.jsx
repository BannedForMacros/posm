import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ClipboardList, ShoppingCart, Clock, ChefHat } from 'lucide-react';
import { Input } from '@/Components/ui/Input';
import { Button } from '@/Components/ui/Button';
import { Checkbox } from '@/Components/ui/Checkbox';
import { Card } from '@/Components/ui/Card';
import { AuthLayout } from '@/Components/ui/AuthLayout';
const CarouselSlide = ({ icon: Icon, title, description, isActive }) => (
    <div className={`absolute w-full transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col items-center text-center p-6">
            <Icon className="w-16 h-16 text-orange-500 mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    </div>
);

export default function Login({ status, canResetPassword }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    
    const slides = [
        {
            icon: ClipboardList,
            title: "Gestión de Productos",
            description: "Administra tu inventario y menú de forma eficiente con actualizaciones en tiempo real"
        },
        {
            icon: ShoppingCart,
            title: "Control de Pedidos",
            description: "Seguimiento detallado de cada pedido desde su creación hasta la entrega"
        },
        {
            icon: Clock,
            title: "Optimización de Comandas",
            description: "Mejora los tiempos de preparación y entrega con nuestro sistema inteligente"
        },
        {
            icon: ChefHat,
            title: "Gestión de Cocina",
            description: "Coordina eficientemente la preparación de platillos y gestiona los recursos"
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <AuthLayout>
            <Head title="Iniciar Sesión" />
            
            <Card className="w-full max-w-6xl mx-auto flex">
                {/* Login Form Section */}
                <div className="w-full md:w-1/2 p-8 md:p-12">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Bienvenido a POSM
                        </h2>
                        <p className="text-gray-600">
                            Inicia sesión para Gestionar tu Negocio
                        </p>
                    </div>

                    {status && (
                        <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 text-sm">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <Input
                            type="email"
                            label="Correo electrónico"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            error={errors.email}
                            autoComplete="email"
                            autoFocus
                        />

                        <Input
                            type="password"
                            label="Contraseña"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            error={errors.password}
                            autoComplete="current-password"
                        />

                        <div className="flex items-center justify-between">
                            <Checkbox
                                label="Recordarme"
                                checked={data.remember}
                                onChange={e => setData('remember', e.target.checked)}
                            />

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-orange-600 hover:text-orange-700 transition duration-150"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={processing}
                        >
                            Iniciar Sesión
                        </Button>
                    </form>
                </div>

                {/* Carousel Section */}
                <div className="hidden md:block w-1/2 bg-orange-50 relative">
                    <div className="h-full flex items-center justify-center p-8 relative">
                        {slides.map((slide, index) => (
                            <CarouselSlide
                                key={index}
                                {...slide}
                                isActive={currentSlide === index}
                            />
                        ))}
                        
                        {/* Navigation Buttons */}
                        <button
                            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                            className="absolute left-4 p-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition duration-200"
                            aria-label="Anterior"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <button
                            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                            className="absolute right-4 p-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition duration-200"
                            aria-label="Siguiente"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-600" />
                        </button>

                        {/* Dots Indicator */}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                                        currentSlide === index ? 'bg-orange-600' : 'bg-orange-200'
                                    }`}
                                    aria-label={`Ir a diapositiva ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </AuthLayout>
    );
}