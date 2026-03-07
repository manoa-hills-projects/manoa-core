interface SectionHeaderProps {
	name: string
	description: string
}

export const SectionHeader = ({
	name,
	description
}: SectionHeaderProps) => {
	return (
		<div className="flex items-center justify-between">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">{name}</h1>
				<p className="text-muted-foreground">
					{description}
				</p>
			</div>
		</div>
	)
}