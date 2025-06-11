"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { toast } from "sonner";
import api from "@/lib/api";
import { differenceInCalendarDays } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { BookingConfirmationPDF } from "@/components/ui/BookingConfirmationPDF";
import ReactDOM from "react-dom/client";

function BookingForm({ 
  numberOfAdults, 
  totalPrice, 
  selectedCurrency,
  dateRange,
  onSubmit,
  selectedEvent,
  selectedPackage,
  selectedHotel,
  selectedRoom,
  selectedTicket,
  selectedFlight,
  selectedLoungePass,
  selectedCircuitTransfer,
  selectedAirportTransfer,
  ticketQuantity,
  roomQuantity,
  loungePassQuantity,
  circuitTransferQuantity,
  airportTransferQuantity,
  flightQuantity,
  flightPNR,
  ticketingDeadline,
  paymentStatus,
  originalNights,
  salesTeam,
  open,
  onOpenChange,
  transferDirection,
  onBookingComplete
}) {
  const { theme } = useTheme();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("error");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [customPayments, setCustomPayments] = useState(false);
  const [paymentPercents, setPaymentPercents] = useState([33.33, 33.33, 33.34]);
  const [paymentAmounts, setPaymentAmounts] = useState([0, 0, 0]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const currencySymbols = {
    GBP: "£",
    USD: "$",
    EUR: "€",
    AUD: "A$",
    CAD: "C$",
  };

  const formSchema = z.object({
    booker_name: z.string().min(1),
    booker_email: z.string().min(1),
    booker_phone: z.string().min(1),
    address_line_1: z.string().min(1),
    address_line_2: z.string().min(1).optional(),
    city: z.string().min(1),
    postcode: z.string().min(1),
    country: z.string().min(1),
    booking_date: z.coerce.date(),
    lead_traveller_name: z.string().min(1),
    lead_traveller_phone: z.string().min(1),
    lead_traveller_email: z.string().min(1),
    guest_traveller_names: z.array(z.string().min(1)).length(numberOfAdults - 1),
    acquisition: z.string(),
    booking_type: z.string(),
    atol_abtot: z.string(),
    payment1_status: z.boolean().default(false),
    payment2_status: z.boolean().default(false),
    payment3_status: z.boolean().default(false),
    booking_reference: z.string().min(1),
    booking_reference_prefix: z.string().min(1),
    create_flight_booking: z.boolean().default(false),
    flight_booking_reference: z.string().optional(),
    ticketing_deadline: z.date().nullable().optional(),
    flight_status: z.string().optional(),
    create_lounge_booking: z.boolean().default(false),
    lounge_booking_reference: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      booker_name: "",
      booker_email: "",
      booker_phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      postcode: "",
      country: "",
      booking_date: new Date(),
      lead_traveller_name: "",
      lead_traveller_phone: "",
      lead_traveller_email: "",
      guest_traveller_names: Array(numberOfAdults - 1).fill(""),
      acquisition: "B2B Travel Agent",
      booking_type: "Standard",
      atol_abtot: "ATOL",
      payment1_status: false,
      payment2_status: false,
      payment3_status: false,
      booking_reference: "",
      booking_reference_prefix: "GP",
      create_flight_booking: false,
      flight_booking_reference: "",
      ticketing_deadline: null,
      flight_status: "",
      create_lounge_booking: false,
      lounge_booking_reference: "",
    },
  });

  // Add useEffect to get current user
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode(token);
        const res = await api.get("/users");
        const users = res.data;

        // Try match by user_id or email depending on your token
        const user = users.find(
          (u) => u.user_id === decoded.user_id || u.email === decoded.email
        );

        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    }

    fetchCurrentUser();
  }, []);

  // Function to get the next sequence number
  async function getNextSequenceNumber(prefix) {
    try {
      // Fetch all booking references
      const response = await api.get('/bookingFile');
      const bookings = response.data || [];

      // Filter bookings that match our prefix and get the highest sequence
      const matchingRefs = bookings
        .filter(booking => booking?.booking_ref?.startsWith(prefix))
        .map(booking => {
          const sequence = booking.booking_ref.split('-').pop();
          return parseInt(sequence, 10) || 0;
        });

      // Get the highest sequence number or start from 1
      const maxSequence = matchingRefs.length > 0 ? Math.max(...matchingRefs) : 0;
      return (maxSequence + 1).toString().padStart(4, '0');
    } catch (error) {
      console.error('Failed to fetch booking references:', error);
      return '0001'; // Start from 1 if fetch fails
    }
  }

  // Function to generate booking reference
  async function generateBookingReference(event) {
    if (!event) return { prefix: '', sequence: '0001' };
    
    try {
      // Get venue code based on event name
      let venueCode = '';
      if (event.event) {
        const eventName = event.event.toLowerCase();
        
        // Formula 1 Grand Prix events
        if (eventName.includes('abu dhabi')) {
          venueCode = 'ABU';
        } else if (eventName.includes('australian')) {
          venueCode = 'AUS';
        } else if (eventName.includes('austrian')) {
          venueCode = 'AUT';
        } else if (eventName.includes('bahrain')) {
          venueCode = 'BAH';
        } else if (eventName.includes('azerbaijan')) {
          venueCode = 'AZE';
        } else if (eventName.includes('belgian')) {
          venueCode = 'BEL';
        } else if (eventName.includes('canadian')) {
          venueCode = 'CAN';
        } else if (eventName.includes('dutch')) {
          venueCode = 'NED';
        } else if (eventName.includes('hungarian')) {
          venueCode = 'HUN';
        } else if (eventName.includes('emilia-romagna')) {
          venueCode = 'EMI';
        } else if (eventName.includes('italian')) {
          venueCode = 'ITA';
        } else if (eventName.includes('miami')) {
          venueCode = 'MIA';
        } else if (eventName.includes('monaco')) {
          venueCode = 'MON';
        } else if (eventName.includes('qatar')) {
          venueCode = 'QAT';
        } else if (eventName.includes('saudi')) {
          venueCode = 'SAU';
        } else if (eventName.includes('singapore')) {
          venueCode = 'SIN';
        } else if (eventName.includes('spanish')) {
          venueCode = 'ESP';
        }
        // MotoGP events
        else if (eventName.includes('aragon')) {
          venueCode = 'ARA';
        } else if (eventName.includes('austria')) {
          venueCode = 'AUT';
        } else if (eventName.includes('catalunya')) {
          venueCode = 'CAT';
        } else if (eventName.includes('german')) {
          venueCode = 'GER';
        } else if (eventName.includes('hungary')) {
          venueCode = 'HUN';
        } else if (eventName.includes('italy')) {
          venueCode = 'ITA';
        } else if (eventName.includes('portugal')) {
          venueCode = 'POR';
        } else if (eventName.includes('san marino')) {
          venueCode = 'SMR';
        } else if (eventName.includes('jerez')) {
          venueCode = 'JER';
        } else if (eventName.includes('valencia')) {
          venueCode = 'VAL';
        } else {
          // For any other venue, use first 3 letters
          venueCode = event.event.split(' ')[0].substring(0, 3).toUpperCase();
        }
      } else {
        venueCode = 'VEN';
      }
      
      // Get sport code
      let sportCode = 'GEN';
      if (event.sport) {
        if (event.sport.toLowerCase().includes('formula')) {
          sportCode = 'F1';
        } else if (event.sport.toLowerCase().includes('motogp')) {
          sportCode = 'MGP';
        }
      }
      
      // Extract year from event name
      let year = '';
      if (event.event) {
        const yearMatch = event.event.match(/\b(20\d{2})\b/);
        year = yearMatch ? yearMatch[1] : new Date().getFullYear();
      } else {
        year = new Date().getFullYear();
      }
      
      const prefix = `${venueCode}${sportCode}-${year}-`;
      const sequence = await getNextSequenceNumber(prefix);
      
      return {
        prefix,
        sequence
      };
    } catch (error) {
      console.error('Error generating booking reference:', error);
      return { prefix: '', sequence: '0001' };
    }
  }

  // Update booking reference when event changes
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    async function updateBookingReference() {
      if (!selectedEvent) {
        form.setValue('booking_reference', '0001');
        form.setValue('booking_reference_prefix', '');
        return;
      }

      try {
        const newReference = await generateBookingReference(selectedEvent);
        if (isMounted) {
          form.setValue('booking_reference', newReference.sequence || '0001');
          form.setValue('booking_reference_prefix', newReference.prefix || '');
        }
      } catch (error) {
        console.error('Error updating booking reference:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateBookingReference, 1000); // Retry after 1 second
        } else {
          // Set default values if all retries fail
          if (isMounted) {
            form.setValue('booking_reference', '0001');
            form.setValue('booking_reference_prefix', '');
          }
        }
      }
    }

    // Immediately update the reference
    updateBookingReference();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [selectedEvent?.event_id]);

  // Initialize form values on mount
  useEffect(() => {
    const initializeReference = async () => {
      if (selectedEvent) {
        const newReference = await generateBookingReference(selectedEvent);
        form.setValue('booking_reference', newReference.sequence || '0001');
        form.setValue('booking_reference_prefix', newReference.prefix || '');
      }
    };
    initializeReference();
  }, [selectedEvent?.event_id]);

  // Update payment amounts whenever total price changes or custom payments is toggled
  useEffect(() => {
    if (!customPayments) {
      // Simple division by three
      const equalAmount = totalPrice / 3;
      setPaymentAmounts([
        equalAmount,
        equalAmount,
        equalAmount
      ]);
    } else {
      // Use percentages only when custom payments are enabled
      const newAmounts = paymentPercents.map(percent => 
        Math.round((totalPrice * percent) / 100)
      );
      const sum = newAmounts[0] + newAmounts[1];
      newAmounts[2] = totalPrice - sum;
      setPaymentAmounts(newAmounts);
    }
  }, [totalPrice, customPayments, paymentPercents]);

  // Add handler for custom payments toggle
  const handleCustomPaymentsToggle = (checked) => {
    if (!checked) {
      // Reset to simple division by three
      const equalAmount = totalPrice / 3;
      setPaymentAmounts([
        equalAmount,
        equalAmount,
        equalAmount
      ]);
      setPaymentPercents([33.33, 33.33, 33.34]);
    }
    setCustomPayments(checked);
  };

  // Function to handle payment percentage changes
  const handlePaymentChange = (index, newPercent) => {
    if (!customPayments) return; // Only allow changes if custom payments are enabled
    
    // Convert to number and handle empty input
    const value = newPercent === '' ? 0 : Number(newPercent);
    
    // Ensure the value is between 0 and 100 and is a whole number
    const validValue = Math.max(0, Math.min(100, Math.round(value)));
    
    const newPercents = [...paymentPercents];
    newPercents[index] = validValue;
    
    // Calculate the remaining percentage
    const remaining = 100 - validValue;
    
    // If this is payment 1 or 2, distribute remaining to the other payments
    if (index === 0) {
      // Split remaining between payments 2 and 3
      newPercents[1] = Math.round(remaining / 2);
      newPercents[2] = remaining - newPercents[1];
    } else if (index === 1) {
      // Put remaining in payment 3
      newPercents[2] = remaining;
    }
    
    setPaymentPercents(newPercents);
  };

  const handleSubmit = async (values) => {
    if (isSubmitting) {
      console.log('Submission blocked: Already submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Starting form submission process');

      // Format dates for the API
      const formatDate = (date) => {
        if (!date) return '';
        return format(new Date(date), "dd-LLL-y");
      };

      // Use the current payment amounts directly
      console.log('Payment amounts:', paymentAmounts);
      
      // Combine booking reference prefix and sequence
      const bookingReference = `${values.booking_reference_prefix}${values.booking_reference}`;
      console.log('Generated booking reference:', bookingReference);

      // Get payment dates from package or use current date for upfront payment
      const payment1Date = formatDate(new Date()); // Current date for upfront payment
      const payment2Date = selectedPackage?.payment_date_2 || '';
      const payment3Date = selectedPackage?.payment_date_3 || '';
      console.log('Payment dates:', { payment1Date, payment2Date, payment3Date });

      // Calculate nights and extra nights
      const totalNights = dateRange?.from && dateRange?.to ? 
        differenceInCalendarDays(dateRange.to, dateRange.from) : 0;
      const originalNightsValue = selectedRoom?.nights || originalNights || 0;
      const extraNightsValue = totalNights > originalNightsValue ? totalNights - originalNightsValue : 0;

      // Calculate room prices
      const baseRoomPrice = selectedRoom ? Number(selectedRoom.price) : 0;
      const extraNightsPrice = selectedRoom ? extraNightsValue * Number(selectedRoom.extra_night_price) : 0;
      const totalRoomPrice = (baseRoomPrice + extraNightsPrice) * roomQuantity;

      console.log('Night calculations:', {
        dateRange,
        totalNights,
        originalNightsValue,
        extraNightsValue,
        baseRoomPrice,
        extraNightsPrice,
        totalRoomPrice,
        roomQuantity,
        selectedRoomNights: selectedRoom?.nights
      });

      // Prepare the booking data according to API requirements
      const bookingData = {
        // Status and reference
        status: 'Future',
        booking_ref: bookingReference,
        
        // Booking details
        booking_type: values.booking_type,
        consultant: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : '',
        acquisition: values.acquisition,
        event_id: selectedEvent?.event_id || '',
        package_id: selectedPackage?.package_id || '',
        atol_abtot: values.atol_abtot,
        booking_date: formatDate(values.booking_date),
        
        // Booker details
        booker_name: values.booker_name,
        booker_email: values.booker_email,
        booker_phone: values.booker_phone,
        booker_address: [
          values.address_line_1,
          values.address_line_2,
          values.city,
          values.postcode,
          values.country
        ].filter(Boolean).join('\n'),
        
        // Lead traveller details
        lead_traveller_name: values.lead_traveller_name,
        lead_traveller_email: values.lead_traveller_email,
        lead_traveller_phone: values.lead_traveller_phone,
        guest_traveller_names: values.guest_traveller_names.join(', '),
        adults: numberOfAdults,
        
        // Ticket details
        ticket_id: selectedTicket?.ticket_id || '',
        ticket_quantity: ticketQuantity,
        ticket_price: selectedTicket ? selectedTicket.price * ticketQuantity : 0,
        
        // Hotel details
        hotel_id: selectedHotel?.hotel_id || '',
        room_id: selectedRoom?.room_id || '',
        check_in_date: dateRange?.from ? formatDate(dateRange.from) : '',
        check_out_date: dateRange?.to ? formatDate(dateRange.to) : '',
        nights: totalNights,
        extra_nights: extraNightsValue,
        room_quantity: roomQuantity,
        room_price: totalRoomPrice,
        extra_nights_price: extraNightsPrice * roomQuantity,
        base_room_price: baseRoomPrice * roomQuantity,
        
        // Transfer details
        airport_transfer_id: selectedAirportTransfer?.airport_transfer_id || '',
        airport_transfer_quantity: airportTransferQuantity,
        airport_transfer_price: selectedAirportTransfer ? selectedAirportTransfer.price * airportTransferQuantity : 0,
        airport_transfer_direction: transferDirection || 'both',
        circuit_transfer_id: selectedCircuitTransfer?.circuit_transfer_id || '',
        circuit_transfer_quantity: circuitTransferQuantity,
        circuit_transfer_price: selectedCircuitTransfer ? selectedCircuitTransfer.price * circuitTransferQuantity : 0,
        
        // Flight details
        flight_id: selectedFlight?.flight_id || '',
        flight_booking_reference: form.getValues("create_flight_booking") ? form.getValues("flight_booking_reference") : '',
        ticketing_deadline: form.getValues("create_flight_booking") ? formatDate(form.getValues("ticketing_deadline")) : '',
        flight_status: form.getValues("create_flight_booking") ? form.getValues("flight_status") : '',
        flight_quantity: selectedFlight ? flightQuantity : 0,
        flight_price: selectedFlight ? selectedFlight.price * flightQuantity : 0,
        
        // Lounge pass details
        lounge_pass_id: selectedLoungePass?.lounge_pass_id || '',
        lounge_pass_quantity: loungePassQuantity,
        lounge_pass_price: selectedLoungePass ? selectedLoungePass.price * loungePassQuantity : 0,
        lounge_booking_reference: form.getValues("create_lounge_booking") ? form.getValues("lounge_booking_reference") : '',
        
        // Payment details with rounded values
        payment_currency: selectedCurrency,
        payment_1: paymentAmounts[0],
        payment_1_date: payment1Date,
        payment_2: paymentAmounts[1],
        payment_2_date: payment2Date,
        payment_3: paymentAmounts[2],
        payment_3_date: payment3Date,
        payment_1_status: values.payment1_status ? "Paid" : "Due",
        payment_2_status: values.payment2_status ? "Paid" : "Due",
        payment_3_status: values.payment3_status ? "Paid" : "Due",
        
        // Calculated totals
        'Total cost': "",
        'Total Sold For Local': "",
        'Total Sold GBP': "",
        'P&L': "" // This will be calculated by the backend
      };
      console.log('Prepared booking data:', bookingData);

      // Make the API request to the correct endpoint
      console.log('Making API request to /bookingFile');
      try {
        const response = await api.post('/bookingFile', bookingData);
        console.log('API Response:', response);
        
        if (response.data) {
          console.log('Response data:', response.data);
          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);
          
          // Show success message
          toast.success('Booking created successfully!');
          
          // Create booking details object
          const bookingDetails = {
            booking_ref: bookingData.booking_ref,
            booker_name: bookingData.booker_name,
            booker_email: bookingData.booker_email,
            booker_phone: bookingData.booker_phone,
            booker_address: bookingData.booker_address,
            lead_traveller_name: bookingData.lead_traveller_name,
            lead_traveller_email: bookingData.lead_traveller_email,
            lead_traveller_phone: bookingData.lead_traveller_phone,
            booking_date: bookingData.booking_date,
            total_paid: bookingData.payment_1,
            payment_status: 'Partially Paid',
            payment_1: bookingData.payment_1,
            payment_1_date: bookingData.payment_1_date,
            payment_1_status: 'Paid',
            payment_2: bookingData.payment_2,
            payment_2_date: bookingData.payment_2_date,
            payment_2_status: 'Pending',
            payment_3: bookingData.payment_3,
            payment_3_date: bookingData.payment_3_date,
            payment_3_status: 'Pending',
            guest_traveller_names: bookingData.guest_traveller_names
          };

          // Update booking details state
          setBookingDetails(bookingDetails);

          // Show success dialog
          setShowSuccessDialog(true);

          // Reset form
          form.reset();

          // Close booking form dialog
          onOpenChange?.(false);

          // Call onBookingComplete callback
          onBookingComplete?.(bookingDetails);

          // Create a temporary PDFDownloadLink for automatic download
          const tempContainer = document.createElement('div');
          document.body.appendChild(tempContainer);
          
          const pdfLink = (
            <PDFDownloadLink
              document={
                <BookingConfirmationPDF
                  selectedEvent={selectedEvent}
                  selectedPackage={selectedPackage}
                  selectedHotel={selectedHotel}
                  selectedRoom={selectedRoom}
                  selectedTicket={selectedTicket}
                  selectedFlight={selectedFlight}
                  selectedLoungePass={selectedLoungePass}
                  selectedCircuitTransfer={selectedCircuitTransfer}
                  selectedAirportTransfer={selectedAirportTransfer}
                  numberOfAdults={numberOfAdults}
                  dateRange={dateRange}
                  roomQuantity={roomQuantity}
                  ticketQuantity={ticketQuantity}
                  loungePassQuantity={loungePassQuantity}
                  circuitTransferQuantity={circuitTransferQuantity}
                  airportTransferQuantity={airportTransferQuantity}
                  flightQuantity={flightQuantity}
                  totalPrice={totalPrice}
                  selectedCurrency={selectedCurrency}
                  bookingData={bookingDetails}
                />
              }
              fileName={`${bookingDetails.booker_name} - ${bookingDetails.booking_ref} - Booking Confirmation.pdf`}
            >
              {({ url }) => {
                if (url) {
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${bookingDetails.booker_name} - ${bookingDetails.booking_ref} - Booking Confirmation.pdf`;
                  link.click();
                  document.body.removeChild(tempContainer);
                }
                return null;
              }}
            </PDFDownloadLink>
          );

          // Render the temporary PDFDownloadLink
          const root = ReactDOM.createRoot(tempContainer);
          root.render(pdfLink);
        }
        
      } catch (error) {
        console.error('API request failed:', error);
        const errorMessage = error.response?.data?.message || 'Failed to create booking. Please try again.';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Form validation error:', error);
      toast.error('Please check all required fields are filled correctly.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create Booking</DialogTitle>
            <DialogDescription>
              Fill in the booking details below
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-8">
            {/* Left Column - Summary */}
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg">Booking Summary</h3>
                
                {/* Package Details Section */}
                <div className="space-y-3 border-b pb-3">
                  <h4 className="font-medium text-base">Package Details</h4>
                  
                  {/* Event & Package */}
                  <div className="space-y-1.5 bg-card p-2 rounded-md">
                    <h5 className="text-sm font-medium text-muted-foreground">Event & Package</h5>
                    <div className="text-sm space-y-0.5">
                      <p><span className="font-medium">Event:</span> {selectedEvent?.event || "Not selected"}</p>
                      <p><span className="font-medium">Package:</span> {selectedPackage?.package_name || "Not selected"}</p>
                      <p><span className="font-medium">Number of Adults:</span> {numberOfAdults}</p>
                    </div>
                  </div>

                  {/* Hotel & Room */}
                  {selectedHotel && (
                    <div className="space-y-1.5 bg-card p-2 rounded-md">
                      <h5 className="text-sm font-medium text-muted-foreground">Hotel & Room</h5>
                      <div className="text-sm space-y-0.5">
                        <p><span className="font-medium">Hotel:</span> {selectedHotel?.hotel_name || "Not selected"}</p>
                        <p><span className="font-medium">Room:</span> {selectedRoom?.room_category || "Not selected"} - {selectedRoom?.room_type || "Not selected"} x{roomQuantity}</p>
                        <p><span className="font-medium">Check-in:</span> {dateRange?.from ? format(dateRange.from, "PPP") : "Not selected"}</p>
                        <p><span className="font-medium">Check-out:</span> {dateRange?.to ? format(dateRange.to, "PPP") : "Not selected"}</p>
                      </div>
                    </div>
                  )}

                  {/* Ticket */}
                  {selectedTicket && (
                    <div className="space-y-1.5 bg-card p-2 rounded-md">
                      <h5 className="text-sm font-medium text-muted-foreground">Ticket</h5>
                      <div className="text-sm space-y-0.5">
                        <p><span className="font-medium">Ticket Type:</span> {selectedTicket?.ticket_name || "Not selected"} x{ticketQuantity}</p>
                      </div>
                    </div>
                  )}

                  {/* Transfers */}
                  {(selectedCircuitTransfer || selectedAirportTransfer) && (
                    <div className="space-y-1.5 bg-card p-2 rounded-md">
                      <h5 className="text-sm font-medium text-muted-foreground">Transfers</h5>
                      <div className="text-sm space-y-0.5">
                        {selectedCircuitTransfer && (
                          <p><span className="font-medium">Circuit Transfer:</span> {selectedCircuitTransfer?.transport_type || "Not selected"} x{circuitTransferQuantity}</p>
                        )}
                        {selectedAirportTransfer && (
                          <p><span className="font-medium">Airport Transfer:</span> {selectedAirportTransfer?.transport_type || "Not selected"} x{airportTransferQuantity}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Flight & Lounge Section */}
                <div className="space-y-3">
                  <h4 className="font-medium text-base">Additional Services</h4>

                  {/* Flight */}
                  {selectedFlight && (
                    <div className="space-y-1.5 bg-card p-2 rounded-md">
                      <h5 className="text-sm font-medium text-muted-foreground">Flight</h5>
                      <div className="text-sm space-y-0.5">
                        <p><span className="font-medium">Airline:</span> {selectedFlight.airline} • {selectedFlight.class} x{flightQuantity}</p>
                        <p><span className="font-medium">Outbound:</span> {selectedFlight.outbound_flight}</p>
                        <p><span className="font-medium">Inbound:</span> {selectedFlight.inbound_flight}</p>
                        <div className="flex items-center space-x-2 pt-1">
                          <Switch
                            id="create-flight-booking"
                            checked={form.watch("create_flight_booking")}
                            onCheckedChange={(checked) => form.setValue("create_flight_booking", checked)}
                          />
                          <Label htmlFor="create-flight-booking" className="text-sm">
                            Create Flight Booking
                          </Label>
                        </div>
                        {form.watch("create_flight_booking") && (
                          <div className="space-y-1.5 pt-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Booking Reference:</span>
                              <Input 
                                value={form.watch("flight_booking_reference")}
                                onChange={(e) => form.setValue("flight_booking_reference", e.target.value)}
                                className="h-7 text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Ticketing Deadline:</span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "h-7 text-xs justify-start text-left font-normal",
                                      !form.watch("ticketing_deadline") && "text-muted-foreground"
                                    )}
                                  >
                                    {form.watch("ticketing_deadline") ? (
                                      format(form.watch("ticketing_deadline"), "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={form.watch("ticketing_deadline")}
                                    onSelect={(date) => form.setValue("ticketing_deadline", date)}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Status:</span>
                              <Select
                                value={form.watch("flight_status")}
                                onValueChange={(value) => form.setValue("flight_status", value)}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="booked_ticketed_paid">Booked, Ticketed & Paid</SelectItem>
                                  <SelectItem value="booked_ticketed_not_paid">Booked, Ticketed, Not Paid</SelectItem>
                                  <SelectItem value="booked_not_ticketed">Booked, Not Ticketed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lounge Pass */}
                  {selectedLoungePass && (
                    <div className="space-y-1.5 bg-card p-2 rounded-md">
                      <h5 className="text-sm font-medium text-muted-foreground">Lounge Pass</h5>
                      <div className="text-sm space-y-0.5">
                        <p><span className="font-medium">Type:</span> {selectedLoungePass.variant} x{loungePassQuantity}</p>
                        <div className="flex items-center space-x-2 pt-1">
                          <Switch
                            id="create-lounge-booking"
                            checked={form.watch("create_lounge_booking")}
                            onCheckedChange={(checked) => form.setValue("create_lounge_booking", checked)}
                          />
                          <Label htmlFor="create-lounge-booking" className="text-sm">
                            Create Lounge Pass Booking
                          </Label>
                        </div>
                        {form.watch("create_lounge_booking") && (
                          <div className="flex items-center gap-2 pt-1.5">
                            <span className="font-medium">Booking Reference:</span>
                            <Input 
                              value={form.watch("lounge_booking_reference")}
                              onChange={(e) => form.setValue("lounge_booking_reference", e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Total Price */}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Price:</span>
                    <span className="text-lg font-bold">
                      {currencySymbols[selectedCurrency]}{Number(totalPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Booking Form */}
            <div>
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    console.log('Form onSubmit triggered');
                    console.log('Current form values:', form.getValues());
                    console.log('Detailed form errors:', JSON.stringify(form.formState.errors, null, 2));
                    form.handleSubmit(handleSubmit)(e);
                  }}
                  className="space-y-4"
                >
                  {/* Booking Reference */}
                  <div className="grid grid-cols-1 gap-3">
                    <FormField
                      control={form.control}
                      name="booking_reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Booking Reference</FormLabel>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {form.watch("booking_reference_prefix")}
                            </span>
                            <FormControl>
                              <Input 
                                {...field}
                                className="bg-background text-xs h-7 font-mono w-20"
                                maxLength={4}
                                placeholder="0001"
                              />
                            </FormControl>
                          </div>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Booker Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="booker_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Booker Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter booker's name" {...field} className="bg-background text-xs h-7" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="booker_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Booker Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter booker's email"
                              {...field}
                              className="bg-background text-xs h-7"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="booker_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Booker Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter booker's phone" {...field} className="bg-background text-xs h-7" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Address Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border pt-2">
                    <FormField
                      control={form.control}
                      name="address_line_1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Address Line 1</FormLabel>
                          <FormControl>
                            <Input placeholder="Address Line 1" {...field} className="bg-background text-xs h-7" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address_line_2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Address Line 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional Address Line 2" {...field} className="bg-background text-xs h-7" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} className="bg-background text-xs h-7" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Postcode</FormLabel>
                          <FormControl>
                            <Input placeholder="Postcode" {...field} className="bg-background text-xs h-7" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} className="bg-background text-xs h-7" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Traveller Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border pt-2">
                    <FormField
                      control={form.control}
                      name="lead_traveller_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Lead Traveller Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Lead Traveller" {...field} className="bg-background text-xs h-7" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lead_traveller_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Lead Traveller Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone Number" {...field} className="bg-background text-xs h-7" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lead_traveller_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Lead Traveller Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email Address" {...field} className="bg-background text-xs h-7" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Array.from({ length: numberOfAdults - 1 }).map(
                      (_, index) => (
                        <FormField
                          key={index}
                          control={form.control}
                          name={`guest_traveller_names.${index}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground text-xs">
                                Guest {index + 1} Name
                                <span className="text-destructive ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={`Guest ${index + 1}`}
                                  {...field}
                                  className={cn(
                                    "bg-background text-xs h-7",
                                    form.formState.errors.guest_traveller_names?.[index] && "border-primary"
                                  )}
                                />
                              </FormControl>
                              {form.formState.errors.guest_traveller_names?.[index] && (
                                <p className="text-xs text-primary mt-1">
                                  Please enter guest {index + 1}'s name
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      )
                    )}
                  </div>
                  {/* Booking Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border pt-2">
                    <FormField
                      control={form.control}
                      name="booking_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Booking Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal bg-background text-xs h-7",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="acquisition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Acquisition</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full bg-background text-xs h-7">
                                <SelectValue placeholder="Acquisition source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="referral">Referral</SelectItem>
                              <SelectItem value="newsletter">Newsletter</SelectItem>
                              <SelectItem value="unknown">Unknown</SelectItem>
                              <SelectItem value="meta">Meta</SelectItem>
                              <SelectItem value="repeat">Repeat</SelectItem>
                              <SelectItem value="organic">Organic</SelectItem>
                              <SelectItem value="b2b">B2B (Travel agent)</SelectItem>
                              <SelectItem value="adwords">Adwords</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="booking_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">Booking Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full bg-background text-xs h-7">
                                <SelectValue placeholder="Booking type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="actual">Actual</SelectItem>
                              <SelectItem value="provisional">Provisional</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="atol_abtot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground text-xs">ATOL/ABTOT</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full bg-background text-xs h-7">
                                <SelectValue placeholder="ATOL/ABTOT" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="abtot">ABTOT</SelectItem>
                              <SelectItem value="atol">ATOL (Package)</SelectItem>
                              <SelectItem value="na">N/A (Non EU)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Payment Info */}
                  <div className="mb-2">
                    <div className="border-t border-border pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium">Payment Schedule</h3>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={customPayments}
                            onCheckedChange={handleCustomPaymentsToggle}
                            id="custom-payments"
                          />
                          <Label htmlFor="custom-payments" className="text-xs">
                            Adjust Payment Schedule
                          </Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[0, 1, 2].map((idx) => (
                          <div className="space-y-1 p-2 rounded-md border bg-card" key={idx}>
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-medium">Payment {idx + 1}</label>
                              {customPayments && (
                                <span className="text-xs text-muted-foreground">
                                  {paymentPercents[idx]}%
                                </span>
                              )}
                            </div>
                            
                            {customPayments && (
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={paymentPercents[idx]}
                                    onChange={(e) => {
                                      const newPercent = Math.max(0, Math.min(100, Math.round(Number(e.target.value))));
                                      handlePaymentChange(idx, newPercent);
                                    }}
                                    className={cn(
                                      "w-20 bg-background h-7 text-xs",
                                      paymentPercents.reduce((sum, p) => sum + p, 0) !== 100 && "border-red-500"
                                    )}
                                    step="1"
                                    min="0"
                                    max="100"
                                    placeholder="0"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
                                </div>
                              </div>
                            )}

                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                {idx === 0 ? (
                                  "Due on booking"
                                ) : (
                                  selectedPackage?.[`payment_date_${idx + 1}`] || "Date not set"
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="text-xs font-medium">
                                  {currencySymbols[selectedCurrency]}{paymentAmounts[idx].toFixed(2)}
                                </div>
                                <FormField
                                  control={form.control}
                                  name={`payment${idx + 1}_status`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-1">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          className="h-3 w-3"
                                        />
                                      </FormControl>
                                      <FormLabel className="text-xs">Paid</FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 px-2 py-1 rounded-md border bg-card flex justify-between items-center">
                        <span className="text-xs font-medium">Total</span>
                        <span className="text-sm font-semibold">
                          {currencySymbols[selectedCurrency]}{totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        setShowQuoteDialog(true);
                      }}
                    >
                      Generate Quote
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating Booking..." : "Create Booking"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Confirmed!</DialogTitle>
            <DialogDescription>
              Your booking has been successfully created. Here are your booking details:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Booking Reference</p>
                <p className="text-sm">{bookingDetails?.booking_ref}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Booker Name</p>
                <p className="text-sm">{bookingDetails?.booker_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Event</p>
                <p className="text-sm">{selectedEvent?.event}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Package</p>
                <p className="text-sm">{selectedPackage?.package_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Price</p>
                <p className="text-sm">{selectedCurrency} {totalPrice?.toFixed(2)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Payment Schedule:</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Payment 1:</span>
                  <span>{bookingDetails?.payment_1_date} - {selectedCurrency} {bookingDetails?.payment_1?.toFixed(2)} ({bookingDetails?.payment_1_status})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payment 2:</span>
                  <span>{bookingDetails?.payment_2_date} - {selectedCurrency} {bookingDetails?.payment_2?.toFixed(2)} ({bookingDetails?.payment_2_status})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payment 3:</span>
                  <span>{bookingDetails?.payment_3_date} - {selectedCurrency} {bookingDetails?.payment_3?.toFixed(2)} ({bookingDetails?.payment_3_status})</span>
                </div>
              </div>
            </div>
            <div className="pt-4">
              <PDFDownloadLink
                document={
                  <BookingConfirmationPDF
                    selectedEvent={selectedEvent}
                    selectedPackage={selectedPackage}
                    selectedHotel={selectedHotel}
                    selectedRoom={selectedRoom}
                    selectedTicket={selectedTicket}
                    selectedFlight={selectedFlight}
                    selectedLoungePass={selectedLoungePass}
                    selectedCircuitTransfer={selectedCircuitTransfer}
                    selectedAirportTransfer={selectedAirportTransfer}
                    numberOfAdults={numberOfAdults}
                    dateRange={dateRange}
                    roomQuantity={roomQuantity}
                    ticketQuantity={ticketQuantity}
                    loungePassQuantity={loungePassQuantity}
                    circuitTransferQuantity={circuitTransferQuantity}
                    airportTransferQuantity={airportTransferQuantity}
                    flightQuantity={flightQuantity}
                    totalPrice={totalPrice}
                    selectedCurrency={selectedCurrency}
                    bookingData={bookingDetails}
                  />
                }
                fileName={`${bookingDetails?.booker_name} - ${bookingDetails?.booking_ref} - Booking Confirmation.pdf`}
                className="w-full"
              >
                {({ loading }) =>
                  loading ? (
                    <Button type="button" variant="outline" className="w-full" disabled>
                      Generating PDF...
                    </Button>
                  ) : (
                    <Button type="button" className="w-full">
                      Download Booking Confirmation
                    </Button>
                  )
                }
              </PDFDownloadLink>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

BookingForm.propTypes = {
  numberOfAdults: PropTypes.number.isRequired,
  totalPrice: PropTypes.number.isRequired,
  selectedCurrency: PropTypes.string.isRequired,
  dateRange: PropTypes.shape({
    from: PropTypes.instanceOf(Date),
    to: PropTypes.instanceOf(Date)
  }),
  onSubmit: PropTypes.func.isRequired,
  selectedEvent: PropTypes.object,
  selectedPackage: PropTypes.object,
  selectedHotel: PropTypes.object,
  selectedRoom: PropTypes.object,
  selectedTicket: PropTypes.object,
  selectedFlight: PropTypes.object,
  selectedLoungePass: PropTypes.object,
  selectedCircuitTransfer: PropTypes.object,
  selectedAirportTransfer: PropTypes.object,
  ticketQuantity: PropTypes.number,
  roomQuantity: PropTypes.number,
  loungePassQuantity: PropTypes.number,
  circuitTransferQuantity: PropTypes.number,
  airportTransferQuantity: PropTypes.number,
  flightQuantity: PropTypes.number,
  originalNights: PropTypes.number,
  salesTeam: PropTypes.object,
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  transferDirection: PropTypes.string,
  onBookingComplete: PropTypes.func
};

export { BookingForm };
