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
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import emailjs from '@emailjs/browser';
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

// Initialize EmailJS with your public key
emailjs.init("QzVZTjwyU9dQUmSDq");

// Add currency symbol mapping
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
  guest_traveller_names: z.array(z.string().min(1)),
  booking_type: z.string(),
});

function RequestBooking({ 
  numberOfAdults, 
  totalPrice, 
  salesTeam,
  selectedEvent,
  selectedPackage,
  selectedHotel,
  selectedRoom,
  selectedTicket,
  selectedFlight,
  selectedLoungePass,
  selectedCircuitTransfer,
  selectedAirportTransfer,
  circuitTransferQuantity,
  airportTransferQuantity,
  roomQuantity,
  ticketQuantity,
  loungePassQuantity,
  dateRange,
  selectedCurrency
}) {
  const { theme } = useTheme();
  console.log('Transfer data:', {
    circuitTransfer: {
      fullObject: selectedCircuitTransfer,
      transportType: selectedCircuitTransfer?.transport_type,
      allKeys: selectedCircuitTransfer ? Object.keys(selectedCircuitTransfer) : []
    },
    airportTransfer: {
      fullObject: selectedAirportTransfer,
      transportType: selectedAirportTransfer?.transport_type,
      allKeys: selectedAirportTransfer ? Object.keys(selectedAirportTransfer) : []
    }
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [assignedSalesTeam, setAssignedSalesTeam] = useState(null);
  const [alertDialog, setAlertDialog] = useState(null);

  // Update assignedSalesTeam when salesTeam prop changes
  useEffect(() => {
    console.log('Sales team prop updated:', salesTeam);
    if (Array.isArray(salesTeam) && salesTeam.length > 0) {
      setAssignedSalesTeam(salesTeam[0]);
    } else if (salesTeam && typeof salesTeam === 'object') {
      setAssignedSalesTeam(salesTeam);
    }
  }, [salesTeam]);

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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      booking_date: new Date(),
      guest_traveller_names: Array(Math.max(0, numberOfAdults - 1)).fill(""),
    },
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with salesTeam:', assignedSalesTeam);
    
    if (!assignedSalesTeam?.email) {
      console.error('No sales team email available. Full sales team object:', assignedSalesTeam);
      setAlertDialog({
        type: "error",
        title: "No Sales Team Available",
        description: "Please try again later or contact support for assistance."
      });
      return;
    }

    const templateParams = {
      from_name: form.getValues("booker_name"),
      from_email: form.getValues("booker_email"),
      from_phone: form.getValues("booker_phone"),
      to_name: `${assignedSalesTeam.first_name} ${assignedSalesTeam.last_name}`,
      to_email: assignedSalesTeam.email,
      reply_to: currentUser?.email || form.getValues("booker_email"),
      message: `
        Booking Request Details:
        
        Event Details:
        Event: ${selectedEvent?.event || "Not selected"}
        Package: ${selectedPackage?.package_name || "Not selected"}
        
        Hotel Details:
        Hotel: ${selectedHotel?.hotel_name || "Not selected"}
        Room: ${selectedRoom?.room_category || "Not selected"} - ${selectedRoom?.room_type || "Not selected"}
        Room Quantity: ${roomQuantity}
        Check-in: ${dateRange?.from ? new Date(dateRange.from).toLocaleDateString() : "Not selected"}
        Check-out: ${dateRange?.to ? new Date(dateRange.to).toLocaleDateString() : "Not selected"}
        
        Transfer Details:
        Circuit Transfer: ${selectedCircuitTransfer?.transport_type || "Not selected"}
        Circuit Transfer Quantity: ${ticketQuantity || 1}
        Airport Transfer: ${selectedAirportTransfer?.transport_type || "Not selected"}
        Airport Transfer Quantity: ${selectedAirportTransfer ? Math.ceil(numberOfAdults / selectedAirportTransfer.max_capacity) : 1}
        
        Ticket Details:
        Ticket: ${selectedTicket?.ticket_name || "Not selected"}
        Ticket Type: ${selectedTicket?.ticket_type || "Not selected"}
        Ticket Quantity: ${ticketQuantity}
        
        Flight Details:
        Airline: ${selectedFlight?.airline || "Not selected"}
        Class: ${selectedFlight?.class || "Not selected"}
        Outbound: ${selectedFlight?.outbound_flight || "Not selected"}
        Inbound: ${selectedFlight?.inbound_flight || "Not selected"}
        
        Lounge Pass Details:
        Type: ${selectedLoungePass?.variant || "Not selected"}
        Quantity: ${loungePassQuantity}
        
        Booking Summary:
        Number of Adults: ${numberOfAdults}
        Total Price: ${currencySymbols[selectedCurrency] || selectedCurrency}${Math.round(totalPrice).toLocaleString()}
        
        Booker Details:
        Name: ${form.getValues("booker_name")}
        Email: ${form.getValues("booker_email")}
        Phone: ${form.getValues("booker_phone")}
        
        Address:
        ${form.getValues("address_line_1")}
        ${form.getValues("address_line_2") || ""}
        ${form.getValues("city")}
        ${form.getValues("postcode")}
        ${form.getValues("country")}
        
        Lead Traveller:
        Name: ${form.getValues("lead_traveller_name")}
        Email: ${form.getValues("lead_traveller_email")}
        Phone: ${form.getValues("lead_traveller_phone")}
        
        Guest Travellers:
        ${form.getValues("guest_traveller_names").filter(name => name).join("\n")}
        
        Booking Information:
        Date: ${form.getValues("booking_date") ? new Date(form.getValues("booking_date")).toLocaleDateString() : "Not selected"}
        Type: ${form.getValues("booking_type") || "Not selected"}
        Acquisition: B2B Travel Agent
      `,
    };

    try {
      // Send email using EmailJS
      const response = await emailjs.send(
        'service_0jnx7qi',
        'template_lxbsl6s',
        templateParams
      );

      console.log("EmailJS response:", response);

      if (response.status === 200) {
        setAlertDialog({
          type: "success",
          title: "Booking Request Submitted Successfully",
          description: (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Event Details:</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Event:</span> {selectedEvent?.event || "Not selected"}</p>
                  <p><span className="font-medium">Package:</span> {selectedPackage?.package_name || "Not selected"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Hotel Details:</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Hotel:</span> {selectedHotel?.hotel_name || "Not selected"}</p>
                  <p><span className="font-medium">Room:</span> {selectedRoom?.room_category || "Not selected"} - {selectedRoom?.room_type || "Not selected"}</p>
                  <p><span className="font-medium">Room Quantity:</span> {roomQuantity}</p>
                  <p><span className="font-medium">Check-in:</span> {dateRange?.from ? new Date(dateRange.from).toLocaleDateString() : "Not selected"}</p>
                  <p><span className="font-medium">Check-out:</span> {dateRange?.to ? new Date(dateRange.to).toLocaleDateString() : "Not selected"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Ticket Details:</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Ticket:</span> {selectedTicket?.ticket_name || "Not selected"}</p>
                  <p><span className="font-medium">Ticket Type:</span> {selectedTicket?.ticket_type || "Not selected"}</p>
                  <p><span className="font-medium">Ticket Quantity:</span> {ticketQuantity}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Flight Details:</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Airline:</span> {selectedFlight?.airline || "Not selected"}</p>
                  <p><span className="font-medium">Class:</span> {selectedFlight?.class || "Not selected"}</p>
                  <p><span className="font-medium">Outbound:</span> {selectedFlight?.outbound_flight || "Not selected"}</p>
                  <p><span className="font-medium">Inbound:</span> {selectedFlight?.inbound_flight || "Not selected"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Lounge Pass Details:</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Type:</span> {selectedLoungePass?.variant || "Not selected"}</p>
                  <p><span className="font-medium">Quantity:</span> {loungePassQuantity}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Transfer Details:</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Circuit Transfer:</span> {selectedCircuitTransfer?.transport_type || "Not selected"}</p>
                  <p><span className="font-medium">Airport Transfer:</span> {selectedAirportTransfer?.transport_type || "Not selected"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Booking Summary:</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Number of Adults:</span> {numberOfAdults}</p>
                  <p><span className="font-medium">Total Price:</span> {currencySymbols[selectedCurrency] || selectedCurrency}{Math.round(totalPrice).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Contact Information:</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Sales Team Member:</span> {assignedSalesTeam?.first_name} {assignedSalesTeam?.last_name}</p>
                  <p><span className="font-medium">Email:</span> {assignedSalesTeam?.email}</p>
                  <p><span className="font-medium">Phone:</span> {assignedSalesTeam?.phone}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm">Thank you for your booking request. Our sales team will contact you shortly to process your booking.</p>
              </div>
            </div>
          )
        });
      } else {
        throw new Error(`EmailJS returned status ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to submit booking request:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      setAlertDialog({
        type: "error",
        title: "Submission Failed",
        description: "There was an error submitting your booking request. Please try again or contact support."
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      {alertDialog && (
        <AlertDialog open={!!alertDialog} onOpenChange={() => setAlertDialog(null)}>
          <AlertDialogContent className="max-w-2xl bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">{alertDialog.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-left text-muted-foreground">
                {alertDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-background text-foreground">Close</AlertDialogCancel>
              {alertDialog.type === "error" && (
                <AlertDialogAction onClick={() => setAlertDialog(null)} className="bg-primary text-primary-foreground">
                  Try Again
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      <Form {...form}>
        <div className="w-full mx-auto">
          <form
            onSubmit={onSubmit}
            className="p-4 space-y-4 bg-card rounded-md border-[1px] border shadow-sm w-full max-w-6xl mx-auto"
          >
            {/* Booker Details */}
            <h2 className="max-w-150 pb-6 text-foreground">To create a booking with us, fill out the form below with the travellers details. 
              Once the request is created our sales team will be notified to process your booking.
            </h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
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
                      <PopoverContent className="w-auto p-0 bg-card" align="start">
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
                          <SelectValue placeholder="Select booking type" />
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
            </div>

            <div className="pt-4">
              <Button type="submit" size="lg" className="w-full">
                Send Booking Request
              </Button>
            </div>
          </form>
        </div>
      </Form>
    </div>
  );
}

export { RequestBooking };
