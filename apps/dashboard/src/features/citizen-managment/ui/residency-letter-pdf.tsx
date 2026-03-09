import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Citizen } from "@/entities/citizens";

// Using standard fonts for PDF
Font.register({
    family: "Helvetica",
    fonts: [
        { src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4Q4Fl.ttf" },
        { src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4TYFl.ttf", fontWeight: "bold" },
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: "40px 50px",
        fontFamily: "Helvetica",
        fontSize: 11,
        lineHeight: 1.5,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    headerTextCenter: {
        textAlign: "center",
        flex: 1,
    },
    headerTextLeft: {
        textAlign: "left",
        width: 120,
        fontSize: 10,
    },
    headerTextRight: {
        textAlign: "right",
        width: 140,
        fontSize: 10,
    },
    headerTitle: {
        fontWeight: "bold",
        fontSize: 12,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 10,
        marginBottom: 2,
    },
    headerRif: {
        fontSize: 10,
    },
    tricolorBar: {
        height: 8,
        flexDirection: "row",
        width: "100%",
        marginBottom: 40,
    },
    yellowBar: { flex: 1, backgroundColor: "#FFCC00" },
    blueBar: { flex: 1, backgroundColor: "#0033A0", flexDirection: "row", justifyContent: "center", alignItems: "center" },
    redBar: { flex: 1, backgroundColor: "#CE1126" },
    star: {
        color: "white",
        fontSize: 6,
        marginHorizontal: 2,
    },
    documentTitle: {
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 40,
        textDecoration: "underline",
    },
    paragraph: {
        marginBottom: 15,
        textAlign: "justify",
    },
    bold: {
        fontWeight: "bold",
    },
    signatureSection: {
        marginTop: 60,
        alignItems: "center",
    },
    signatureName: {
        marginTop: 40,
        textAlign: "center",
    },
    footer: {
        position: "absolute",
        bottom: 40,
        left: 50,
        right: 50,
        fontSize: 9,
        textAlign: "left",
    }
});

interface ResidencyLetterPDFProps {
    citizen: Citizen;
}

export const ResidencyLetterPDF = ({ citizen }: ResidencyLetterPDFProps) => {
    // Generate dates
    const today = new Date();
    // Static values from template
    const voceraName = "Blanco Yalin Iraima";
    const voceraId = "V-1.569.192";
    const consejoName = "BARRIO UNI\u00D3N \"SECTOR LA PIEDRA\"";
    const parroquia = "Fernando Gir\u00F3n Tovar";
    const sectorDate = "01 de enero 1990";
    const phone = "0426-113.95.01";
    const address = "Barrio Uni\u00F3n, calle Uni\u00F3n No. 55, Puerto Ayacucho Estado Amazonas.";

    const citizenName = `${citizen.names} ${citizen.surnames}`.toUpperCase();
    
    // Format document ID to include dots if possible, otherwise use raw
    const formatDocumentId = (docId: string | undefined | null) => {
        if (!docId) return "N/A";
        // Simple heuristic: if it contains a dash, keep it, otherwise format
        if (docId.includes("-")) return docId;
        // Typical 12345678 format
        if (docId.length >= 6 && !isNaN(Number(docId))) {
            return `V-${docId.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
        }
        return `V-${docId}`;
    };

    const citizenId = formatDocumentId(citizen.cedula);

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <View style={styles.headerTextLeft}>
                        {/* Placeholder for Escudo */}
                        <Text style={styles.bold}>REPÚBLICA</Text>
                        <Text style={styles.bold}>BOLIVARIANA</Text>
                        <Text style={styles.bold}>DE VENEZUELA</Text>
                    </View>

                    <View style={styles.headerTextCenter}>
                        <Text style={styles.headerTitle}>CONSEJO COMUNAL BARRIO UNIÓN</Text>
                        <Text style={styles.headerTitle}>"SECTOR LA PIEDRA"</Text>
                        <Text style={styles.headerRif}>RIF. C-29933234-8</Text>
                    </View>

                    <View style={styles.headerTextRight}>
                        {/* Placeholder for Venezuela logo */}
                        <Text>PUERTO AYACUCHO</Text>
                        <Text>MUNICIPIO ATURES</Text>
                        <Text>ESTADO AMAZONAS</Text>
                    </View>
                </View>

                {/* Flag Bar */}
                <View style={styles.tricolorBar}>
                    <View style={styles.yellowBar}></View>
                    <View style={styles.blueBar}>
                        <Text style={styles.star}>★</Text>
                        <Text style={styles.star}>★</Text>
                        <Text style={styles.star}>★</Text>
                        <Text style={styles.star}>★</Text>
                        <Text style={styles.star}>★</Text>
                        <Text style={styles.star}>★</Text>
                        <Text style={styles.star}>★</Text>
                        <Text style={styles.star}>★</Text>
                    </View>
                    <View style={styles.redBar}></View>
                </View>

                {/* Title */}
                <Text style={styles.documentTitle}>CONSTANCIA DE RESIDENCIA</Text>

                {/* Body Paragraph 1 */}
                <Text style={styles.paragraph}>
                    Quien suscribe, <Text style={styles.bold}>{voceraName}</Text>, venezolana, mayor de edad, 
                    portadora de la cédula de identidad No. <Text style={styles.bold}>{voceraId}</Text> en mi cargo 
                    como Vocera Principal del Consejo Comunal "{consejoName}", Parroquia {parroquia}, hago constar que por medio de la 
                    presente que la Ciudadana: <Text style={styles.bold}>{citizenName}</Text>, mayor de edad, 
                    venezolana, titular de la C.I. No. <Text style={styles.bold}>{citizenId}</Text>, fijo su residencia 
                    en este sector desde {sectorDate}, hasta la presente fecha. Ha demostrado buena conducta, así como 
                    un espíritu de colaboración para con todos, es una persona de reconocida solvencia moral, responsable y recta procedencia, 
                    razones suficientes que nos permite recomendarla ampliamente.
                </Text>

                {/* Body Paragraph 2 */}
                <Text style={styles.paragraph}>
                    Constancia que se expide a solicitud de partes interesadas en Puerto Ayacucho al primer 
                    (01) día del mes de octubre de 2020. Manifiesta que la requiere con fines de: TRAMITES BANCARIOS.
                </Text>
                {/* Note: I left the specific "01 dia del mes de octubre de 2020" from the template, 
                    but uncomment the following if you want dynamic dates based on today's date:
                <Text style={styles.paragraph}>
                    Constancia que se expide a solicitud de partes interesadas en Puerto Ayacucho al 
                    {day} día del mes de {month} de {year}. Manifiesta que la requiere con fines de: TRAMITES BANCARIOS.
                </Text>
                */}

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <Text>Atentamente,</Text>
                    <Text style={{ marginTop: 15 }}>Por el Consejo Comunal <Text style={styles.bold}>{consejoName}</Text></Text>
                    
                    <View style={styles.signatureName}>
                        <Text>{voceraName.toUpperCase()}</Text>
                        <Text>C.I.No.{voceraId.replace("V-", "")}</Text>
                        <Text>{phone}</Text>
                        <Text>Vocera Principal</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>{address} {phone}</Text>
            </Page>
        </Document>
    );
};
