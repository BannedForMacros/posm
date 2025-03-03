export const Checkbox = ({ label, className = '', ...props }) => {
    return (
        <label className={`inline-flex items-center ${className}`}>
            <input
                type="checkbox"
                className="
                    rounded border-gray-300 text-orange-600
                    focus:ring-orange-500
                    h-4 w-4
                    transition duration-150
                "
                {...props}
            />
            {label && (
                <span className="ml-2 text-sm text-gray-600">{label}</span>
            )}
        </label>
    );
};
