import { useState, useRef, useEffect } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DateTimePickerProps {
    value: string;
    onChange: (val: string) => void;
    className?: string;
}

export function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync input when prop value changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        onChange(e.target.value); // Simple sync, could add validation
    };

    const togglePopover = () => setIsOpen(!isOpen);

    // Calendar logic
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const selectDate = (day: number) => {
        const selected = new Date(currentMonth);
        selected.setDate(day);

        // Formato YYYY-MM-DDTHH:mm para compatibilidad con datetime-local
        const existingTime = value.includes('T') ? value.split('T')[1] : "12:00";
        const isoString = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}T${existingTime}`;

        setInputValue(isoString);
        onChange(isoString);
        // Don't close immediately to let user pick time if they want, 
        // but for now keeping it simple.
    };

    const changeMonth = (dir: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + dir, 1));
    };

    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);

    // Padding for start of month
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`blank-${i}`} className="h-8 w-8" />);
    }

    for (let d = 1; d <= totalDays; d++) {
        const isSelected = value.startsWith(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        days.push(
            <button
                key={d}
                onClick={() => selectDate(d)}
                className={cn(
                    "h-8 w-8 rounded-lg text-[10px] font-bold transition-all",
                    isSelected
                        ? "bg-[#9acd32] text-black shadow-[0_0_10px_rgba(154,205,50,0.4)]"
                        : "text-gray-400 hover:bg-white/10 hover:text-white"
                )}
            >
                {d}
            </button>
        );
    }

    // Time slots (simple hour selection)
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

    const selectTime = (h: number) => {
        const [datePart] = value.split('T');
        const newTime = `${String(h).padStart(2, '0')}:00`;
        const isoString = `${datePart || new Date().toISOString().split('T')[0]}T${newTime}`;
        setInputValue(isoString);
        onChange(isoString);
        setIsOpen(false);
    };

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="YYYY-MM-DD HH:mm"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#9acd32]/50 pr-10"
                />
                <button
                    type="button"
                    onClick={togglePopover}
                    className="absolute right-3 text-gray-500 hover:text-[#9acd32] transition-colors"
                >
                    <Calendar className="w-4 h-4" />
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 z-50 min-w-[280px] bg-[#12141a] border border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in duration-200 origin-top-left ring-1 ring-white/5">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                            {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white/5" onClick={() => changeMonth(-1)}>
                                <ChevronLeft className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white/5" onClick={() => changeMonth(1)}>
                                <ChevronRight className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                            <div key={d} className="h-8 w-8 flex items-center justify-center text-[9px] font-black text-gray-600">
                                {d}
                            </div>
                        ))}
                        {days}
                    </div>

                    <div className="border-t border-white/5 pt-4">
                        <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest block mb-2 px-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Seleccionar Hora
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                            {hours.map(h => (
                                <button
                                    key={h}
                                    onClick={() => selectTime(h)}
                                    className="py-1.5 rounded-md text-[9px] font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    {h}:00
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
