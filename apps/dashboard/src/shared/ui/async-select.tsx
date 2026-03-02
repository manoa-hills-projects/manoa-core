"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import * as React from "react";

import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

export interface CommandComboboxProps<T> {
	value?: string | null;
	onChange: (value: string | null) => void;
	fetcher: (params: {
		search: string;
		limit: number;
	}) => Promise<T[]>;
	renderOption: (item: T) => React.ReactNode;
	getLabel: (item: T) => string;
	getValue: (item: T) => string;
	renderSelected?: (item: T) => React.ReactNode;
	label?: string;
	placeholder?: string;
	emptyMessage?: string;
	limit?: number;
	className?: string;
}

export function CommandCombobox<T>({
	value,
	onChange,
	fetcher,
	renderOption,
	getLabel,
	getValue,
	renderSelected,
	label = "Seleccionar...",
	placeholder = "Buscar...",
	emptyMessage = "No se encontraron resultados.",
	limit = 10,
	className,
}: CommandComboboxProps<T>) {
	const [open, setOpen] = React.useState(false);
	const [selectedLabel, setSelectedLabel] = React.useState<string>("");
	const [selectedItem, setSelectedItem] = React.useState<T | null>(null);
	const [items, setItems] = React.useState<T[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [search, setSearch] = React.useState("");
	const labelsCacheRef = React.useRef<Map<string, string>>(new Map());
	const debouncedSearch = useDebounce(search, 500);

	// Load options on open/search
	React.useEffect(() => {
		let isMounted = true;

		const loadData = async () => {
			setLoading(true);
			setItems([]);
			try {
				const result = await fetcher({
					search: debouncedSearch,
					limit,
				});
				if (isMounted) {
					for (const item of result) {
						labelsCacheRef.current.set(getValue(item), getLabel(item));
					}
					setItems(result);
				}
			} catch (error) {
				console.error("CommandCombobox fetch error:", error);
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		if (open) {
			loadData();
		}

		return () => {
			isMounted = false;
		};
	}, [fetcher, debouncedSearch, open, limit]);

	// Find label for selected value
	React.useEffect(() => {
		if (value) {
			const item = items.find((i) => getValue(i) === value);
			if (item) {
				const itemLabel = getLabel(item);
				labelsCacheRef.current.set(value, itemLabel);
				setSelectedItem(item);
				setSelectedLabel(itemLabel);
			} else {
				setSelectedItem(null);
				setSelectedLabel(labelsCacheRef.current.get(value) ?? "");
			}
		} else {
			setSelectedItem(null);
			setSelectedLabel("");
		}
	}, [value, items, getValue, getLabel]);

	const handleSelect = (currentValue: string) => {
		const newValue = currentValue === value ? null : currentValue;
		onChange(newValue);
		setOpen(false);

		// Update label immediately for better UX
		const item = items.find((i) => getValue(i) === currentValue);
		if (item) {
			const itemLabel = getLabel(item);
			labelsCacheRef.current.set(currentValue, itemLabel);
			setSelectedItem(item);
			setSelectedLabel(itemLabel);
		} else {
			setSelectedItem(null);
			setSelectedLabel("");
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-full justify-between", className)}
				>
					{value ? (
						renderSelected && selectedItem ? (
							renderSelected(selectedItem)
						) : (
							<span className="truncate">{selectedLabel || label}</span>
						)
					) : (
						<span className="text-muted-foreground">{label}</span>
					)}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[--radix-popover-trigger-width] p-0"
				align="start"
			>
				<Command shouldFilter={false}>
					<CommandInput
						placeholder={placeholder}
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						{loading ? (
							<div className="flex items-center justify-center p-4">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						) : items.length === 0 ? (
							<CommandEmpty>{emptyMessage}</CommandEmpty>
						) : (
							<CommandGroup>
								{items.map((item) => {
									const itemValue = getValue(item);
									return (
										<CommandItem
											key={itemValue}
											value={itemValue}
											onSelect={handleSelect}
										>
											<Check
												className={cn(
													"mr-2 h-4 w-4",
													value === itemValue ? "opacity-100" : "opacity-0",
												)}
											/>
											{renderOption(item)}
										</CommandItem>
									);
								})}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

export type AsyncSelectProps<T> = CommandComboboxProps<T>;
export const AsyncSelect = CommandCombobox;
