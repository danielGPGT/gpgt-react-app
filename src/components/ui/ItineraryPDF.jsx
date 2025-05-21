import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Font,
  Image,
  pdf,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Register the GrandPrix font
Font.register({
  family: "GrandPrix",
  src: "/fonts/Formula1-Regular.otf",
  format: "opentype"
});

// Primary color from theme
const PRIMARY_COLOR = "#BE222A";

// Import the PNG logo
const GPGT_LOGO = "/imgs/Grand_Prix_Logo_Vector_new.png";

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    backgroundColor: "#ffffff",
    position: "relative",
  },
  header: {
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "0.5pt solid #e2e8f0",
    paddingBottom: 8,
  },
  logo: {
    width: 140,
    height: 25,
    marginLeft: 0,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontFamily: "GrandPrix",
    marginBottom: 2,
  },
  generatedDate: {
    fontSize: 8,
    color: "#718096",
  },
  content: {
    marginTop: 8,
  },
  section: {
    marginBottom: 6,
    backgroundColor: "#ffffff",
    borderRadius: 3,
    padding: 0,
    backgroundColor: "#f8fafc",
    border: "0.5pt solid #e2e8f0",
  },
  sectionTitle: {
    fontSize: 10,
    marginBottom: 3,
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "GrandPrix",
    backgroundColor: PRIMARY_COLOR,
    padding: 4,
    borderRadius: 2,
  },
  row: {
    flexDirection: "row",
    marginTop: 3,
    marginBottom: 3,
    marginLeft: 8,
    paddingBottom: 3,
    borderBottom: "0.25pt solid #f0f0f0",
  },
  label: {
    width: "35%",
    fontWeight: "bold",
    color: "#4a5568",
    fontSize: 9,
  },
  value: {
    width: "65%",
    color: "#2d3748",
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: "center",
    color: "#718096",
    fontSize: 7,
    borderTop: "0.5pt solid #e2e8f0",
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    marginBottom: 2,
    fontSize: 8,
    fontWeight: "bold",
  },
  footerLeft: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  footerRight: {
    alignItems: "flex-end",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 100,
  },
  itinerarySection: {
    marginBottom: 6,
    backgroundColor: "#ffffff",
    borderRadius: 3,
    padding: 8,
    backgroundColor: "#f8fafc",
    border: "0.5pt solid #e2e8f0",
  },
  itineraryTitle: {
    fontSize: 10,
    marginBottom: 8,
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "GrandPrix",
    backgroundColor: PRIMARY_COLOR,
    padding: 4,
    borderRadius: 2,
  },
  itineraryContent: {
    fontSize: 9,
    color: "#2d3748",
    lineHeight: 1.4,
  },
  itineraryDay: {
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "0.25pt solid #e2e8f0",
  },
  itineraryDayTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  itineraryTime: {
    fontWeight: "bold",
    color: "#4a5568",
  },
  itineraryEvent: {
    marginLeft: 4,
  },
  itineraryNote: {
    fontSize: 8,
    color: "#718096",
    fontStyle: "italic",
    marginTop: 2,
  },
});

const ItineraryPDF = ({ bookingData, itinerary }) => {
  const generateFileName = () => {
    const eventName = bookingData.event_name || "Itinerary";
    const date = format(new Date(), "yyyy-MM-dd");
    return `${eventName}_${date}_Itinerary`;
  };

  const formatItinerary = (text) => {
    if (!text) return null;
    
    // Split the text into days
    const days = text.split(/\n(?=Day \d+:|Day \d+ -)/);
    
    return days.map((day, index) => {
      const [dayTitle, ...events] = day.split('\n').filter(line => line.trim());
      
      return (
        <View key={index} style={styles.itineraryDay}>
          <Text style={styles.itineraryDayTitle}>{dayTitle}</Text>
          {events.map((event, eventIndex) => {
            // Check if the line contains a time (e.g., "09:00" or "9:00 AM")
            const timeMatch = event.match(/(\d{1,2}:\d{2}(?:\s?[AP]M)?)/);
            if (timeMatch) {
              const [time, ...rest] = event.split(timeMatch[0]);
              return (
                <View key={eventIndex} style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={styles.itineraryTime}>{timeMatch[0]}</Text>
                  <Text style={styles.itineraryEvent}>{rest.join('').trim()}</Text>
                </View>
              );
            }
            // If no time found, it might be a note or additional information
            return (
              <Text key={eventIndex} style={styles.itineraryNote}>
                {event.trim()}
              </Text>
            );
          })}
        </View>
      );
    });
  };

  const renderPDF = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src={GPGT_LOGO} />
          <View style={styles.headerRight}>
            <Text style={styles.title}>Itinerary</Text>
            <Text style={styles.generatedDate}>
              {format(new Date(), "PPP")}
            </Text>
          </View>
        </View>

        <View style={styles.content}>

          {/* Generated Itinerary Section */}
          <View style={styles.itinerarySection}>
            <Text style={styles.itineraryTitle}>Detailed Itinerary</Text>
            <View style={styles.itineraryContent}>
              {formatItinerary(itinerary)}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerText}>
              GPGT - Your Premium Grand Prix Travel Experience
            </Text>
            <Text>
              www.grandprixgrandtours.com | contact@gpgt.com | +44 123 456 7890
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Image
              style={styles.avatar}
              src="/src/assets/imgs/gpgt-small-dark.png"
            />
          </View>
        </View>
      </Page>
    </Document>
  );

  const handleDownload = async () => {
    const blob = await pdf(renderPDF()).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = generateFileName();
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download Itinerary
        </Button>
      </div>

      <PDFViewer style={{ width: "100%", height: "100%" }}>
        {renderPDF()}
      </PDFViewer>
    </div>
  );
};

export default ItineraryPDF; 