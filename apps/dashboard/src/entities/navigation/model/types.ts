/**
 * Configuración de un item de navegación
 *
 * Los items pueden ser:
 * - Con `moduleKey` (como "houses"): el nombre, ruta e icono vienen de la API
 * - Sin `moduleKey` (públicos): se usan `title` y `url` directamente
 */
export interface NavigationConfig {
	/** Key del módulo en la DB (ej: "houses", "users") */
	moduleKey: string;
	/** Título (solo para items públicos sin moduleKey en DB) */
	title?: string;
	/** URL (solo para items públicos sin moduleKey en DB) */
	url?: string;
	/** Módulo requerido para ver este item (sin prop = visible para todos) */
	permission?: string;
}
