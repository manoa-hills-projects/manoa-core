import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ResidencyLetterPayload } from "./dto/create-request.dto";
import type { CouncilSignatory } from "@/shared/database/schemas";

export const generateResidencyLetterPdf = async (
    payload: ResidencyLetterPayload,
    signatories: CouncilSignatory[],
    requestId: string,
): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const marginX = 60;
    let y = height - 60;

    // ── Helper: word-wrap ────────────────────────────────────────
    const drawWrapped = (
        text: string,
        font: typeof regularFont,
        size: number,
        startY: number,
    ): number => {
        const maxW = width - marginX * 2;
        const words = text.split(" ");
        let line = "";
        let cy = startY;
        for (const word of words) {
            const test = line ? `${line} ${word}` : word;
            if (font.widthOfTextAtSize(test, size) > maxW && line) {
                page.drawText(line, { x: marginX, y: cy, size, font, color: rgb(0, 0, 0) });
                cy -= size + 5;
                line = word;
            } else {
                line = test;
            }
        }
        if (line) {
            page.drawText(line, { x: marginX, y: cy, size, font, color: rgb(0, 0, 0) });
            cy -= size + 5;
        }
        return cy;
    };

    // ── Header ───────────────────────────────────────────────────
    const headerLines = [
        "REPÚBLICA BOLIVARIANA DE VENEZUELA",
        "MINISTERIO DEL PODER POPULAR PARA LAS COMUNAS",
        "Y MOVIMIENTOS SOCIALES",
        'CONSEJO COMUNAL "MANOA BICENTENARIO 10-20"',
        "SAN FÉLIX, EDO. BOLÍVAR",
        "RIF N.- 3317423860-EYA",
    ];
    for (const line of headerLines) {
        const w = boldFont.widthOfTextAtSize(line, 9);
        page.drawText(line, { x: (width - w) / 2, y, size: 9, font: boldFont, color: rgb(0, 0, 0) });
        y -= 13;
    }
    y -= 18;

    // ── Title ────────────────────────────────────────────────────
    const title = "CARTA DE RESIDENCIA";
    const titleW = boldFont.widthOfTextAtSize(title, 13);
    page.drawText(title, { x: (width - titleW) / 2, y, size: 13, font: boldFont, color: rgb(0, 0, 0) });
    y -= 28;

    // ── Body ─────────────────────────────────────────────────────
    const body =
        `Por medio de la presente, los Voceros y Voceras pertenecientes al Consejo Comunal ` +
        `"MANOA BICENTENARIO 10-20", ubicado en el Sector Manoa, Parroquia Simón Bolívar, ` +
        `Municipio Caroni, del Estado Bolívar, hacemos constar que el (la) ciudadano (a): ` +
        `${payload.fullName}, ${payload.nationality}, mayor de edad, de este domicilio, portador (a) ` +
        `de la cédula de identidad Nro. ${payload.idNumber}, reside en esta comunidad desde hace ` +
        `${payload.yearsOfResidence} año(s), en la residencia ubicada en la calle ${payload.streetName}, ` +
        `casa Nro. ${payload.houseNumber}.`;
    y = drawWrapped(body, regularFont, 11, y);

    y -= 20;

    // ── Issue date ───────────────────────────────────────────────
    const dateText =
        `Constancia que se expide a petición de la parte interesada, a los ${payload.issueDay} días del mes de ${payload.issueMonth} del 2025.`;
    y = drawWrapped(dateText, regularFont, 11, y);

    y -= 16;

    // ── Por el Consejo Comunal ───────────────────────────────────
    const porCC = "Por el Consejo Comunal";
    page.drawText(porCC, {
        x: (width - boldFont.widthOfTextAtSize(porCC, 11)) / 2,
        y,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0),
    });
    y -= 48;

    // ── Helper: draw a signature block ───────────────────────────
    const sigMap: Record<string, CouncilSignatory | undefined> = {};
    for (const s of signatories) sigMap[s.role] = s;

    const drawSigBlock = async (
        x: number,
        role: string,
        label: string,
        yStart: number,
        lineLen: number,
    ) => {
        const sig = sigMap[role];
        const nameText = sig?.name?.trim() || "_____________________";
        const ciText = sig?.idNumber?.trim() ? `C.I.: ${sig.idNumber}` : "C.I.: ___________________";
        const imgData = sig?.signatureImage?.trim() || null;

        // Draw signature line
        page.drawLine({
            start: { x, y: yStart },
            end: { x: x + lineLen, y: yStart },
            thickness: 0.7,
            color: rgb(0, 0, 0),
        });

        // Signature image
        if (imgData) {
            try {
                // Strip data URL prefix to get raw base64
                const commaIdx = imgData.indexOf(",");
                const b64 = commaIdx >= 0 ? imgData.slice(commaIdx + 1) : imgData;
                const isPng = imgData.startsWith("data:image/png");

                // Decode base64 → Uint8Array
                const binaryStr = atob(b64);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

                const embeddedImg = isPng
                    ? await pdfDoc.embedPng(bytes)
                    : await pdfDoc.embedJpg(bytes);

                // Scale to fit within lineLen × 30 px (keep height small to avoid overlap with adjacent row)
                const maxW = lineLen;
                const maxH = 30;
                const dims = embeddedImg.scaleToFit(maxW, maxH);
                page.drawImage(embeddedImg, {
                    x,
                    y: yStart + 3, // just above the line
                    width: dims.width,
                    height: dims.height,
                });
            } catch {
                // Ignore decoding errors, we will still print the name below
            }
        }

        // Printed name
        page.drawText(nameText, { x, y: yStart - 13, size: 9, font: regularFont, color: rgb(0, 0, 0) });

        // Role label
        page.drawText(label, { x, y: yStart - 25, size: 9, font: boldFont, color: rgb(0, 0, 0) });

        // C.I.
        page.drawText(ciText, { x, y: yStart - 37, size: 9, font: regularFont, color: rgb(0, 0, 0) });
    };


    const col1 = marginX;
    const col2 = width / 2 + 10;
    const lineLen = 200;

    await drawSigBlock(col1, "vocero_electoral", "Vocero de Unidad Electoral", y, lineLen);
    await drawSigBlock(col2, "vocero_contraloria", "Vocero de Contraloría", y, lineLen);

    y -= 85; // extra space needed so testigo images don't overlap vocero label/CI text

    await drawSigBlock(col1, "testigo_1", "Testigo 1", y, lineLen);
    await drawSigBlock(col2, "testigo_2", "Testigo 2", y, lineLen);

    y -= 55;

    // ── Footer ───────────────────────────────────────────────────
    page.drawText(
        "* Esta carta tiene una validez de 90 días a partir de la fecha de emisión.",
        { x: marginX, y, size: 8, font: regularFont, color: rgb(0.4, 0.4, 0.4) },
    );

    // ── QR Code ──────────────────────────────────────────────────
    try {
        const verifyUrl = `https://manoa-backoffice.pages.dev/verify/${requestId}`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
        const qrResponse = await fetch(qrApiUrl);
        if (qrResponse.ok) {
            const qrArrayBuffer = await qrResponse.arrayBuffer();
            const qrImage = await pdfDoc.embedPng(new Uint8Array(qrArrayBuffer));
            const qrSize = 70;
            const qrX = width - marginX - qrSize;
            const qrY = 40;
            page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
            const labelText = "Escanear para verificar";
            const labelW = regularFont.widthOfTextAtSize(labelText, 6);
            page.drawText(labelText, {
                x: qrX + (qrSize - labelW) / 2,
                y: qrY - 10,
                size: 6,
                font: regularFont,
                color: rgb(0.4, 0.4, 0.4),
            });
        }
    } catch {
        // QR generation failed silently – PDF still valid without it
    }

    return pdfDoc.save();
};
