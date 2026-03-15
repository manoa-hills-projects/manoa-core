export const housesConfig = {
	entityName: "Viviendas",
	singularName: "Vivienda",
	description: "Gestión de viviendas y sus datos asociados.",
	fields: {
		name: "Nombre",
		sector: "Sector",
		number: "Número",
		address: "Dirección",
		headOfHousehold: "Jefe de hogar",
	},
	emptyState: {
		title: "No hay viviendas registradas",
		description: "Agrega una nueva vivienda para comenzar.",
	},
	buttons: {
		create: "Registrar Vivienda",
		edit: "Editar Vivienda",
		delete: "Eliminar Vivienda",
	},
};
