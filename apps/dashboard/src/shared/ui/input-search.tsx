import { useId } from 'react'

import { SearchIcon, type LucideIcon } from 'lucide-react'
import { Label } from './label'
import { Input } from './input'

interface InputSearchProps {
	placeholder?: string;
	label: string;
	icon?: LucideIcon;
	value?: string;
	onChange?: (value: string) => void;
}

export const InputSearch = ({ placeholder, label, icon: Icon = SearchIcon, value, onChange }: InputSearchProps) => {
	const id = useId()

	return (
		<div className='w-full max-w-xs space-y-2'>
			<Label htmlFor={id}>
				{label}
			</Label>
			<div className='relative'>
				<div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
					{Icon && <Icon className='size-4' />}
					<span className='sr-only'>{label}</span>
				</div>
				<Input 
				  id={id} 
				  type='text' 
				  placeholder={placeholder} 
				  className='peer pl-9' 
				  value={value} 
				  onChange={(e) => onChange?.(e.target.value)} 
				/>
			</div>
		</div>
	)
}