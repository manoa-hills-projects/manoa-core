import {
	Document,
	Font,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
import type { Citizen } from "@/entities/citizens";

// Using standard fonts for PDF
Font.register({
	family: "Helvetica",
	fonts: [
		{
			src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4Q4Fl.ttf",
		},
		{
			src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4TYFl.ttf",
			fontWeight: "bold",
		},
	],
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
	blueBar: {
		flex: 1,
		backgroundColor: "#0033A0",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
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
	signatureAndQrRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		marginTop: 60,
	},
	signatureSection: {
		alignItems: "center",
		flex: 1,
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
	},
	qrContainer: {
		alignItems: "center",
		width: 120,
	},
	qrCode: {
		width: 80,
		height: 80,
	},
	qrText: {
		fontSize: 7,
		marginTop: 4,
		color: "#666",
	},
});

interface ResidencyLetterPDFProps {
	citizen: Citizen;
	loggedInCitizen?: Citizen;
	sessionUser?: { name?: string | null; email?: string | null };
	qrCodeBase64?: string;
}

export const ResidencyLetterPDF = ({
	citizen,
	loggedInCitizen,
	sessionUser,
	qrCodeBase64,
}: ResidencyLetterPDFProps) => {
	// Determine vocero identity
	// Prioritize citizen profile if it exists, otherwise fallback to basic session user info
	let voceraName = "VOCERO NO ASIGNADO";
	if (loggedInCitizen?.names && loggedInCitizen?.surnames) {
		voceraName = `${loggedInCitizen.names} ${loggedInCitizen.surnames}`;
	} else if (sessionUser?.name) {
		voceraName = sessionUser.name;
	}

	const voceraIdRaw = loggedInCitizen?.cedula;

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

	const voceraId = voceraIdRaw ? formatDocumentId(voceraIdRaw) : null;
	const voceraCedulaText = voceraId
		? `, portador(a) de la cédula de identidad No. `
		: "";
	const voceraCedulaValue = voceraId ? voceraId : "";

	// Static variables based on Bicentenario Manoa
	const consejoName =
		"CONSEJO COMUNAL BICENTENARIO MANOA DE LA 10 A LA 20, PERIODO 2025 - 2028";
	const direccion = "MUNICIPIO CARONÍ - PARROQUIA SIMÓN BOLÍVAR";
	const currentYear = new Date().getFullYear();

	const citizenName = `${citizen.names} ${citizen.surnames}`.toUpperCase();
	const citizenId = formatDocumentId(citizen.cedula);

	return (
		<Document>
			<Page size="LETTER" style={styles.page}>
				{/* Header */}
				<View style={styles.headerRow}>
					<View style={styles.headerTextCenter}>
						<Text style={styles.headerTitle}>
							REPÚBLICA BOLIVARIANA DE VENEZUELA
						</Text>
						<Text style={styles.headerTitle}>
							MINISTERIO DEL PODER POPULAR PARA LAS COMUNAS
						</Text>
						<Text style={styles.headerTitle}>
							CUADERNILLO DE VOTACIÓN RENOVACIÓN DE VOCERIAS
						</Text>
						<Text style={styles.headerSubtitle}>{consejoName}</Text>
						<Text style={styles.headerSubtitle}>{direccion}</Text>
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
					Quien suscribe, <Text style={styles.bold}>{voceraName}</Text>, mayor
					de edad
					{voceraCedulaText}
					<Text style={styles.bold}>{voceraCedulaValue}</Text> en mi cargo como
					Vocero Principal del {consejoName}, hago constar que por medio de la
					presente que el/la Ciudadano(a):{" "}
					<Text style={styles.bold}>{citizenName}</Text>, mayor de edad, titular
					de la C.I. No. <Text style={styles.bold}>{citizenId}</Text>, fijo su
					residencia en este sector. Ha demostrado buena conducta, así como un
					espíritu de colaboración para con todos, es una persona de reconocida
					solvencia moral, responsable y recta procedencia, razones suficientes
					que nos permite recomendarla ampliamente.
				</Text>

				{/* Body Paragraph 2 */}
				<Text style={styles.paragraph}>
					Constancia que se expide a solicitud de partes interesadas a la fecha
					de hoy, del periodo {currentYear}. Manifiesta que la requiere con
					fines documentales u organizativos pertinentes.
				</Text>

				{/* Signatures and QR Row */}
				<View style={styles.signatureAndQrRow}>
					{/* Left placeholder for symmetric spacing if needed, or empty */}
					<View style={{ width: 120 }} />

					{/* Center Signature */}
					<View style={styles.signatureSection}>
						<Text>Atentamente,</Text>
						<Text style={{ marginTop: 15 }}>Por el {consejoName}</Text>

						<View style={styles.signatureName}>
							<Text>{voceraName.toUpperCase()}</Text>
							{voceraId && <Text>C.I.No.{voceraId.replace("V-", "")}</Text>}
							<Text>Vocero Principal</Text>
						</View>
					</View>

					{/* Right QR */}
					<View style={styles.qrContainer}>
						{qrCodeBase64 ? (
							<>
								<Image src={qrCodeBase64} style={styles.qrCode} />
								<Text style={styles.qrText}>Documento Verificado</Text>
								<Text style={styles.qrText}>Escanea para Validar</Text>
							</>
						) : (
							<View style={{ width: 80, height: 80 }} />
						)}
					</View>
				</View>
			</Page>
		</Document>
	);
};
