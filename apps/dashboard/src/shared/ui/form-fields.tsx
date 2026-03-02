"use client";

import type { Control, FieldValues, Path } from "react-hook-form";

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { CommandCombobox, type CommandComboboxProps } from "./async-select";

interface BaseFieldProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
	label?: string;
	description?: string;
	className?: string;
}

interface FormInputFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
	placeholder?: string;
	type?: string;
}

export function FormInputField<T extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	type = "text",
	className,
}: FormInputFieldProps<T>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<Input {...field} placeholder={placeholder} type={type} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

interface FormSelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
	placeholder?: string;
	options: { label: string; value: string }[];
}

export function FormSelectField<T extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	options,
	className,
}: FormSelectFieldProps<T>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && <FormLabel>{label}</FormLabel>}
					<Select onValueChange={field.onChange} defaultValue={field.value}>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder={placeholder} />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

interface FormSwitchFieldProps<T extends FieldValues> extends BaseFieldProps<T> {}

export function FormSwitchField<T extends FieldValues>({
	control,
	name,
	label,
	className,
}: FormSwitchFieldProps<T>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem
					className={
						"flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm " +
						className
					}
				>
					<div className="space-y-0.5">{label && <FormLabel>{label}</FormLabel>}</div>
					<FormControl>
						<Switch checked={field.value} onCheckedChange={field.onChange} />
					</FormControl>
				</FormItem>
			)}
		/>
	);
}

interface FormCommandComboboxFieldProps<TField extends FieldValues, TData>
	extends BaseFieldProps<TField>,
		Omit<CommandComboboxProps<TData>, "value" | "onChange" | "label"> {}

export function FormCommandComboboxField<TField extends FieldValues, TData>({
	control,
	name,
	label,
	className,
	...props
}: FormCommandComboboxFieldProps<TField, TData>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<CommandCombobox
							value={field.value ?? ""}
							onChange={(value) => field.onChange(value ?? "")}
							{...props}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

export const FormAsyncSelectField = FormCommandComboboxField;
