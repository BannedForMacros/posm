export const Card = ({ children, className = '' }) => {
    return (
        <div className={`
            bg-white rounded-2xl shadow-xl
            overflow-hidden
            ${className}
        `}>
            {children}
        </div>
    );
};
