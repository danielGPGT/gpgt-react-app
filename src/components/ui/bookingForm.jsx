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
import { useState } from "react";
import PropTypes from 'prop-types';

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
  onSubmit 
}) {
  const { theme } = useTheme();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("error");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      booking_date: new Date(),
      guest_traveller_names: Array(Math.max(0, numberOfAdults - 1)).fill(""),
    },
  });

  const handleSubmit = async (values) => {
    if (isSubmitting) return; // Prevent double submission

    try {
      setIsSubmitting(true);

      if (!onSubmit || typeof onSubmit !== 'function') {
        console.error('onSubmit prop is not a function');
        setAlertMessage("Form submission error: Invalid onSubmit handler");
        setAlertType("error");
        setShowAlert(true);
        return;
      }

      await onSubmit(values);
      setAlertMessage("Booking submitted successfully!");
      setAlertType("success");
      setShowAlert(true);
    } catch (error) {
      console.error("Form submission error:", error);
      setAlertMessage("Failed to submit the form. Please try again.");
      setAlertType("error");
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <div className="w-8/12 max-w-6xl mx-auto">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="p-4 space-y-4 bg-card rounded-md border-[1px] border shadow-sm w-full max-w-6xl mx-auto"
        >
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-4">
            {/* Deposit Payment */}
            <div className="space-y-2">
              <FormLabel className="text-foreground">Deposit Payment</FormLabel>
              <div className="text-sm font-semibold text-foreground">
                {currencySymbols[selectedCurrency] || "£"}{(totalPrice / 3).toFixed(2)}
              </div>
              <FormField
                control={form.control}
                name="payment1_date"
                render={({ field }) => (
                  <FormItem>
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
                  </FormItem>
                )}
              />
            </div>

            {/* Payment 2 */}
            <div className="space-y-2">
              <FormLabel className="text-foreground">Payment 2</FormLabel>
              <div className="text-sm font-semibold text-foreground">
                {currencySymbols[selectedCurrency] || "£"}{(totalPrice / 3).toFixed(2)}
              </div>
              <FormField
                control={form.control}
                name="payment2_date"
                render={({ field }) => (
                  <FormItem>
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
                  </FormItem>
                )}
              />
            </div>

            {/* Final Payment */}
            <div className="space-y-2">
              <FormLabel className="text-foreground">Final Payment</FormLabel>
              <div className="text-sm font-semibold text-foreground">
                {currencySymbols[selectedCurrency] || "£"}{(totalPrice / 3).toFixed(2)}
              </div>
              <FormField
                control={form.control}
                name="payment3_date"
                render={({ field }) => (
                  <FormItem>
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
                  </FormItem>
                )}
              />
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
  onSubmit: PropTypes.func.isRequired
};

export { BookingForm };
