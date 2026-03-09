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
import { Textarea } from "@/shared/ui/textarea";
import { CommandCombobox, type CommandComboboxProps } from "./async-select";
import type { LucideIcon } from "lucide-react";

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
	icon?: LucideIcon;
}

export function FormInputField<T extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	type = "text",
	className,
	icon: Icon,
}: FormInputFieldProps<T>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && <FormLabel>{label}</FormLabel>}
					<div className="relative">
						{Icon && <Icon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />}
						<FormControl>
							<Input
								{...field}
								value={field.value ?? ""}
								placeholder={placeholder}
								type={type}
								className={Icon ? "pl-8" : undefined}
							/>
						</FormControl>
					</div>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

interface FormTextareaFieldProps<T extends FieldValues>
	extends BaseFieldProps<T> {
	placeholder?: string;
	rows?: number;
}

export function FormTextareaField<T extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	rows = 3,
	className,
}: FormTextareaFieldProps<T>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<Textarea {...field} placeholder={placeholder} rows={rows} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

interface FormSelectFieldProps<T extends FieldValues>
	extends BaseFieldProps<T> {
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

interface FormSwitchFieldProps<T extends FieldValues>
	extends BaseFieldProps<T> { }

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
					<div className="space-y-0.5">
						{label && <FormLabel>{label}</FormLabel>}
					</div>
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
	Omit<CommandComboboxProps<TData>, "value" | "onChange" | "label"> {
	initialLabel?: string | null;
}

export function FormCommandComboboxField<TField extends FieldValues, TData>({
	control,
	name,
	label,
	className,
	initialLabel,
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
							initialLabel={initialLabel}
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
