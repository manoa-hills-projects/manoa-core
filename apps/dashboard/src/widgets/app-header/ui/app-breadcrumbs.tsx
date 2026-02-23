import { useMatches, Link } from '@tanstack/react-router'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb"
import React from 'react'

export function AppBreadcrumbs() {
	const matches = useMatches()
	const breadcrumbMatches = matches.filter((match) => match.staticData.breadcrumb)

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbMatches.map((match, index) => {
					const isLast = index === breadcrumbMatches.length - 1

					return (
						<React.Fragment key={match.id}>
							<BreadcrumbItem>
								{isLast ? (
									<BreadcrumbPage>{match.staticData.breadcrumb}</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<Link from={match.fullPath}>
											{match.staticData.breadcrumb}
										</Link>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{!isLast && <BreadcrumbSeparator />}
						</React.Fragment>
					)
				})}
			</BreadcrumbList>
		</Breadcrumb>
	)
}