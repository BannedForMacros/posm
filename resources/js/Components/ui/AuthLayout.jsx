export const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-50 p-4">
            {children}
        </div>
    );
};