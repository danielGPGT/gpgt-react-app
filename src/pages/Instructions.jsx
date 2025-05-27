import { HelpCircle } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { AppHeader } from "@/components/ui/app-header";

export default function Instructions() {
  return (
    <SidebarProvider>
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
      <AppSidebar />
      <main className="w-full">
        <div className="p-8">
          <AppHeader className="mb-6" />

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Instructions</h1>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Navigation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a href="#event-workflow" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">1</div>
                <span>Event & Inventory Workflow</span>
              </a>
              <a href="#package-creation" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">2</div>
                <span>Package Creation Guide</span>
              </a>
              <a href="#internal-pricing" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">3</div>
                <span>Internal Pricing & Booking Guide</span>
              </a>
              <a href="#help" className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">4</div>
                <span>Need Help?</span>
              </a>
            </div>
          </div>

          <div className="grid gap-8">
            <section id="event-workflow" className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <h2 className="text-2xl font-semibold">Event & Inventory Creation Workflow</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-primary mb-2">Important Prerequisite</h3>
                  <p className="text-muted-foreground">
                    Before adding any inventory items, you must make sure the event is created in the system. All inventory items (tickets, hotels, transfers, etc.) must be associated with an existing event.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Creating a New Event</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Navigate to the Package Builder section</li>
                    <li>Select "Events" from the submenu</li>
                    <li>Click "Create New Event"</li>
                    <li>Fill in the event details including:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Event name and description</li>
                        <li>Date and time</li>
                        <li>Location details</li>
                        <li>Other relevant event information</li>
                      </ul>
                    </li>
                    <li>Assign or create a venue:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Select from existing venues if available</li>
                        <li>If no suitable venue exists, create a new one in the Venues section</li>
                      </ul>
                    </li>
                    <li>Save the event</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Setting Up Tickets</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Go to the Inventory section</li>
                    <li>Select "Tickets" from the submenu</li>
                    <li>Click "Add New Ticket"</li>
                    <li>Select the event you created</li>
                    <li>Choose or create a ticket category:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Select from existing categories if available</li>
                        <li>If needed, create a new category in the Ticket Categories section</li>
                      </ul>
                    </li>
                    <li>Enter ticket details:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Unit cost</li>
                        <li>Quantity available</li>
                        <li>Ticket name/description</li>
                        <li>Any specific ticket restrictions or notes</li>
                      </ul>
                    </li>
                    <li>Save the ticket information</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Managing Hotels & Rooms</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Navigate to the Inventory section</li>
                    <li>Select "Hotels & Rooms" from the submenu</li>
                    <li>Click "Add New Hotel" or "Add New Room"</li>
                    <li>For hotels, provide:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Hotel name and location</li>
                        <li>Star rating and amenities</li>
                        <li>Distance from event venue</li>
                        <li>Contact information</li>
                      </ul>
                    </li>
                    <li>For rooms, specify:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Room type and capacity</li>
                        <li>Available dates</li>
                        <li>Pricing per night</li>
                        <li>Special features or restrictions</li>
                      </ul>
                    </li>
                    <li>Save the hotel/room information</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Setting Up Circuit Transfers</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Go to the Inventory section</li>
                    <li>Select "Circuit Transfers" from the submenu</li>
                    <li>Click "Add New Transfer"</li>
                    <li>Configure transfer details:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Pick-up and drop-off locations</li>
                        <li>Schedule and frequency</li>
                        <li>Vehicle type and capacity</li>
                        <li>Pricing per transfer</li>
                      </ul>
                    </li>
                    <li>Set availability and restrictions</li>
                    <li>Save the transfer configuration</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Managing Airport Transfers</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Navigate to the Inventory section</li>
                    <li>Select "Airport Transfers" from the submenu</li>
                    <li>Click "Add New Transfer"</li>
                    <li>Enter transfer details:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Airport name and terminal</li>
                        <li>Hotel/venue destination</li>
                        <li>Vehicle options and pricing</li>
                        <li>Operating hours and schedule</li>
                      </ul>
                    </li>
                    <li>Set booking requirements:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Advance notice period</li>
                        <li>Group size limitations</li>
                        <li>Luggage restrictions</li>
                      </ul>
                    </li>
                    <li>Save the airport transfer details</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Creating Lounge Passes</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Go to the Inventory section</li>
                    <li>Select "Lounge Passes" from the submenu</li>
                    <li>Click "Add New Pass"</li>
                    <li>Configure pass details:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Lounge name and location</li>
                        <li>Access times and duration</li>
                        <li>Included amenities and services</li>
                        <li>Pass pricing and availability</li>
                      </ul>
                    </li>
                    <li>Set restrictions and requirements:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Age restrictions if any</li>
                        <li>Dress code requirements</li>
                        <li>Booking conditions</li>
                      </ul>
                    </li>
                    <li>Save the lounge pass configuration</li>
                  </ol>
                </div>
              </div>
            </section>

            <section id="package-creation" className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <h2 className="text-2xl font-semibold">Package Creation Guide</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-primary mb-2">Important Prerequisite</h3>
                  <p className="text-muted-foreground">
                    Before creating a package, ensure that all required inventory items are available in the system:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-muted-foreground">
                    <li>Event tickets must be created and configured</li>
                    <li>Hotel rooms must be set up if accommodation is included</li>
                    <li>Transfers (circuit and/or airport) must be configured if included</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Creating Packages</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Navigate to the Package Builder section</li>
                    <li>Select "Packages" from the submenu</li>
                    <li>Click "Create New Package"</li>
                    <li>Select the event for this package</li>
                    <li>Create package types:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Add Grandstand package details</li>
                        <li>Add VIP package details if applicable</li>
                      </ul>
                    </li>
                    <li>Create package tiers:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Go to "Package Tiers" section</li>
                        <li>Create Bronze, Silver, and Gold tiers</li>
                        <li>For each tier, assign:
                          <ul className="list-disc list-inside ml-4 mt-2">
                            <li>Selected tickets from the event</li>
                            <li>Room options (when available)</li>
                            <li>Transfer options (when available)</li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                    <li>Review and save the package configuration</li>
                    <li>The package will now appear in the Sales Pricing section for booking</li>
                  </ol>
                </div>
              </div>
            </section>

            <section id="internal-pricing" className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <h2 className="text-2xl font-semibold">Internal Pricing & Booking Guide</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-primary mb-2">Important Prerequisite</h3>
                  <p className="text-muted-foreground">
                    Before creating a booking, ensure that all required items are selected and configured in the pricing sheet:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-muted-foreground">
                    <li>Event and package must be selected</li>
                    <li>Hotel and room must be configured if accommodation is included</li>
                    <li>Transfers (circuit and/or airport) must be set up if included</li>
                    <li>Flight details must be entered if applicable</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Using the Pricing Sheet</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Select Event and Package:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Choose the sport and event from the dropdown menus</li>
                        <li>Select the appropriate package and tier</li>
                        <li>Set the number of adults for the booking</li>
                      </ul>
                    </li>
                    <li>Configure Accommodation:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Select the hotel from the available options</li>
                        <li>Choose the room type and category</li>
                        <li>Set the check-in and check-out dates</li>
                        <li>Specify the number of rooms needed</li>
                      </ul>
                    </li>
                    <li>Set Up Transfers:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Configure circuit transfers if required</li>
                        <li>Set up airport transfers with direction (inbound/outbound/both)</li>
                        <li>Verify transfer quantities match the number of guests</li>
                      </ul>
                    </li>
                    <li>Add Additional Services:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Select flight options if applicable</li>
                        <li>Add lounge passes if needed</li>
                        <li>Verify all quantities and prices</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Creating a Booking</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Review the Booking Summary:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Verify all selected items and quantities</li>
                        <li>Check the total price in the selected currency</li>
                        <li>Ensure all dates and details are correct</li>
                      </ul>
                    </li>
                    <li>Fill in Booking Details:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Enter booker information (name, email, phone)</li>
                        <li>Add lead traveler details</li>
                        <li>Specify guest names and contact information</li>
                        <li>Set booking type and acquisition details</li>
                      </ul>
                    </li>
                    <li>Configure Payment Schedule:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Set payment dates and amounts</li>
                        <li>Choose between standard or custom payment schedule</li>
                        <li>Verify payment currency and amounts</li>
                      </ul>
                    </li>
                    <li>Complete the Booking:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Review all information for accuracy</li>
                        <li>Click "Create Booking" to submit</li>
                        <li>Save or print the booking reference</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Additional Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Currency Conversion:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Switch between available currencies (GBP, USD, EUR, AUD, CAD)</li>
                        <li>View real-time converted prices</li>
                        <li>Set final booking currency</li>
                      </ul>
                    </li>
                    <li>Quote Generation:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Generate detailed quotes for clients</li>
                        <li>Include all selected items and pricing</li>
                        <li>Save or share quotes as needed</li>
                      </ul>
                    </li>
                    <li>Booking Management:
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Track booking status and payments</li>
                        <li>Manage guest information</li>
                        <li>Update booking details as needed</li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="help" className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="bg-primary/10 text-primary rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <h2 className="text-2xl font-semibold">Need Help?</h2>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  If you need additional assistance, please contact our support team or refer to the detailed documentation.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
} 