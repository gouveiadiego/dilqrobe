
import { Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import React from "react";
import { ProjectCompany } from "@/hooks/useProjectCompanies";

interface CompanySelectorPopoverProps {
  companies: ProjectCompany[];
  selectedCompanyId: string | null;
  onSelect: (companyId: string) => void;
  isLoading: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CompanySelectorPopover({
  companies,
  selectedCompanyId,
  onSelect,
  isLoading,
  isOpen,
  onOpenChange,
}: CompanySelectorPopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-8 w-8 ${selectedCompanyId ? 'text-purple-400 hover:text-purple-500' : 'text-gray-400 hover:text-gray-500'}`} disabled={isLoading}>
          <Building className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" className={`justify-start ${!selectedCompanyId ? 'text-purple-400' : ''}`} onClick={() => onSelect('')}>
            <Building className="h-4 w-4 mr-2" />
            Nenhuma empresa
          </Button>
          {companies.map(company => (
            <Button key={company.id} variant="ghost" className={`justify-start ${selectedCompanyId === company.id ? 'text-purple-400' : ''}`} onClick={() => onSelect(company.id)}>
              <Building className="h-4 w-4 mr-2" />
              {company.name}
            </Button>
          ))}
          {companies.length === 0 && !isLoading && (
            <span className="text-sm text-gray-400 p-2">
              Nenhuma empresa criada
            </span>
          )}
          {isLoading && (
            <span className="text-sm text-gray-400 p-2">
              Carregando...
            </span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
