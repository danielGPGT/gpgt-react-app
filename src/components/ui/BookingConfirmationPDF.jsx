import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// Optionally register a custom font if you want to match the template style
// Font.register({ family: 'Poppins', src: require('@/assets/fonts/Poppins/Poppins-Medium.ttf') });

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#222',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottom: '2px solid #d3d3d3',
    paddingBottom: 8,
  },
  logo: {
    width: 'auto',
    height: 24,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginVertical: 12,
  },
  section: {
    marginVertical: 8,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '30%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    backgroundColor: '#f3f3f3',
    padding: 4,
    fontWeight: 'bold',
  },
  tableCol: {
    width: '70%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 4,
  },
  tableColSmall: {
    width: '30%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 4,
  },
  tableColLarge: {
    width: '70%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 4,
  },
  notes: {
    fontSize: 9,
    marginTop: 12,
    color: '#555',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 32,
    right: 32,
    fontSize: 9,
    color: '#888',
    borderTop: '1px solid #eee',
    paddingTop: 8,
    textAlign: 'center',
  },
  companyInfo: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f1f1f',
    marginBottom: 4,
  },
  companyContact: {
    color: '#666',
    marginBottom: 2,
  },
  bookingInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid #eee',
  },
  bookingRef: {
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  bookingDate: {
    color: '#666',
  },
  bookerInfo: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  bookerName: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  bookerDetail: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 4,
  },
  headerColLeft: {
    width: '60%',
  },
  headerColRight: {
    width: '38%',
    alignItems: 'flex-start',
  },
  companyDetail: {
    fontSize: 10,
    marginBottom: 1,
  },
  companyLink: {
    fontSize: 10,
    color: '#BE222A',
    textDecoration: 'underline',
    marginBottom: 1,
  },
  labelBold: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    marginBottom: 2,
  },
});

