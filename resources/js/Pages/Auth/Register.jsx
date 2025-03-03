import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Input } from '@/Components/ui/Input';
import { Button } from '@/Components/ui/Button';
import { Card } from '@/Components/ui/Card';
import { AuthLayout } from '@/Components/ui/AuthLayout';

export default function Register() {
    // Se inicializa el formulario con useForm, incluyendo el nuevo campo 'ruc'
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        ruc: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        // Envía el formulario a la ruta de registro (asegúrate de que en el backend se procese el campo 'ruc')
        post(route('register'));
    };

    return (
        <AuthLayout>
            <Head title="Registrarse" />

            <Card className="w-full max-w-md mx-auto p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                    Crear Cuenta
                </h2>
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <Input
                            type="text"
                            label="Nombre"
                            name="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                            placeholder="Ingresa tu nombre"
                            autoFocus
                        />
                    </div>
                    <div>
                        <Input
                            type="email"
                            label="Correo Electrónico"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
                            placeholder="Ingresa tu correo"
                        />
                    </div>
                    {/* Nuevo campo para RUC */}
                    <div>
                        <Input
                            type="text"
                            label="RUC"
                            name="ruc"
                            value={data.ruc}
                            onChange={(e) => setData('ruc', e.target.value)}
                            error={errors.ruc}
                            placeholder="Ingresa tu RUC"
                        />
                    </div>
                    <div>
                        <Input
                            type="password"
                            label="Contraseña"
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                            placeholder="Ingresa tu contraseña"
                        />
                    </div>
                    <div>
                        <Input
                            type="password"
                            label="Confirmar Contraseña"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            error={errors.password_confirmation}
                            placeholder="Confirma tu contraseña"
                        />
                    </div>
                    <div className="flex items-center justify-end">
                        <Link
                            href={route('login')}
                            className="text-sm text-gray-600 underline hover:text-gray-900"
                        >
                            ¿Ya tienes cuenta?
                        </Link>
                    </div>
                    <div>
                        <Button type="submit" className="w-full" isLoading={processing}>
                            Registrarse
                        </Button>
                    </div>
                </form>
            </Card>
        </AuthLayout>
    );
}
