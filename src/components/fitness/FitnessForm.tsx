import { useState } from "react";
import { useFitness, FitnessProfile } from "@/hooks/useFitness";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function FitnessForm({ profile }: { profile: FitnessProfile }) {
    const [open, setOpen] = useState(false);
    const { addMeasurement, addBodyMeasurement } = useFitness(profile.id);
    const [activeTab, setActiveTab] = useState("bio");

    // Bio state
    const [weight, setWeight] = useState("");
    const [fatPct, setFatPct] = useState("");
    const [muscle, setMuscle] = useState("");
    const [water, setWater] = useState("");
    const [visceral, setVisceral] = useState("");
    const [bone, setBone] = useState("");
    const [bmr, setBmr] = useState("");
    const [protein, setProtein] = useState("");
    const [metabolicAge, setMetabolicAge] = useState("");
    const [measDate, setMeasDate] = useState(new Date().toISOString().split('T')[0]);

    // Body state
    const [chest, setChest] = useState("");
    const [waist, setWaist] = useState("");
    const [abdomen, setAbdomen] = useState("");
    const [hip, setHip] = useState("");
    const [armL, setArmL] = useState("");
    const [armR, setArmR] = useState("");
    const [thighL, setThighL] = useState("");
    const [thighR, setThighR] = useState("");
    const [calfL, setCalfL] = useState("");
    const [calfR, setCalfR] = useState("");

    const handleSaveBio = () => {
        addMeasurement({
            profile_id: profile.id,
            measured_at: measDate,
            weight_kg: weight ? parseFloat(weight) : null,
            body_fat_pct: fatPct ? parseFloat(fatPct) : null,
            muscle_mass_kg: muscle ? parseFloat(muscle) : null,
            water_pct: water ? parseFloat(water) : null,
            visceral_fat: visceral ? parseFloat(visceral) : null,
            bone_mass_kg: bone ? parseFloat(bone) : null,
            bmr_kcal: bmr ? parseInt(bmr) : null,
            protein_pct: protein ? parseFloat(protein) : null,
            metabolic_age: metabolicAge ? parseInt(metabolicAge) : null,
            // Auto-calculate BMI if height exists
            bmi: (weight && profile.height_cm) ? parseFloat((parseFloat(weight) / Math.pow(profile.height_cm / 100, 2)).toFixed(1)) : null,
        });
        setOpen(false);
    };

    const handleSaveBody = () => {
        addBodyMeasurement({
            profile_id: profile.id,
            measured_at: measDate,
            chest_cm: chest ? parseFloat(chest) : null,
            waist_cm: waist ? parseFloat(waist) : null,
            abdomen_cm: abdomen ? parseFloat(abdomen) : null,
            hip_cm: hip ? parseFloat(hip) : null,
            left_arm_cm: armL ? parseFloat(armL) : null,
            right_arm_cm: armR ? parseFloat(armR) : null,
            left_thigh_cm: thighL ? parseFloat(thighL) : null,
            right_thigh_cm: thighR ? parseFloat(thighR) : null,
            left_calf_cm: calfL ? parseFloat(calfL) : null,
            right_calf_cm: calfR ? parseFloat(calfR) : null,
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full bg-dilq-accent text-white hover:bg-dilq-accent/90 gap-2">
                    <Plus className="h-4 w-4" /> Registrar Medição
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nova Medição - {profile.name}</DialogTitle></DialogHeader>

                <div className="mb-4">
                    <label className="text-sm font-medium mb-1 block">Data da Medição</label>
                    <Input type="date" value={measDate} onChange={e => setMeasDate(e.target.value)} className="w-48" />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="bio">Balança (Bioimpedância)</TabsTrigger>
                        <TabsTrigger value="body">Fita (Medidas Corporais)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="bio" className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <InputField label="Peso (kg)" value={weight} onChange={setWeight} autoFocus />
                            <InputField label="% Gordura" value={fatPct} onChange={setFatPct} />
                            <InputField label="Massa Muscular (kg)" value={muscle} onChange={setMuscle} />
                            <InputField label="% Água" value={water} onChange={setWater} />
                            <InputField label="Gordura Visceral (1-20)" value={visceral} onChange={setVisceral} />
                            <InputField label="Massa Óssea (kg)" value={bone} onChange={setBone} />
                            <InputField label="Taxa Metabólica (kcal)" value={bmr} onChange={setBmr} />
                            <InputField label="% Proteína" value={protein} onChange={setProtein} />
                            <InputField label="Idade Metabólica" value={metabolicAge} onChange={setMetabolicAge} />
                        </div>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveBio} disabled={!weight}>Salvar Balança</Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="body" className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <InputField label="Peito (cm)" value={chest} onChange={setChest} />
                            <InputField label="Cintura (cm)" value={waist} onChange={setWaist} />
                            <InputField label="Abdômen (cm)" value={abdomen} onChange={setAbdomen} />
                            <InputField label="Quadril (cm)" value={hip} onChange={setHip} />

                            <InputField label="Braço Esq. (cm)" value={armL} onChange={setArmL} />
                            <InputField label="Braço Dir. (cm)" value={armR} onChange={setArmR} />

                            <InputField label="Coxa Esq. (cm)" value={thighL} onChange={setThighL} />
                            <InputField label="Coxa Dir. (cm)" value={thighR} onChange={setThighR} />

                            <InputField label="Panturrilha Esq. (cm)" value={calfL} onChange={setCalfL} />
                            <InputField label="Panturrilha Dir. (cm)" value={calfR} onChange={setCalfR} />
                        </div>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveBody}>Salvar Medidas</Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

function InputField({ label, value, onChange, autoFocus }: { label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
    return (
        <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
            <Input type="number" step="0.1" value={value} onChange={e => onChange(e.target.value)} autoFocus={autoFocus} className="h-9" />
        </div>
    );
}
