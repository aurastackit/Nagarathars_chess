import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

const CHARCOAL = "#17140f";
const GOLD = "#c8922f";
const IVORY = "#f6f1e7";

const styles = StyleSheet.create({
  page: {
    backgroundColor: IVORY,
    padding: 0,
    fontFamily: "Helvetica",
  },
  border: {
    margin: 24,
    borderWidth: 3,
    borderColor: GOLD,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 3,
    color: GOLD,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    color: CHARCOAL,
    marginTop: 16,
    fontFamily: "Helvetica-Bold",
  },
  subtitle: {
    fontSize: 14,
    color: CHARCOAL,
    marginTop: 24,
  },
  name: {
    fontSize: 26,
    color: CHARCOAL,
    marginTop: 8,
    fontFamily: "Helvetica-Bold",
  },
  body: {
    fontSize: 13,
    color: "#4a453c",
    marginTop: 20,
    textAlign: "center",
    maxWidth: 440,
  },
  tournament: {
    fontSize: 16,
    color: CHARCOAL,
    marginTop: 8,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    marginTop: 40,
    fontSize: 9,
    color: "#898781",
  },
});

export type CertificateKind = "participation" | "overall_winner" | "category_winner";

export function certificateHeadline(kind: CertificateKind, categoryLabel?: string) {
  if (kind === "overall_winner") return "Certificate of Achievement — Tournament Champion";
  if (kind === "category_winner") return `Certificate of Achievement — ${categoryLabel ?? ""} Champion`;
  return "Certificate of Participation";
}

export async function renderCertificatePdf(params: {
  kind: CertificateKind;
  categoryLabel?: string;
  playerName: string;
  tournamentTitle: string;
  tournamentDateLabel: string;
  venueLabel: string;
  registrationId: string;
  issuedOn: string;
}) {
  const headline = certificateHeadline(params.kind, params.categoryLabel);
  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.eyebrow}>Nagarathar&apos;s Chess Championship</Text>
          <Text style={styles.title}>{headline}</Text>
          <Text style={styles.subtitle}>This certifies that</Text>
          <Text style={styles.name}>{params.playerName}</Text>
          <Text style={styles.body}>
            {params.kind === "participation" ? "participated in" : "achieved this result at"}
          </Text>
          <Text style={styles.tournament}>{params.tournamentTitle}</Text>
          <Text style={styles.body}>
            {params.tournamentDateLabel} · {params.venueLabel}
          </Text>
          <Text style={styles.footer}>
            Registration ID: {params.registrationId} · Issued {params.issuedOn}
          </Text>
        </View>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
