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
});

function RequestBooking({ numberOfAdults, totalPrice }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      booking_date: new Date(),
      guest_traveller_names: Array(Math.max(0, numberOfAdults - 1)).fill(""),
    },
  });

  function onSubmit(values) {
    try {
      console.log(values);
      toast(
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      );
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <div className="w-8/12 max-w-6xl mx-auto">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-4 space-y-4 bg-white rounded-md border-[1px] border-primary shadow-sm w-full max-w-6xl mx-auto"
        >
          {/* Booker Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="booker_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booker Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter booker's name" {...field} />
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
                  <FormLabel>Booker Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter booker's email"
                      {...field}
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
                  <FormLabel>Booker Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter booker's phone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Address Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <FormField
              control={form.control}
              name="address_line_1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="Address Line 1" {...field} />
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
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional Address Line 2" {...field} />
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
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
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
                  <FormLabel>Postcode</FormLabel>
                  <FormControl>
                    <Input placeholder="Postcode" {...field} />
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
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Traveller Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <FormField
              control={form.control}
              name="lead_traveller_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Traveller Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Lead Traveller" {...field} />
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
                  <FormLabel>Lead Traveller Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone Number" {...field} />
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
                  <FormLabel>Lead Traveller Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            {Array.from({ length: Math.max(0, numberOfAdults - 1) }).map(
              (_, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`guest_traveller_names.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest Traveller {index + 1} Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`Guest Traveller ${index + 1}`}
                          {...field}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            <FormField
              control={form.control}
              name="booking_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
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
                  <FormLabel>Acquisition</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select acquisition source" />
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
                  <FormLabel>Booking Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
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

          {/* Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            {/* Deposit Payment */}
            <div className="space-y-2">
              <FormLabel>Deposit Payment</FormLabel>
              <div className="text-sm font-semibold">
                £{(totalPrice / 3).toFixed(2)}
              </div>
              <FormField
                control={form.control}
                name="deposit_date"
                render={({ field }) => (
                  <FormItem>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
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
              <FormLabel>Payment 2</FormLabel>
              <div className="text-sm font-semibold">
                £{(totalPrice / 3).toFixed(2)}
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
                              "w-full justify-start text-left font-normal",
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
              <FormLabel>Final Payment</FormLabel>
              <div className="text-sm font-semibold">
                £{(totalPrice / 3).toFixed(2)}
              </div>
              <FormField
                control={form.control}
                name="final_payment_date"
                render={({ field }) => (
                  <FormItem>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
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
            <Button type="submit" size="lg" className="w-full">
              Send Booking Request
            </Button>
          </div>
        </form>
      </div>
    </Form>
  );
}

export { RequestBooking };
