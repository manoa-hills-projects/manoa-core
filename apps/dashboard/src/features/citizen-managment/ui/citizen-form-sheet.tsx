import { useEffect } from "react";
import { type Citizen } from "@/entities/citizens";
import { familyOptionAdapter, fetchFamiliesOptions } from "@/entities/families";
import { Button } from "@/shared/ui/button";
import { DataSheet } from "@/shared/ui/data-sheet";
import { Form } from "@/shared/ui/form";
import {
    FormCommandComboboxField,
    FormInputField,
    FormSelectField,
    FormSwitchField,
} from "@/shared/ui/form-fields";
import { useCitizenForm } from "../model/use-citizen-form";

interface CitizenFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    citizen?: Citizen | null;
}

export function CitizenFormSheet({
    open,
    onOpenChange,
    citizen,
}: CitizenFormSheetProps) {
    const isEditing = !!citizen;

    const { form, onSubmit, isSubmitting } = useCitizenForm({
        citizen,
        onSuccess: () => onOpenChange(false),
    });

    useEffect(() => {
        if (open) {
            form.reset({
                cedula: citizen?.cedula || "",
                names: citizen?.names || "",
                surnames: citizen?.surnames || "",
                gender: citizen?.gender || "",
                birth_date: citizen?.birth_date || "",
                is_head_of_household: citizen?.is_head_of_household || false,
                family_id: citizen?.family_id || "",
            });
        }
    }, [citizen, open, form]);

    return (
        <DataSheet
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? "Editar Ciudadano" : "Registrar Ciudadano"}
            description="Ingrese los datos del Ciudadano."
        >
            <Form {...form}>
                <form
                    onSubmit={onSubmit}
                    className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto px-1"
                >
                    <FormInputField control={form.control} name="cedula" label="Cédula" />
                    <div className="grid grid-cols-2 gap-4">
                        <FormInputField
                            control={form.control}
                            name="names"
                            label="Nombres"
                        />
                        <FormInputField
                            control={form.control}
                            name="surnames"
                            label="Apellidos"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormSelectField
                            control={form.control}
                            name="gender"
                            label="Género"
                            placeholder="Seleccione"
                            options={[
                                { label: "Masculino", value: "M" },
                                { label: "Femenino", value: "F" },
                            ]}
                        />
                        <FormInputField
                            control={form.control}
                            name="birth_date"
                            label="Fecha de Nacimiento"
                            type="date"
                        />
                    </div>

                    <FormCommandComboboxField
                        control={form.control}
                        name="family_id"
                        label="Familia"
                        placeholder="Buscar familia..."
                        initialLabel={citizen?.family_label}
                        fetcher={fetchFamiliesOptions}
                        getLabel={familyOptionAdapter.getLabel}
                        getValue={familyOptionAdapter.getValue}
                        renderOption={(item) => (
                            <div>{familyOptionAdapter.renderOption(item)}</div>
                        )}
                    />

                    <FormSwitchField
                        control={form.control}
                        name="is_head_of_household"
                        label="Jefe de Hogar"
                    />

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-4"
                    >
                        {isSubmitting ? "Guardando..." : "Guardar"}
                    </Button>
                </form>
            </Form>
        </DataSheet>
    );
}
