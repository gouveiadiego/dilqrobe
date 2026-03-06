import { useEffect, useState } from "react";
import { useFitness, FitnessProfile, FitnessMeasurement, BodyMeasurement } from "@/hooks/useFitness";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit3 } from "lucide-react";

export function FitnessForm({
    profile,
    initialBioData,
    initialBodyData,
    triggerNode
}: {
    profile: FitnessProfile,
    initialBioData?: FitnessMeasurement,
    initialBodyData?: BodyMeasurement,
    triggerNode?: React.ReactNode
}) {
    const [open, setOpen] = useState(false);
    const { addMeasurement, addBodyMeasurement, updateMeasurement, updateBodyMeasurement } = useFitness(profile.id);
    const [activeTab, setActiveTab] = useState(initialBodyData ? "body" : "bio");

    // Bio state
    const [weight, setWeight] = useState(initialBioData?.weight_kg?.toString() || "");
    const [fatPct, setFatPct] = useState(initialBioData?.body_fat_pct?.toString() || "");
    const [muscle, setMuscle] = useState(initialBioData?.muscle_mass_kg?.toString() || "");
    const [water, setWater] = useState(initialBioData?.water_pct?.toString() || "");
    const [visceral, setVisceral] = useState(initialBioData?.visceral_fat?.toString() || "");
    const [bone, setBone] = useState(initialBioData?.bone_mass_kg?.toString() || "");
    const [bmr, setBmr] = useState(initialBioData?.bmr_kcal?.toString() || "");
    const [protein, setProtein] = useState(initialBioData?.protein_pct?.toString() || "");
    const [metabolicAge, setMetabolicAge] = useState(initialBioData?.metabolic_age?.toString() || "");

    const [measDate, setMeasDate] = useState(() => {
        if (initialBioData) return initialBioData.measured_at.split('T')[0];
        if (initialBodyData) return initialBodyData.measured_at.split('T')[0];
        return new Date().toISOString().split('T')[0];
    });

    // Body state
    const [chest, setChest] = useState(initialBodyData?.chest_cm?.toString() || "");
    const [waist, setWaist] = useState(initialBodyData?.waist_cm?.toString() || "");
    const [abdomen, setAbdomen] = useState(initialBodyData?.abdomen_cm?.toString() || "");
    const [hip, setHip] = useState(initialBodyData?.hip_cm?.toString() || "");
    const [armL, setArmL] = useState(initialBodyData?.left_arm_cm?.toString() || "");
    const [armR, setArmR] = useState(initialBodyData?.right_arm_cm?.toString() || "");
    const [thighL, setThighL] = useState(initialBodyData?.left_thigh_cm?.toString() || "");
    const [thighR, setThighR] = useState(initialBodyData?.right_thigh_cm?.toString() || "");
    const [calfL, setCalfL] = useState(initialBodyData?.left_calf_cm?.toString() || "");
    const [calfR, setCalfR] = useState(initialBodyData?.right_calf_cm?.toString() || "");

    // Reset when open changes if we are editing
    useEffect(() => {
        if (open) {
            setWeight(initialBioData?.weight_kg?.toString() || "");
            setFatPct(initialBioData?.body_fat_pct?.toString() || "");
            setMuscle(initialBioData?.muscle_mass_kg?.toString() || "");
            setWater(initialBioData?.water_pct?.toString() || "");
            setVisceral(initialBioData?.visceral_fat?.toString() || "");
            setBone(initialBioData?.bone_mass_kg?.toString() || "");
            setBmr(initialBioData?.bmr_kcal?.toString() || "");
            setProtein(initialBioData?.protein_pct?.toString() || "");
            setMetabolicAge(initialBioData?.metabolic_age?.toString() || "");

            setChest(initialBodyData?.chest_cm?.toString() || "");
            setWaist(initialBodyData?.waist_cm?.toString() || "");
            setAbdomen(initialBodyData?.abdomen_cm?.toString() || "");
            setHip(initialBodyData?.hip_cm?.toString() || "");
            setArmL(initialBodyData?.left_arm_cm?.toString() || "");
            setArmR(initialBodyData?.right_arm_cm?.toString() || "");
            setThighL(initialBodyData?.left_thigh_cm?.toString() || "");
            setThighR(initialBodyData?.right_thigh_cm?.toString() || "");
            setCalfL(initialBodyData?.left_calf_cm?.toString() || "");
            setCalfR(initialBodyData?.right_calf_cm?.toString() || "");

            if (initialBioData) setMeasDate(initialBioData.measured_at.split('T')[0]);
            else if (initialBodyData) setMeasDate(initialBodyData.measured_at.split('T')[0]);
            else setMeasDate(new Date().toISOString().split('T')[0]);
        }
    }, [open, initialBioData, initialBodyData]);

    const handleSaveBio = () => {
        const payload = {
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
        };

        if (initialBioData?.id) {
            updateMeasurement({ id: initialBioData.id, updates: payload });
        } else {
            addMeasurement(payload);
        }
        setOpen(false);
    };

    const handleSaveBody = () => {
        const payload = {
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
        };

        if (initialBodyData?.id) {
            updateBodyMeasurement({ id: initialBodyData.id, updates: payload });
        } else {
            addBodyMeasurement(payload);
        }
        setOpen(false);
    };

    const isEditing = !!initialBioData || !!initialBodyData;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerNode || (
                    <Button className="w-full bg-dilq-accent text-white hover:bg-dilq-accent/90 gap-2">
                        <Plus className="h-4 w-4" /> Registrar Medição
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[90vw]">
                <DialogHeader><DialogTitle>{isEditing ? 'Editar Medição' : 'Nova Medição'} - {profile.name}</DialogTitle></DialogHeader>

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
                            <Button onClick={handleSaveBio} disabled={!weight}>{isEditing ? 'Salvar Alterações' : 'Salvar Balança'}</Button>
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
                            <Button onClick={handleSaveBody}>{isEditing ? 'Salvar Alterações' : 'Salvar Medidas'}</Button>
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
