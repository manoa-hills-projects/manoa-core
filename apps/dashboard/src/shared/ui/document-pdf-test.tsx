import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";

// Dado que la instrucción era expresamente usar qrcode.react, si usamos react-pdf que solo acepta primitivas,
// aquí simulamos el espacio de la firma donde va incrustado el QR (idealmente se le pasaría un "qrBase64Image" por prop).

const styles = StyleSheet.create({
	page: {
		flexDirection: "column",
		backgroundColor: "#ffffff",
		padding: 40,
	},
	title: {
		fontSize: 24,
		marginBottom: 20,
		textAlign: "center",
		fontWeight: "bold",
	},
	body: {
		fontSize: 12,
		lineHeight: 1.5,
		marginBottom: 40,
	},
	signatureSection: {
		marginTop: "auto",
		borderTop: "1px solid #ccc",
		paddingTop: 10,
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	signatureText: {
		fontSize: 10,
		color: "#666",
	},
	qrContainer: {
		width: 60,
		height: 60,
		backgroundColor: "#f5f5f5", // Placeholder para la imagen
		padding: 4,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
	qrImage: {
		width: "100%",
		height: "100%",
	},
});

interface DocumentPdfTestProps {
	citizenName: string;
	documentId: string;
	qrImageBase64?: string; // Como qrcode.react renderiza en el DOM, se captura como base64 y se le pasa a este componente.
}

export const DocumentPdfTest = ({
	citizenName,
	documentId,
	qrImageBase64,
}: DocumentPdfTestProps) => (
	<Document>
		<Page size="A4" style={styles.page}>
			<Text style={styles.title}>Certificado Oficial de Manoa</Text>

			<Text style={styles.body}>
				Por medio del presente documento se hace constar que el ciudadano{" "}
				{citizenName}
				ha sido registrado satisfactoriamente en los censos oficiales. Este
				documento sirve como comprobante de inscripción y posee un código QR en
				la parte inferior para validar su total autenticidad desde nuestra
				plataforma oficial.
			</Text>

			<View style={styles.signatureSection}>
				<View>
					<Text style={styles.signatureText}>Firma Autorizada</Text>
					<Text style={styles.signatureText}>
						Sistema Core (ID: {documentId.split("-")[0]})
					</Text>
				</View>

				<View style={styles.qrContainer}>
					{qrImageBase64 ? (
						<Image src={qrImageBase64} style={styles.qrImage} />
					) : (
						<Text style={{ fontSize: 8, textAlign: "center" }}>
							QR{"\n"}Code
						</Text>
					)}
				</View>
			</View>
		</Page>
	</Document>
);
