import MainLayout from '@/Layouts/MainLayout';
import PageHeader from '@/Components/admin/PageHeader';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <MainLayout>
            <Head title="Mi perfil" />

            <div className="mx-auto max-w-4xl space-y-6">
                <PageHeader
                    title="Mi perfil"
                    description="Actualiza tus datos, cambia tu contraseña o elimina tu cuenta."
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </MainLayout>
    );
}
