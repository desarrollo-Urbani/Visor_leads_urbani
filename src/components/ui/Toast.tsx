import React, { useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = "success", onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
    };

    const bgColors = {
        success: "bg-green-50 border-green-200",
        error: "bg-red-50 border-red-200",
        info: "bg-blue-50 border-blue-200",
    };

    return (
        <div className={`fixed bottom-6 right-6 z-[1000] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl animate-in slide-in-from-right-10 fade-in duration-300 ${bgColors[type]}`}>
            {icons[type]}
            <span className="text-[14px] font-bold text-slate-800">{message}</span>
            <button onClick={onClose} className="ml-2 hover:bg-black/5 p-1 rounded-full transition-colors">
                <X className="h-4 w-4 text-slate-400" />
            </button>
        </div>
    );
};

export default Toast;
