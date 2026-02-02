import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  ChevronDown,
  ArrowRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears, startOfQuarter, endOfQuarter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface PeriodFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type PresetType = 
  | "this-month" 
  | "last-month" 
  | "last-3-months" 
  | "last-6-months" 
  | "this-quarter"
  | "last-quarter"
  | "this-year" 
  | "last-year"
  | "all-time"
  | "custom";

const presets: { value: PresetType; label: string }[] = [
  { value: "this-month", label: "Este mês" },
  { value: "last-month", label: "Mês passado" },
  { value: "last-3-months", label: "Últimos 3 meses" },
  { value: "last-6-months", label: "Últimos 6 meses" },
  { value: "this-quarter", label: "Este trimestre" },
  { value: "last-quarter", label: "Trimestre passado" },
  { value: "this-year", label: "Este ano" },
  { value: "last-year", label: "Ano passado" },
  { value: "all-time", label: "Todo o período" },
  { value: "custom", label: "Personalizado" },
];

const getPresetRange = (preset: PresetType): DateRange => {
  const today = new Date();
  
  switch (preset) {
    case "this-month":
      return {
        startDate: startOfMonth(today),
        endDate: endOfMonth(today),
        label: format(today, "MMMM 'de' yyyy", { locale: ptBR }),
      };
    case "last-month":
      const lastMonth = subMonths(today, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth),
        label: format(lastMonth, "MMMM 'de' yyyy", { locale: ptBR }),
      };
    case "last-3-months":
      return {
        startDate: startOfMonth(subMonths(today, 2)),
        endDate: endOfMonth(today),
        label: "Últimos 3 meses",
      };
    case "last-6-months":
      return {
        startDate: startOfMonth(subMonths(today, 5)),
        endDate: endOfMonth(today),
        label: "Últimos 6 meses",
      };
    case "this-quarter":
      return {
        startDate: startOfQuarter(today),
        endDate: endOfQuarter(today),
        label: `${Math.ceil((today.getMonth() + 1) / 3)}º Trimestre ${today.getFullYear()}`,
      };
    case "last-quarter":
      const lastQuarterDate = subMonths(startOfQuarter(today), 1);
      return {
        startDate: startOfQuarter(lastQuarterDate),
        endDate: endOfQuarter(lastQuarterDate),
        label: `${Math.ceil((lastQuarterDate.getMonth() + 1) / 3)}º Trimestre ${lastQuarterDate.getFullYear()}`,
      };
    case "this-year":
      return {
        startDate: startOfYear(today),
        endDate: endOfYear(today),
        label: `Ano ${today.getFullYear()}`,
      };
    case "last-year":
      const lastYear = subYears(today, 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear),
        label: `Ano ${lastYear.getFullYear()}`,
      };
    case "all-time":
      return {
        startDate: new Date(2000, 0, 1),
        endDate: endOfYear(today),
        label: "Todo o período",
      };
    default:
      return {
        startDate: startOfMonth(today),
        endDate: endOfMonth(today),
        label: format(today, "MMMM 'de' yyyy", { locale: ptBR }),
      };
  }
};

export const PeriodFilter = ({ value, onChange }: PeriodFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType>("this-month");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(value.startDate);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(value.endDate);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const handlePresetChange = (preset: PresetType) => {
    setSelectedPreset(preset);
    
    if (preset === "custom") {
      setShowCustomPicker(true);
      return;
    }
    
    setShowCustomPicker(false);
    const range = getPresetRange(preset);
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStartDate && customEndDate) {
      const startLabel = format(customStartDate, "dd/MM/yy", { locale: ptBR });
      const endLabel = format(customEndDate, "dd/MM/yy", { locale: ptBR });
      
      onChange({
        startDate: customStartDate,
        endDate: customEndDate,
        label: `${startLabel} - ${endLabel}`,
      });
      setIsOpen(false);
    }
  };

  // Generate year options for quick year selection
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year);
    }
    return years;
  }, []);

  // Generate month options for quick month selection
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: format(new Date(2000, i, 1), "MMMM", { locale: ptBR }),
    }));
  }, []);

  const [quickYear, setQuickYear] = useState(new Date().getFullYear());
  const [quickMonth, setQuickMonth] = useState(new Date().getMonth());

  const handleQuickSelect = () => {
    const selectedDate = new Date(quickYear, quickMonth, 1);
    onChange({
      startDate: startOfMonth(selectedDate),
      endDate: endOfMonth(selectedDate),
      label: format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR }),
    });
    setSelectedPreset("custom");
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "min-w-[200px] justify-between gap-2 bg-gradient-to-r from-dilq-purple to-dilq-accent text-white border-0 hover:opacity-90 hover:text-white",
            "shadow-md transition-all duration-200"
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="font-medium capitalize">{value.label}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-auto p-0 bg-white border border-gray-200 shadow-xl" 
        align="start"
        sideOffset={8}
      >
        <div className="flex flex-col md:flex-row">
          {/* Presets Column */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-gray-100 min-w-[180px]">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Períodos rápidos
            </p>
            <div className="flex flex-col gap-1">
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal h-8",
                    selectedPreset === preset.value && preset.value !== "custom" 
                      ? "bg-dilq-purple/10 text-dilq-purple font-medium" 
                      : "hover:bg-gray-100"
                  )}
                  onClick={() => handlePresetChange(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Month/Year Selection */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-gray-100">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Selecionar mês
            </p>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select
                  value={quickYear.toString()}
                  onValueChange={(v) => setQuickYear(parseInt(v))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={quickMonth.toString()}
                  onValueChange={(v) => setQuickMonth(parseInt(v))}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        <span className="capitalize">{month.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                size="sm" 
                className="w-full bg-dilq-purple hover:bg-dilq-purple/90"
                onClick={handleQuickSelect}
              >
                Aplicar
              </Button>
            </div>

            {/* Year Quick Buttons */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                Ano inteiro
              </p>
              <div className="flex flex-wrap gap-1">
                {yearOptions.slice(0, 5).map((year) => (
                  <Button
                    key={year}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const yearDate = new Date(year, 0, 1);
                      onChange({
                        startDate: startOfYear(yearDate),
                        endDate: endOfYear(yearDate),
                        label: `Ano ${year}`,
                      });
                      setSelectedPreset("custom");
                      setIsOpen(false);
                    }}
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {showCustomPicker && (
            <div className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Período personalizado
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Data inicial</p>
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    locale={ptBR}
                    className={cn("rounded-md border p-3 pointer-events-auto")}
                    disabled={(date) => customEndDate ? date > customEndDate : false}
                  />
                </div>
                
                <div className="hidden sm:flex items-center justify-center py-8">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Data final</p>
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    locale={ptBR}
                    className={cn("rounded-md border p-3 pointer-events-auto")}
                    disabled={(date) => customStartDate ? date < customStartDate : false}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCustomPicker(false);
                    setSelectedPreset("this-month");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="bg-dilq-purple hover:bg-dilq-purple/90"
                  onClick={handleCustomApply}
                  disabled={!customStartDate || !customEndDate}
                >
                  Aplicar período
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PeriodFilter;
