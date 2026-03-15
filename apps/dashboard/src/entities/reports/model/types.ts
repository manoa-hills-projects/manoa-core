export type ReportResource = "houses" | "families" | "citizens";

export interface ExportReportParams {
	resource: ReportResource;
	search?: string;
}
