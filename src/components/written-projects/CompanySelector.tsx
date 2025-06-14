
import React from "react";

type Company = { id: string; name: string };

interface CompanySelectorProps {
  companies: Company[];
  selectedCompany: Company | null;
  onSelect: (company: Company | null) => void;
  loading: boolean;
}

export function CompanySelector({ companies, selectedCompany, onSelect, loading }: CompanySelectorProps) {
  return (
    <div className="mb-4">
      <label className="block font-medium text-sm mb-1">Empresa:</label>
      <select
        className="w-full border-gray-200 rounded px-3 py-2"
        value={selectedCompany?.id || ""}
        disabled={loading}
        onChange={(e) => {
          const c = companies.find(comp => comp.id === e.target.value);
          onSelect(c || null);
        }}
      >
        <option value="">Selecione uma empresa</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
