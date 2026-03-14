import { useState } from "react";
import { FileDown, Eye, Loader2 } from "lucide-react";
import { useRequests, downloadRequestDocument, REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, REQUEST_TYPE_LABELS } from "@/entities/requests";
import type { DocumentRequest } from "@/entities/requests";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import { RequestDetailSheet } from "./request-detail-sheet";
import { Skeleton } from "@/shared/ui/skeleton";

export function RequestHistoryTable({ mine = true }: { mine?: boolean }) {
    const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const { data: response, isLoading } = useRequests({ mine, limit: 50 });
    const requests = response?.data ?? [];

    // Handles ISO strings (from JSON serialization) and numeric Unix timestamps
    const parseDate = (val: string | number): Date => {
        if (typeof val === "string") return new Date(val);
        return new Date(val < 10_000_000_000 ? val * 1000 : val);
    };

    const handleDownload = async (req: DocumentRequest) => {
        setDownloadingId(req.id);
        try {
            await downloadRequestDocument(req.id);
        } finally {
            setDownloadingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                <p className="text-muted-foreground text-sm">No hay solicitudes registradas.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {requests.map((req) => {
                    const statusClass = REQUEST_STATUS_COLORS[req.status];
                    return (
                        <div
                            key={req.id}
                            className="flex items-center justify-between gap-4 rounded-xl border bg-card px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                <span className="font-medium text-sm">{REQUEST_TYPE_LABELS[req.type]}</span>
                                <span className="text-xs text-muted-foreground">
                                    {parseDate(req.createdAt).toLocaleDateString("es-VE", {
                                        year: "numeric", month: "long", day: "numeric",
                                    })}
                                </span>
                            </div>

                            <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", statusClass)}>
                                {REQUEST_STATUS_LABELS[req.status]}
                            </span>

                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedRequest(req)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                                {req.status === "approved" && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDownload(req)}
                                        disabled={downloadingId === req.id}
                                    >
                                        {downloadingId === req.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <FileDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <RequestDetailSheet
                request={selectedRequest}
                open={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
            />
        </>
    );
}
