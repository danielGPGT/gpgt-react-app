"use client";

import { useEffect, useState } from "react";
import { DynamicBreadcrumb } from "@/components/ui/dy-breadcrumb";
import { InternalPricing } from "@/components/ui/internalPricing";
import { ExternalPricing } from "@/components/ui/externalPricing";
import { BookingForm } from "@/components/ui/bookingForm";
import { RequestBooking } from "@/components/ui/requestBooking";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { jwtDecode } from "jwt-decode"; // Import this
import api from "@/lib/api"; // Import your api
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function PricingSheet() {
  const [numberOfAdults, setNumberOfAdults] = useState(2);
  const [totalPrice, setTotalPrice] = useState(0);
  const [role, setRole] = useState(""); // Track user role

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode(token);
        setRole(decoded.role);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    }
    fetchCurrentUser();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="p-8">
          <div className="flex gap-6 items-center">
            <SidebarTrigger />
            <DynamicBreadcrumb />
          </div>

          <div className="flex w-full justify-between mt-4 gap-6">
            {/* Conditionally render based on role */}
            {["Internal Sales", "Operations"].includes(role) && (
              <div className="flex w-full justify-between mt-4 gap-6">
                <InternalPricing
                  numberOfAdults={numberOfAdults}
                  setNumberOfAdults={setNumberOfAdults}
                  totalPrice={totalPrice}
                  setTotalPrice={setTotalPrice}
                />
                <BookingForm
                  numberOfAdults={numberOfAdults}
                  totalPrice={totalPrice}
                />
              </div>
            )}

            {/* Conditionally render based on role */}
            {role === "Admin" && (
              <div className="w-full">
                <Tabs defaultValue="internal" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="internal">Internal Pricing</TabsTrigger>
                    <TabsTrigger value="external">External Pricing</TabsTrigger>
                  </TabsList>

                  <TabsContent value="internal">
                    <div className="flex w-full justify-between gap-6">
                      <InternalPricing
                        numberOfAdults={numberOfAdults}
                        setNumberOfAdults={setNumberOfAdults}
                        totalPrice={totalPrice}
                        setTotalPrice={setTotalPrice}
                      />
                      <BookingForm
                        numberOfAdults={numberOfAdults}
                        totalPrice={totalPrice}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="external">
                    <div className="flex w-full justify-between gap-4 mt-1">
                      <ExternalPricing
                        numberOfAdults={numberOfAdults}
                        setNumberOfAdults={setNumberOfAdults}
                        totalPrice={totalPrice}
                        setTotalPrice={setTotalPrice}
                      />
                      <RequestBooking
                        numberOfAdults={numberOfAdults}
                        totalPrice={totalPrice}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {role === "External B2B" && (
              <div className="flex w-full justify-between mt-4 gap-6">
                <ExternalPricing
                  numberOfAdults={numberOfAdults}
                  setNumberOfAdults={setNumberOfAdults}
                  totalPrice={totalPrice}
                  setTotalPrice={setTotalPrice}
                />
                <RequestBooking
                  numberOfAdults={numberOfAdults}
                  totalPrice={totalPrice}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}

export { PricingSheet };
