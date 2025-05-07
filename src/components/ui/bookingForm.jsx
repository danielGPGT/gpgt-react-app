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
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { differenceInCalendarDays } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

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
  guest_traveller_names: z.array(z.string().min(1)),
  acquisition: z.string(),
  booking_type: z.string(),
  atol_abtot: z.string(),
  payment1_date: z.coerce.date(),
  payment2_date: z.coerce.date(),
  payment3_date: z.coerce.date(),
  payment1_status: z.boolean().default(false),
  payment2_status: z.boolean().default(false),
  payment3_status: z.boolean().default(false),
  booking_reference: z.string().min(1),
  booking_reference_prefix: z.string().min(1),
});

const currencySymbols = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  AUD: "A$",
  CAD: "C$",
};

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
  salesTeam
}) {
  const { theme } = useTheme();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("error");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [paymentPercents, setPaymentPercents] = useState([33.33, 33.33, 33.34]);
  const paymentAmounts = paymentPercents.map(p => (totalPrice * p) / 100);
  const paymentPercentSum = paymentPercents.reduce((a, b) => a + b, 0);
  const paymentPercentError = paymentPercentSum !== 100;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      booking_date: new Date(),
      guest_traveller_names: Array(Math.max(0, numberOfAdults - 1)).fill(""),
      booking_reference: generateBookingReference(selectedEvent).sequence,
      booking_reference_prefix: generateBookingReference(selectedEvent).prefix,
    },
  });

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

  const handleSubmit = async (values) => {
    if (isSubmitting) return; // Prevent double submission

    try {
      setIsSubmitting(true);

      // Format dates for the API
      const formatDate = (date) => {
        if (!date) return '';
        return format(new Date(date), "dd-LLL-y");
      };

      // Combine booking reference prefix and sequence
      const bookingReference = `${values.booking_reference_prefix}${values.booking_reference}`;

      // Prepare the booking data according to API requirements
      const bookingData = {
        // Status and reference
        status: 'Future',
        booking_ref: bookingReference,
        
        // Booking details
        booking_type: values.booking_type,
        consultant: salesTeam ? `${salesTeam.first_name} ${salesTeam.last_name}` : '',
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
        nights: dateRange?.from && dateRange?.to ? 
          Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)) : 0,
        extra_nights: dateRange?.from && dateRange?.to ? 
          Math.max(differenceInCalendarDays(dateRange.to, dateRange.from) - originalNights, 0) : 0,
        room_quantity: roomQuantity,
        room_price: selectedRoom ? 
          (Number(selectedRoom.price) + 
           (Math.max(differenceInCalendarDays(dateRange.to, dateRange.from) - originalNights, 0) * Number(selectedRoom.extra_night_price))) * 
          roomQuantity : 0,
        
        // Transfer details
        airport_transfer_id: selectedAirportTransfer?.airport_transfer_id || '',
        airport_transfer_quantity: airportTransferQuantity,
        airport_transfer_price: selectedAirportTransfer ? selectedAirportTransfer.price * airportTransferQuantity : 0,
        circuit_transfer_id: selectedCircuitTransfer?.circuit_transfer_id || '',
        circuit_transfer_quantity: circuitTransferQuantity,
        circuit_transfer_price: selectedCircuitTransfer ? selectedCircuitTransfer.price * circuitTransferQuantity : 0,
        
        // Flight details
        flight_id: selectedFlight?.flight_id || '',
        flight_booking_reference: flightPNR || '',
        ticketing_deadline: formatDate(ticketingDeadline),
        flight_status: paymentStatus || '',
        flight_quantity: selectedFlight ? flightQuantity : 0,
        flight_price: selectedFlight ? selectedFlight.price * flightQuantity : 0,
        
        // Lounge pass details
        lounge_pass_id: selectedLoungePass?.lounge_pass_id || '',
        lounge_pass_quantity: loungePassQuantity,
        lounge_pass_price: selectedLoungePass ? selectedLoungePass.price * loungePassQuantity : 0,
        
        // Payment details
        payment_currency: selectedCurrency,
        payment_1: paymentAmounts[0],
        payment_1_date: formatDate(values.payment1_date),
        payment_2: paymentAmounts[1],
        payment_2_date: formatDate(values.payment2_date),
        payment_3: paymentAmounts[2],
        payment_3_date: formatDate(values.payment3_date),
        payment_1_status: values.payment1_status ? "Paid" : "Due",
        payment_2_status: values.payment2_status ? "Paid" : "Due",
        payment_3_status: values.payment3_status ? "Paid" : "Due",
        
        // Calculated totals
        'Total cost': totalPrice,
        'Total Sold For Local': totalPrice,
        'Total Sold GBP': totalPrice,
        'P&L': 0 // This will be calculated by the backend
      };

      // Log the data being sent
      console.log('Sending booking data:', bookingData);

      // Make the API request to the correct endpoint
      console.log('Making API request to /bookingFile');
      try {
        const response = await api.post('/bookingFile', bookingData);
        console.log('API Response:', response);
        
        if (response.data) {
          console.log('Response data:', response.data);
          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);
          
          // Set booking details for confirmation dialog
          setBookingDetails({
            bookingRef: response.data.booking_ref || 'Pending',
            bookerName: values.booker_name,
            event: selectedEvent?.event || 'N/A',
            package: selectedPackage?.package_name || 'N/A',
            totalPrice: `${currencySymbols[selectedCurrency]}${totalPrice.toFixed(2)}`,
            paymentSchedule: [
              { amount: paymentAmounts[0], date: formatDate(values.payment1_date) },
              { amount: paymentAmounts[1], date: formatDate(values.payment2_date) },
              { amount: paymentAmounts[2], date: formatDate(values.payment3_date) }
            ]
          });
          
          // Show confirmation dialog
          setShowConfirmation(true);
        }
        
        // Show success message
        toast.success('Booking created successfully!');
        
      } catch (error) {
        console.error('Failed to create booking:', error);
        
        // Log the error response data if available
        if (error.response) {
          console.error('Error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers
          });
        }
        
        // Show more specific error message
        const errorMessage = error.response?.data?.message || 'Failed to create booking. Please try again.';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Failed to create booking:', error);
      
      // Log the error response data if available
      if (error.response?.data) {
        console.error('Server error response:', error.response.data);
      }
      
      // Show more specific error message
      const errorMessage = error.response?.data?.message || 'Failed to create booking. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <div className="w-8/12 max-w-6xl mx-auto">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="p-4 space-y-4 bg-card rounded-md border-[1px] border shadow-sm w-full max-w-6xl mx-auto"
        >
          {/* Booking Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="booking_reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Booking Reference</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input 
                        value={form.getValues('booking_reference_prefix') || ''}
                        className="bg-background font-mono w-[180px]"
                        readOnly 
                      />
                    </FormControl>
                    <FormControl>
                      <Input 
                        {...field}
                        className="bg-background font-mono w-[80px]"
                        maxLength={4}
                        pattern="[0-9]*"
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Booker Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="booker_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Booker Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter booker's name" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="booker_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Booker Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter booker's email"
                      {...field}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="booker_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Booker Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter booker's phone" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Address Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
            <FormField
              control={form.control}
              name="address_line_1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Address Line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="Address Line 1" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address_line_2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Address Line 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional Address Line 2" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Postcode</FormLabel>
                  <FormControl>
                    <Input placeholder="Postcode" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Country" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Traveller Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
            <FormField
              control={form.control}
              name="lead_traveller_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Lead Traveller Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Lead Traveller" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lead_traveller_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Lead Traveller Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone Number" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lead_traveller_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Lead Traveller Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email Address" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
            {Array.from({ length: Math.max(0, numberOfAdults - 1) }).map(
              (_, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`guest_traveller_names.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Guest Traveller {index + 1} Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`Guest Traveller ${index + 1}`}
                          {...field}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )
            )}
          </div>
          {/* Booking Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-border pt-4">
            <FormField
              control={form.control}
              name="booking_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Booking Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-background",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acquisition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Acquisition</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-background">
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="booking_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Booking Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Booking type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="actual">Actual</SelectItem>
                      <SelectItem value="provisional">Provisional</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="atol_abtot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">ATOL/ABTOT</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="ATOL/ABTOT" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="abtot">ABTOT</SelectItem>
                      <SelectItem value="atol">ATOL (Package)</SelectItem>
                      <SelectItem value="na">N/A (Non EU)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Payment Info */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-4">
              {[0, 1, 2].map((idx) => (
                <div className="space-y-2" key={idx}>
                  <label className="text-xs font-semibold">Payment {idx + 1} (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={paymentPercents[idx]}
                      onChange={e => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value)));
                        const newPercents = [...paymentPercents];
                        newPercents[idx] = val;
                        setPaymentPercents(newPercents);
                      }}
                      className="w-16 border rounded px-2 py-1 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">({currencySymbols[selectedCurrency]}{paymentAmounts[idx].toFixed(2)})</span>
                  </div>
                  <FormField
                    control={form.control}
                    name={`payment${idx + 1}_date`}
                    render={({ field }) => (
                      <FormItem>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal bg-background h-8 text-xs",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`payment${idx + 1}_status`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-1 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Mark as Paid</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              <div className="text-xs text-destructive font-semibold ml-4 col-span-3">
                {paymentPercentError && 'Total must be 100%'}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Booking"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Booking Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="sm:max-w-[600px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">Booking Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {bookingDetails && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Booking Reference:</p>
                      <p>{bookingDetails.bookingRef}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Booker Name:</p>
                      <p>{bookingDetails.bookerName}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Event:</p>
                      <p>{bookingDetails.event}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Package:</p>
                      <p>{bookingDetails.package}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Total Price:</p>
                    <p className="text-xl font-bold">{bookingDetails.totalPrice}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Payment Schedule:</p>
                    <div className="space-y-2">
                      {bookingDetails.paymentSchedule.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>Payment {index + 1}:</span>
                          <span className="font-medium">
                            {currencySymbols[selectedCurrency]}{payment.amount.toFixed(2)} due {payment.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowConfirmation(false);
              // Reset form or navigate away if needed
            }}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Alert Dialog */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertType === "success" ? "Success" : "Error"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
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
  flightPNR: PropTypes.string,
  ticketingDeadline: PropTypes.instanceOf(Date),
  paymentStatus: PropTypes.string,
  originalNights: PropTypes.number,
  salesTeam: PropTypes.object
};

export { BookingForm };