export function BookingConfirmationPDF({ 
  selectedEvent,
  selectedPackage,
  selectedHotel,
  selectedRoom,
  selectedTicket,
  selectedFlight,
  selectedLoungePass,
  selectedCircuitTransfer,
  selectedAirportTransfer,
  numberOfAdults,
  dateRange,
  roomQuantity,
  ticketQuantity,
  loungePassQuantity,
  circuitTransferQuantity,
  airportTransferQuantity,
  flightQuantity,
  totalPrice,
  selectedCurrency,
  bookingData // This will contain the form data
}) {
  // Fallbacks for missing data
  const safe = (val, fallback = '') => val || fallback;
  const currency = selectedCurrency || 'GBP';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';

  // Format dates
  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  // Format date range
  const formatDateRange = (range) => {
    if (!range?.from || !range?.to) return '';
    return `${formatDate(range.from)} to ${formatDate(range.to)}`;
  };

  // Calculate nights
  const calculateNights = (range) => {
    if (!range?.from || !range?.to) return 0;
    try {
      const from = new Date(range.from);
      const to = new Date(range.to);
      return Math.ceil((to - from) / (1000 * 60 * 60 * 24));
    } catch (error) {
      return 0;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image style={styles.logo} src="/imgs/Grand_Prix_Logo_Vector_new.png" />
          <Text style={styles.title}>Booking Confirmation</Text>
        </View>
        <Text style={styles.companyName}>Grand Prix Grand Tours</Text>
        {/* Two-column header: company/booker left, ref/date right */}
        <View style={styles.headerRow}>
          {/* Left column: company and booker info */}
          <View style={styles.headerColLeft}>
          
            <Text style={styles.companyDetail}>Tel: 0203 966 5680</Text>
            <Text style={styles.companyDetail}>
              Email: <Text style={styles.companyLink}>sales@grandprixgrandtours.com</Text>
            </Text>
          </View>
          {/* Right column: ref and date */}
          <View style={styles.headerColRight}>
            <Text style={styles.labelBold}>GPGT Ref: <Text style={styles.value}>{safe(bookingData?.booking_ref)}</Text></Text>
            <Text style={styles.labelBold}>Date: <Text style={styles.value}>{formatDate(bookingData?.booking_date)}</Text></Text>
          </View>
        </View>
        <View style={styles.headerRow}>
          {/* Left column: company and booker info */}
          <View style={styles.headerColLeft}>
            <Text style={styles.bookerName}>Name: {safe(bookingData?.booker_name)}</Text>
            {bookingData?.booker_phone && (
              <Text style={styles.bookerDetail}>Tel: {safe(bookingData?.booker_phone)}</Text>
            )}
            {bookingData?.booker_email && (
              <Text style={styles.bookerDetail}>Email: {safe(bookingData?.booker_email)}</Text>
            )}
            <Text style={styles.bookerDetail}>{safe(bookingData?.booker_address)}</Text>
          </View>
        </View>

        {/* Main Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Hotel</Text>
            <Text style={styles.tableCol}>
              {safe(selectedHotel?.hotel_name)}
              {selectedRoom ? `, ${selectedRoom.room_category} - ${selectedRoom.room_type}` : ''}
              {`\nRoom Qty: ${roomQuantity}`}
              {`\n${formatDateRange(dateRange)}`}
              {`\n${calculateNights(dateRange)} Nights`}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Guests</Text>
            <Text style={styles.tableCol}>
              {`${numberOfAdults} Adults`}
              {`\nLead: ${safe(bookingData?.lead_traveller_name)}`}
              {bookingData?.guest_traveller_names ? `\nGuests: ${bookingData.guest_traveller_names}` : ''}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Tickets</Text>
            <Text style={styles.tableCol}>
              {selectedTicket ? `${selectedTicket.ticket_name} x ${ticketQuantity}` : 'N/A'}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Airport Transfer</Text>
            <Text style={styles.tableCol}>
              {selectedAirportTransfer ? `${selectedAirportTransfer.transport_type} x ${airportTransferQuantity}` : 'N/A'}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Circuit Transfers</Text>
            <Text style={styles.tableCol}>
              {selectedCircuitTransfer ? `${selectedCircuitTransfer.transport_type} x ${circuitTransferQuantity}` : 'N/A'}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Extras</Text>
            <Text style={styles.tableCol}>
              {selectedLoungePass ? `Lounge Pass: ${selectedLoungePass.variant} x ${loungePassQuantity}` : 'N/A'}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Flight</Text>
            <Text style={styles.tableCol}>
              {selectedFlight ? 
                `${selectedFlight.airline}, ${selectedFlight.class}\nOutbound: ${selectedFlight.outbound_flight}\nInbound: ${selectedFlight.inbound_flight}\nQty: ${flightQuantity}` 
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text>Invoice CCY: {currency}</Text>
          <Text>Total: {currencySymbol}{totalPrice?.toFixed(2)}</Text>
        </View>

        {/* Payment Schedule */}
        <View style={styles.section}>
          <Text>Payment Schedule:</Text>
          <Text>Deposit: {currencySymbol}{safe(bookingData?.payment_1?.toFixed(2))} - {formatDate(bookingData?.payment_1_date)} ({safe(bookingData?.payment_1_status)})</Text>
          <Text>Payment 2: {currencySymbol}{safe(bookingData?.payment_2?.toFixed(2))} - {formatDate(bookingData?.payment_2_date)} ({safe(bookingData?.payment_2_status)})</Text>
          <Text>Payement 3: {currencySymbol}{safe(bookingData?.payment_3?.toFixed(2))} - {formatDate(bookingData?.payment_3_date)} ({safe(bookingData?.payment_3_status)})</Text>
        </View>

        {/* Notes */}
        <Text style={styles.notes}>
          *Amount at time of booking\n**Future payments will be calculated in GBP and converted at the prevailing rate\nNotes: The tickets will be dispatched once received from the supplier. Full Terms and Conditions available at https://www.grandprixgrandtours.com/ts-cs/
        </Text>

        {/* Footer */}
        <Text style={styles.footer}>
          100% Financial Protection | Grand Tours Travel Ltd | Company No. 11753686 | ATOL Registered: 11863 | ABTOT Registered: 5478 | www.grandprixgrandtours.com
        </Text>
      </Page>
    </Document>
  );
} 