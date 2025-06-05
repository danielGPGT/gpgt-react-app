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
    marginBottom: 16,
    borderBottom: '2px solid #d3d3d3',
    paddingBottom: 8,
  },
  logo: {
    width: 80,
    height: 32,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
    letterSpacing: 1,
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
});

export function BookingConfirmationPDF({ booking }) {
  // Fallbacks for missing data
  const safe = (val, fallback = '') => val || fallback;
  const currency = booking?.payment_currency || 'GBP';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Replace with your logo path if needed */}
          <Image style={styles.logo} src="/imgs/Grand_Prix_Logo_Vector_new.png" />
        </View>
        <Text style={styles.title}>BOOKING CONFIRMATION</Text>

        {/* Company & Booking Info */}
        <View style={styles.section}>
          <Text>Grand Prix Grand Tours</Text>
          <Text>Tel: 0203 966 5680</Text>
          <Text>Email: sales@grandprixgrandtours.com</Text>
          <Text>Booking Ref: {safe(booking?.booking_ref)}</Text>
          <Text>Date: {safe(booking?.booking_date)}</Text>
          <Text>Event: {safe(booking?.event_name)}</Text>
          <Text>Package: {safe(booking?.package_type)}</Text>
        </View>

        {/* Booker Info */}
        <View style={styles.section}>
          <Text>Booker: {safe(booking?.booker_name)}</Text>
          <Text>Email: {safe(booking?.booker_email)}</Text>
          <Text>Phone: {safe(booking?.booker_phone)}</Text>
          <Text>Address: {safe(booking?.booker_address)}</Text>
        </View>

        {/* Main Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Hotel</Text>
            <Text style={styles.tableCol}>{safe(booking?.hotel_name)}{booking?.room_type ? `, ${booking.room_type}` : ''}\nRoom Qty: {safe(booking?.room_quantity)}\n{safe(booking?.check_in_date)} to {safe(booking?.check_out_date)}\n{safe(booking?.nights)} Nights</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Guests</Text>
            <Text style={styles.tableCol}>{safe(booking?.adults)} Adults\nLead: {safe(booking?.lead_traveller_name)}{booking?.guest_traveller_names ? `, ${booking.guest_traveller_names}` : ''}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Tickets</Text>
            <Text style={styles.tableCol}>{safe(booking?.ticket_name)} x {safe(booking?.ticket_quantity)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Airport Transfer</Text>
            <Text style={styles.tableCol}>{safe(booking?.airport_transfer_type)}{booking?.airport_transfer_quantity ? ` x${booking.airport_transfer_quantity}` : ''}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Circuit Transfers</Text>
            <Text style={styles.tableCol}>{safe(booking?.circuit_transfer_type)}{booking?.circuit_transfer_quantity ? ` x${booking.circuit_transfer_quantity}` : ''}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Extras</Text>
            <Text style={styles.tableCol}>{booking?.lounge_pass_variant ? `Lounge Pass: ${booking.lounge_pass_variant} x${booking.lounge_pass_quantity}` : 'N/A'}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Flight</Text>
            <Text style={styles.tableCol}>{booking?.flight_carrier ? `${booking.flight_carrier}, ${booking.flight_class || ''}\nOutbound: ${booking.flight_outbound}\nInbound: ${booking.flight_inbound}\nQty: ${booking.flight_quantity}` : 'N/A'}</Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text>Invoice CCY: {currency}</Text>
          <Text>Total: {currencySymbol}{safe(booking?.total_cost)}</Text>
          <Text>Paid: {currencySymbol}{safe(booking?.total_cost)}</Text>
          <Text>Payment Status: {safe(booking?.payment_status)}</Text>
        </View>

        {/* Payment Schedule */}
        <View style={styles.section}>
          <Text>Payment Schedule:</Text>
          <Text>1. {currencySymbol}{safe(booking?.payment_1)} - {safe(booking?.payment_1_date)} ({safe(booking?.payment_1_status)})</Text>
          <Text>2. {currencySymbol}{safe(booking?.payment_2)} - {safe(booking?.payment_2_date)} ({safe(booking?.payment_2_status)})</Text>
          <Text>3. {currencySymbol}{safe(booking?.payment_3)} - {safe(booking?.payment_3_date)} ({safe(booking?.payment_3_status)})</Text>
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