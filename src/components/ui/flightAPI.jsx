import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plane, Search, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

const API_URL = import.meta.env.VITE_API_FLIGHT_URL || "http://localhost:3000/api/v1/flight";

const FlightAPI = () => {
    const [token, setToken] = useState(null);
    const [error, setError] = useState(null);
    const [searchResults, setSearchResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tripType, setTripType] = useState("return");
    const [departureDate, setDepartureDate] = useState(null);
    const [returnDate, setReturnDate] = useState(null);
    const [fromAirport, setFromAirport] = useState("");
    const [toAirport, setToAirport] = useState("");
    const [selectedCabin, setSelectedCabin] = useState("ECO");
    const [adultCount, setAdultCount] = useState(1);
    const [childCount, setChildCount] = useState(0);
    const [childAges, setChildAges] = useState([]);
    const [selectedFareTypes, setSelectedFareTypes] = useState(["ITR"]);
    const [directFlightsOnly, setDirectFlightsOnly] = useState(false);
    const [includeBaggageOnlyFares, setIncludeBaggageOnlyFares] = useState(false);
    const [sortBy, setSortBy] = useState("price");
    const [sortOrder, setSortOrder] = useState("asc");
    const [selectedAirlines, setSelectedAirlines] = useState([]);
    const [selectedCabins, setSelectedCabins] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [layoverRange, setLayoverRange] = useState([0, 360]); // in minutes, 0-6 hours
    const [outboundTimeRange, setOutboundTimeRange] = useState([0, 1440]); // minutes in day
    const [inboundTimeRange, setInboundTimeRange] = useState([0, 1440]);
    const [priceMinMax, setPriceMinMax] = useState([0, 10000]);
    const [layoverMinMax, setLayoverMinMax] = useState([0, 360]);
    const [outboundTimeMinMax, setOutboundTimeMinMax] = useState([0, 1440]);
    const [inboundTimeMinMax, setInboundTimeMinMax] = useState([0, 1440]);

    const getToken = async () => {
        try {
            const response = await axios.post(`${API_URL}/token`);
            setToken(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to get token');
            console.error('Error getting token:', err);
        }
    };

    const searchFlights = async () => {
        if (!token) {
            setError('No token available');
            return;
        }

        setLoading(true);
        try {
            const searchParams = {
                FlightRequestType: tripType === "return" ? "Return" : "OneWay",
                RequestedFlights: [
                    {
                        RequestedFlightTypes: directFlightsOnly ? ["NoStopDirect"] : [],
                        DepartureLocation: { AirportId: fromAirport.toUpperCase() },
                        ArrivalLocation: { AirportId: toAirport.toUpperCase() },
                        DepartureDateTime: format(departureDate, "yyyy-MM-dd"),
                        RequestedCabins: [{ CabinId: selectedCabin }]
                    },
                    ...(tripType === "return" ? [{
                        RequestedFlightTypes: directFlightsOnly ? ["NoStopDirect"] : [],
                        DepartureLocation: { AirportId: toAirport.toUpperCase() },
                        ArrivalLocation: { AirportId: fromAirport.toUpperCase() },
                        DepartureDateTime: format(returnDate, "yyyy-MM-dd"),
                        RequestedCabins: [{ CabinId: selectedCabin }]
                    }] : [])
                ],
                PassengerCount: {
                    PassengerTypeCount: { 
                        ADT: adultCount,
                        CHD: childCount
                    },
                    ChildAges: childAges,
                    AdultAges: []
                },
                FareTypes: selectedFareTypes,
                IncludeTaxes: true,
                IncludeFees: true,
                IncludeBaggageOnlyFares: includeBaggageOnlyFares,
                IncludeAlternateRoutes: !directFlightsOnly,
                NumberOfRecommendations: 50
            };

            console.log('Sending search request with params:', searchParams);
            console.log('Using token:', token.access_token);

            const response = await axios.post(`${API_URL}/search-low-fares`, {
                token: token.access_token,
                searchParams
            });

            console.log('Search response:', response.data);
            setSearchResults(response.data);
            setError(null);
        } catch (err) {
            console.error('Search error details:', err.response?.data || err.message);
            setError(err.response?.data?.error || 'Failed to search flights');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getToken();
    }, []);

    useEffect(() => {
        if (!searchResults?.LowFareResult?.Recommendations) return;
        const recs = searchResults.LowFareResult.Recommendations;
        // Price
        let minPrice = Infinity, maxPrice = 0;
        // Layover
        let minLayover = Infinity, maxLayover = 0;
        // Outbound/Inbound times
        let minOutbound = 1440, maxOutbound = 0, minInbound = 1440, maxInbound = 0;
        recs.forEach(rec => {
            // Price
            if (rec.Total < minPrice) minPrice = rec.Total;
            if (rec.Total > maxPrice) maxPrice = rec.Total;
            // Outbound
            const outId = rec.RouteCombinations[0]?.RouteIds[0];
            const inId = rec.RouteCombinations[0]?.RouteIds[1];
            if (outId) {
                const route = getRouteById(outId);
                if (route && route.FlightIds && route.FlightIds.length > 0) {
                    const firstSeg = getFlightById(route.FlightIds[0]);
                    if (firstSeg) {
                        const mins = getMinutes(firstSeg.DepartureDateTime);
                        if (mins < minOutbound) minOutbound = mins;
                        if (mins > maxOutbound) maxOutbound = mins;
                    }
                }
                // Layover
                const lay = getMaxLayoverForRoute(outId);
                if (lay < minLayover) minLayover = lay;
                if (lay > maxLayover) maxLayover = lay;
            }
            if (inId) {
                const route = getRouteById(inId);
                if (route && route.FlightIds && route.FlightIds.length > 0) {
                    const firstSeg = getFlightById(route.FlightIds[0]);
                    if (firstSeg) {
                        const mins = getMinutes(firstSeg.DepartureDateTime);
                        if (mins < minInbound) minInbound = mins;
                        if (mins > maxInbound) maxInbound = mins;
                    }
                }
                // Layover
                const lay = getMaxLayoverForRoute(inId);
                if (lay < minLayover) minLayover = lay;
                if (lay > maxLayover) maxLayover = lay;
            }
        });
        setPriceMinMax([Math.floor(minPrice), Math.ceil(maxPrice)]);
        setLayoverMinMax([Math.floor(minLayover), Math.ceil(maxLayover)]);
        setOutboundTimeMinMax([minOutbound, maxOutbound]);
        setInboundTimeMinMax([minInbound, maxInbound]);
        // Also update slider values if out of new range
        setPriceRange([Math.floor(minPrice), Math.ceil(maxPrice)]);
        setLayoverRange([Math.floor(minLayover), Math.ceil(maxLayover)]);
        setOutboundTimeRange([minOutbound, maxOutbound]);
        setInboundTimeRange([minInbound, maxInbound]);
    }, [searchResults]);

    const formatDuration = (duration) => {
        const [hours, minutes] = duration.split(':');
        return `${hours}h ${minutes}m`;
    };

    const getAirlineInfo = (airlineId) => {
        return searchResults?.LowFareResult?.Airlines?.find(a => a.AirlineId === airlineId);
    };

    const getAirportInfo = (airportId) => {
        return searchResults?.LowFareResult?.Locations?.find(l => l.AirportId === airportId);
    };

    const getCabinInfo = (cabinId) => {
        return searchResults?.LowFareResult?.Cabins?.find(c => c.CabinId === cabinId);
    };

    const getFareFamilyInfo = (fareFamilyId) => {
        return searchResults?.LowFareResult?.FareFamilies?.find(f => f.FareFamilyId === fareFamilyId);
    };

    const getServiceInfo = (serviceId) => {
        return searchResults?.LowFareResult?.FareFamilyServices?.find(s => s.ServiceId === serviceId);
    };

    const getServiceStatus = (serviceId, fareFamilyId) => {
        const fareFamily = getFareFamilyInfo(fareFamilyId);
        const serviceRef = fareFamily?.ServiceReferences?.find(s => s.ServiceId === serviceId);
        return serviceRef?.ServiceStatusId;
    };

    const renderServiceIcon = (serviceName) => {
        if (serviceName.toLowerCase().includes('baggage')) return <Briefcase className="w-4 h-4" />;
        if (serviceName.toLowerCase().includes('meal')) return <Utensils className="w-4 h-4" />;
        if (serviceName.toLowerCase().includes('wifi') || serviceName.toLowerCase().includes('internet')) return <Wifi className="w-4 h-4" />;
        return <Info className="w-4 h-4" />;
    };

    const renderServiceStatus = (status) => {
        switch (status) {
            case 'INCLUD':
                return <Badge variant="success" className="bg-green-500">Included</Badge>;
            case 'CHARGE':
                return <Badge variant="secondary">At charge</Badge>;
            case 'NOFERD':
                return <Badge variant="outline">Not offered</Badge>;
            default:
                return null;
        }
    };

    const formatCurrency = (amount, currencyCode) => {
        const currencySymbols = {
            'GBP': '£',
            'USD': '$',
            'EUR': '€',
            // Add more currencies as needed
        };
        return `${currencySymbols[currencyCode] || currencyCode}${amount.toFixed(2)}`;
    };

    const renderFlightDetails = (flight) => {
        const airline = getAirlineInfo(flight.MarketingAirlineId);
        const departureAirport = getAirportInfo(flight.DepartureAirportId);
        const arrivalAirport = getAirportInfo(flight.ArrivalAirportId);
        
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="text-lg font-bold">{airline?.AirlineId}</div>
                        <div className="text-sm text-muted-foreground">{airline?.AirlineName}</div>
                    </div>
                    <Badge variant="outline">Flight {flight.FlightNumber}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Departure</h4>
                        <div className="text-sm text-muted-foreground">
                            <div>{departureAirport?.AirportName}</div>
                            <div>Terminal {flight.DepartureTerminal}</div>
                            <div>{format(parseISO(flight.DepartureDateTime), "HH:mm")}</div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Arrival</h4>
                        <div className="text-sm text-muted-foreground">
                            <div>{arrivalAirport?.AirportName}</div>
                            <div>Terminal {flight.ArrivalTerminal}</div>
                            <div>{format(parseISO(flight.ArrivalDateTime), "HH:mm")}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Flight Details</h4>
                        <div className="text-sm text-muted-foreground">
                            <div>Duration: {formatDuration(flight.FlightDuration)}</div>
                            <div>Aircraft: {flight.AircraftType}</div>
                        </div>
                    </div>
                    {flight.LayoverDuration && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Layover</h4>
                            <div className="text-sm text-muted-foreground">
                                <div>Duration: {formatDuration(flight.LayoverDuration)}</div>
                                <div>Airport: {departureAirport?.AirportName}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Helper to get route object by RouteId
    const getRouteById = (routeId) => {
        const groups = searchResults?.LowFareResult?.RouteGroups || [];
        for (const group of groups) {
            const found = group.Routes.find(r => r.RouteId === routeId);
            if (found) return found;
        }
        return null;
    };

    // Helper to get flight by FlightId
    const getFlightById = (flightId) => {
        return searchResults?.LowFareResult?.Flights?.find(f => f.FlightId === flightId);
    };

    // Helper to render all segments for a route
    const renderRouteSegments = (routeId) => {
        const route = getRouteById(routeId);
        if (!route || !route.FlightIds || route.FlightIds.length === 0) return null;
        const segments = route.FlightIds.map(fid => getFlightById(fid)).filter(Boolean);
        return (
            <div className="flex flex-col gap-2 w-full">
                {segments.map((segment, idx) => {
                    const isLast = idx === segments.length - 1;
                    const nextSegment = segments[idx + 1];
                    return (
                        <div key={segment.FlightId} className="w-full">
                            <div className="flex items-center gap-4 w-full">
                                <div className="text-center min-w-[100px]">
                                    <div className="text-lg font-bold">
                                        {format(parseISO(segment.DepartureDateTime), "HH:mm")}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {getAirportInfo(segment.DepartureAirportId)?.AirportName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Terminal {segment.DepartureTerminal}
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col items-center">
                                    <div className="flex items-center w-full">
                                        <div className="flex-1 h-0.5 bg-primary/20" />
                                        <Plane className="w-4 h-4 text-primary mx-2" />
                                        <div className="flex-1 h-0.5 bg-primary/20" />
                                    </div>
                                    <div className="w-full flex justify-center mt-1">
                                        <span className="text-center text-sm text-muted-foreground w-full block" style={{letterSpacing: '0.05em'}}>
                                            {formatDuration(segment.FlightDuration)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {segment.MarketingAirlineId}{segment.FlightNumber}
                                    </div>
                                </div>
                                <div className="text-center min-w-[100px]">
                                    <div className="text-lg font-bold">
                                        {format(parseISO(segment.ArrivalDateTime), "HH:mm")}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {getAirportInfo(segment.ArrivalAirportId)?.AirportName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Terminal {segment.ArrivalTerminal}
                                    </div>
                                </div>
                            </div>
                            {/* Layover info */}
                            {!isLast && nextSegment && (
                                <div className="flex items-center justify-center text-xs text-yellow-700 mt-1">
                                    <span>
                                        Layover at {getAirportInfo(segment.ArrivalAirportId)?.AirportName} (
                                        {(() => {
                                            // Calculate layover duration
                                            const arr = parseISO(segment.ArrivalDateTime);
                                            const dep = parseISO(nextSegment.DepartureDateTime);
                                            const mins = (dep - arr) / 60000;
                                            const h = Math.floor(mins / 60);
                                            const m = mins % 60;
                                            return `${h}h ${m}m`;
                                        })()}
                                        )
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderRecommendation = (recommendation) => {
        console.log('Processing recommendation:', recommendation);
        
        // Get the flight IDs from the route combinations
        const outboundRouteId = recommendation.RouteCombinations[0].RouteIds[0];
        const inboundRouteId = recommendation.RouteCombinations[0].RouteIds[1];
        
        // Find the flights using the route IDs
        const outboundFlight = searchResults?.LowFareResult?.Flights?.find(
            f => f.FlightId === outboundRouteId.replace('G1R', 'F')
        );
        const inboundFlight = searchResults?.LowFareResult?.Flights?.find(
            f => f.FlightId === inboundRouteId.replace('G2R', 'F')
        );

        if (!outboundFlight || !inboundFlight) {
            console.log('Missing flight data for recommendation:', recommendation.RecommendationId);
            return null;
        }

        const fareFamily = getFareFamilyInfo(recommendation.FareFamilyIds[0]);
        const isOutboundLayover = outboundFlight.FlightType === "StopDirect";
        const isInboundLayover = inboundFlight.FlightType === "StopDirect";

        // Get passenger details
        const adultPassenger = recommendation.Passengers.find(p => p.RequestedTypeId === "ADT");
        const fareDetails = adultPassenger?.Fares[0];

        return (
            <Card key={recommendation.RecommendationId} className="mb-4 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                    <div className="flex items-start gap-6">
                        {/* Price and Fare Info */}
                        <div className="w-[200px] space-y-2">
                            <div className="text-2xl font-bold">
                                {formatCurrency(recommendation.Total, searchResults?.LowFareResult?.Currency?.CurrencyId)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <div>Fare: {formatCurrency(recommendation.Fare, searchResults?.LowFareResult?.Currency?.CurrencyId)}</div>
                                <div>Tax: {formatCurrency(recommendation.Tax, searchResults?.LowFareResult?.Currency?.CurrencyId)}</div>
                                <div>Fee: {formatCurrency(recommendation.Fee, searchResults?.LowFareResult?.Currency?.CurrencyId)}</div>
                            </div>
                            <div className="pt-2">
                                <Badge variant="outline" className="mb-1">
                                    {recommendation.FareTypeId} - {recommendation.FareSubTypeId}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                    Validating Airline: {getAirlineInfo(recommendation.ValidatingAirlineId)?.AirlineName || recommendation.ValidatingAirlineId}
                                </div>
                            </div>
                        </div>

                        {/* Flight Details */}
                        <div className="flex-1">
                            <div className="space-y-4">
                                {/* Outbound Flight */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="w-full cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                                            {renderRouteSegments(recommendation.RouteCombinations[0].RouteIds[0])}
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Outbound Flight Details</DialogTitle>
                                            <DialogDescription>
                                                {/* Show date of first segment */}
                                                {(() => {
                                                    const route = getRouteById(recommendation.RouteCombinations[0].RouteIds[0]);
                                                    const firstSeg = route && route.FlightIds && getFlightById(route.FlightIds[0]);
                                                    return firstSeg ? format(parseISO(firstSeg.DepartureDateTime), "EEEE, MMMM d, yyyy") : null;
                                                })()}
                                            </DialogDescription>
                                        </DialogHeader>
                                        {/* Show all segments in detail */}
                                        {(() => {
                                            const route = getRouteById(recommendation.RouteCombinations[0].RouteIds[0]);
                                            return route ? route.FlightIds.map(fid => renderFlightDetails(getFlightById(fid))) : null;
                                        })()}
                                    </DialogContent>
                                </Dialog>

                                {/* Inbound Flight */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="w-full cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                                            {renderRouteSegments(recommendation.RouteCombinations[0].RouteIds[1])}
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Return Flight Details</DialogTitle>
                                            <DialogDescription>
                                                {(() => {
                                                    const route = getRouteById(recommendation.RouteCombinations[0].RouteIds[1]);
                                                    const firstSeg = route && route.FlightIds && getFlightById(route.FlightIds[0]);
                                                    return firstSeg ? format(parseISO(firstSeg.DepartureDateTime), "EEEE, MMMM d, yyyy") : null;
                                                })()}
                                            </DialogDescription>
                                        </DialogHeader>
                                        {(() => {
                                            const route = getRouteById(recommendation.RouteCombinations[0].RouteIds[1]);
                                            return route ? route.FlightIds.map(fid => renderFlightDetails(getFlightById(fid))) : null;
                                        })()}
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Additional Details */}
                            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="font-medium">Baggage</div>
                                    <div className="text-muted-foreground">
                                        {fareDetails?.BaggageAllowance?.WeightInKilograms}kg
                                    </div>
                                </div>
                                <div>
                                    <div className="font-medium">Class</div>
                                    <div className="text-muted-foreground">
                                        {fareDetails?.ClassId} - {fareDetails?.FareBasisCode}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-medium">Available Seats</div>
                                    <div className="text-muted-foreground">
                                        {fareDetails?.Seats} seats
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Select Button */}
                        <div className="flex flex-col items-end justify-between min-w-[120px]">
                            <Button className="w-full">Select</Button>
                            <div className="text-xs text-muted-foreground text-right">
                                Ticketing deadline:<br />
                                {format(parseISO(recommendation.TicketingDeadline), "MMM dd, yyyy")}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const getUniqueAirlines = () => {
        if (!searchResults?.LowFareResult?.Airlines) return [];
        return searchResults.LowFareResult.Airlines.map(airline => ({
            id: airline.AirlineId,
            name: airline.AirlineName
        }));
    };

    const getUniqueCabins = () => {
        if (!searchResults?.LowFareResult?.Cabins) return [];
        return searchResults.LowFareResult.Cabins.map(cabin => ({
            id: cabin.CabinId,
            name: cabin.CabinName
        }));
    };

    // Helper to get all airlines for a route
    const getAllAirlinesForRoute = (routeId) => {
        const route = getRouteById(routeId);
        if (!route || !route.FlightIds) return [];
        return route.FlightIds
            .map(fid => getFlightById(fid)?.MarketingAirlineId)
            .filter(Boolean);
    };

    // Helper to get minutes from HH:mm
    const getMinutes = (dateStr) => {
        const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
        return d.getHours() * 60 + d.getMinutes();
    };

    // Helper to get max layover duration for a route
    const getMaxLayoverForRoute = (routeId) => {
        const route = getRouteById(routeId);
        if (!route || !route.FlightIds || route.FlightIds.length < 2) return 0;
        let maxLayover = 0;
        for (let i = 0; i < route.FlightIds.length - 1; i++) {
            const segA = getFlightById(route.FlightIds[i]);
            const segB = getFlightById(route.FlightIds[i + 1]);
            if (segA && segB) {
                const arr = parseISO(segA.ArrivalDateTime);
                const dep = parseISO(segB.DepartureDateTime);
                const mins = (dep - arr) / 60000;
                if (mins > maxLayover) maxLayover = mins;
            }
        }
        return maxLayover;
    };

    const sortAndFilterRecommendations = (recommendations) => {
        if (!recommendations) return [];

        // First filter
        let filtered = recommendations.filter(recommendation => {
            const outboundFlight = searchResults?.LowFareResult?.Flights?.find(
                f => f.FlightId === recommendation.RouteCombinations[0].RouteIds[0].replace('G1R', 'F')
            );
            const inboundFlight = searchResults?.LowFareResult?.Flights?.find(
                f => f.FlightId === recommendation.RouteCombinations[0].RouteIds[1].replace('G2R', 'F')
            );

            // Filter by airline
            if (selectedAirlines.length > 0) {
                let outboundAirlines = [];
                let inboundAirlines = [];
                if (recommendation.RouteCombinations[0]?.RouteIds[0]) {
                    outboundAirlines = getAllAirlinesForRoute(recommendation.RouteCombinations[0].RouteIds[0]);
                }
                if (recommendation.RouteCombinations[0]?.RouteIds[1]) {
                    inboundAirlines = getAllAirlinesForRoute(recommendation.RouteCombinations[0].RouteIds[1]);
                }
                const allAirlines = [...outboundAirlines, ...inboundAirlines];
                if (!allAirlines.some(a => selectedAirlines.includes(a))) {
                    return false;
                }
            }

            // Filter by cabin
            if (selectedCabins.length > 0) {
                const cabinId = recommendation.FareFamilyIds[0];
                if (!selectedCabins.includes(cabinId)) {
                    return false;
                }
            }

            // Filter by price range
            if (recommendation.Total < priceRange[0] || recommendation.Total > priceRange[1]) {
                return false;
            }

            // Layover filter
            if (layoverRange[1] < 360) { // only filter if not max
                let maxLayover = 0;
                if (recommendation.RouteCombinations[0]?.RouteIds[0]) {
                    maxLayover = Math.max(maxLayover, getMaxLayoverForRoute(recommendation.RouteCombinations[0].RouteIds[0]));
                }
                if (recommendation.RouteCombinations[0]?.RouteIds[1]) {
                    maxLayover = Math.max(maxLayover, getMaxLayoverForRoute(recommendation.RouteCombinations[0].RouteIds[1]));
                }
                if (maxLayover > layoverRange[1]) {
                    return false;
                }
            }

            // Outbound/inbound departure time filter
            const checkTimeInRange = (routeId, range) => {
                const route = getRouteById(routeId);
                if (!route || !route.FlightIds || route.FlightIds.length === 0) return true;
                const firstSeg = getFlightById(route.FlightIds[0]);
                if (!firstSeg) return true;
                const mins = getMinutes(firstSeg.DepartureDateTime);
                return mins >= range[0] && mins <= range[1];
            };
            if (recommendation.RouteCombinations[0]?.RouteIds[0] && !checkTimeInRange(recommendation.RouteCombinations[0].RouteIds[0], outboundTimeRange)) {
                return false;
            }
            if (recommendation.RouteCombinations[0]?.RouteIds[1] && !checkTimeInRange(recommendation.RouteCombinations[0].RouteIds[1], inboundTimeRange)) {
                return false;
            }

            return true;
        });

        // Then sort
        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "price":
                    comparison = a.Total - b.Total;
                    break;
                case "duration":
                    const aOutbound = searchResults?.LowFareResult?.Flights?.find(
                        f => f.FlightId === a.RouteCombinations[0].RouteIds[0].replace('G1R', 'F')
                    );
                    const bOutbound = searchResults?.LowFareResult?.Flights?.find(
                        f => f.FlightId === b.RouteCombinations[0].RouteIds[0].replace('G1R', 'F')
                    );
                    comparison = aOutbound.FlightDuration.localeCompare(bOutbound.FlightDuration);
                    break;
                case "departure":
                    const aDeparture = searchResults?.LowFareResult?.Flights?.find(
                        f => f.FlightId === a.RouteCombinations[0].RouteIds[0].replace('G1R', 'F')
                    );
                    const bDeparture = searchResults?.LowFareResult?.Flights?.find(
                        f => f.FlightId === b.RouteCombinations[0].RouteIds[0].replace('G1R', 'F')
                    );
                    comparison = new Date(aDeparture.DepartureDateTime) - new Date(bDeparture.DepartureDateTime);
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return filtered;
    };

    const renderSearchResults = () => {
        if (!searchResults) return null;

        const recommendations = searchResults.LowFareResult?.Recommendations || [];
        const sortedAndFilteredRecommendations = sortAndFilterRecommendations(recommendations);
        const airlines = getUniqueAirlines();
        const cabins = getUniqueCabins();

        return (
            <div className="space-y-8">
                <CardHeader>
                    <CardTitle>Available Flights</CardTitle>
                    <CardDescription>
                        Found {sortedAndFilteredRecommendations.length} flight options from {getAirportInfo(fromAirport)?.AirportName} to {getAirportInfo(toAirport)?.AirportName}
                    </CardDescription>
                </CardHeader>

                <div className="grid grid-cols-[300px_1fr] gap-6">
                    {/* Filters and Sort Sidebar */}
                    <Card className="h-fit">
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {/* Sort Options */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Sort By</h3>
                                    <div className="flex items-center space-x-4">
                                        <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Sort by" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="price">Price</SelectItem>
                                                <SelectItem value="duration">Duration</SelectItem>
                                                <SelectItem value="departure">Departure Time</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                        >
                                            {sortOrder === "asc" ? "↑" : "↓"}
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                {/* Filter Options */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Filters</h3>
                                    
                                    {/* Airline Filter */}
                                    <div>
                                        <Label>Airlines</Label>
                                        <div className="space-y-2 mt-2">
                                            {airlines.map(airline => (
                                                <div key={airline.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`airline-${airline.id}`}
                                                        checked={selectedAirlines.includes(airline.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedAirlines([...selectedAirlines, airline.id]);
                                                            } else {
                                                                setSelectedAirlines(selectedAirlines.filter(id => id !== airline.id));
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor={`airline-${airline.id}`}>{airline.name}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Cabin Filter */}
                                    <div>
                                        <Label>Cabin Class</Label>
                                        <div className="space-y-2 mt-2">
                                            {cabins.map(cabin => (
                                                <div key={cabin.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`cabin-${cabin.id}`}
                                                        checked={selectedCabins.includes(cabin.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedCabins([...selectedCabins, cabin.id]);
                                                            } else {
                                                                setSelectedCabins(selectedCabins.filter(id => id !== cabin.id));
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor={`cabin-${cabin.id}`}>{cabin.name}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Price Range Filter */}
                                    <div>
                                        <Label>Price Range (£)</Label>
                                        <Slider
                                            min={priceMinMax[0]}
                                            max={priceMinMax[1]}
                                            step={10}
                                            value={priceRange}
                                            onValueChange={setPriceRange}
                                            className="mt-2"
                                        />
                                        <div className="flex justify-between text-xs mt-1">
                                            <span>£{priceRange[0]}</span>
                                            <span>£{priceRange[1]}</span>
                                        </div>
                                    </div>

                                    {/* Layover Time Slider */}
                                    <div>
                                        <Label>Max Layover (hours)</Label>
                                        <Slider
                                            min={layoverMinMax[0]}
                                            max={layoverMinMax[1]}
                                            step={15}
                                            value={layoverRange}
                                            onValueChange={setLayoverRange}
                                            className="mt-2"
                                        />
                                        <div className="flex justify-between text-xs mt-1">
                                            <span>{Math.floor(layoverRange[0]/60)}h</span>
                                            <span>{Math.floor(layoverRange[1]/60)}h</span>
                                        </div>
                                    </div>

                                    {/* Outbound Departure Time Slider */}
                                    <div>
                                        <Label>Outbound Departure Time</Label>
                                        <Slider
                                            min={outboundTimeMinMax[0]}
                                            max={outboundTimeMinMax[1]}
                                            step={15}
                                            value={outboundTimeRange}
                                            onValueChange={setOutboundTimeRange}
                                            className="mt-2"
                                        />
                                        <div className="flex justify-between text-xs mt-1">
                                            <span>{`${String(Math.floor(outboundTimeRange[0]/60)).padStart(2,'0')}:${String(outboundTimeRange[0]%60).padStart(2,'0')}`}</span>
                                            <span>{`${String(Math.floor(outboundTimeRange[1]/60)).padStart(2,'0')}:${String(outboundTimeRange[1]%60).padStart(2,'0')}`}</span>
                                        </div>
                                    </div>

                                    {/* Inbound Departure Time Slider */}
                                    <div>
                                        <Label>Inbound Departure Time</Label>
                                        <Slider
                                            min={inboundTimeMinMax[0]}
                                            max={inboundTimeMinMax[1]}
                                            step={15}
                                            value={inboundTimeRange}
                                            onValueChange={setInboundTimeRange}
                                            className="mt-2"
                                        />
                                        <div className="flex justify-between text-xs mt-1">
                                            <span>{`${String(Math.floor(inboundTimeRange[0]/60)).padStart(2,'0')}:${String(inboundTimeRange[0]%60).padStart(2,'0')}`}</span>
                                            <span>{`${String(Math.floor(inboundTimeRange[1]/60)).padStart(2,'0')}:${String(inboundTimeRange[1]%60).padStart(2,'0')}`}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results */}
                    <div className="space-y-4">
                        {sortedAndFilteredRecommendations.map(recommendation => renderRecommendation(recommendation))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Flight Search</CardTitle>
                    <CardDescription>Find the best flight deals for your journey</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="return" className="w-full" onValueChange={setTripType}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="return">Return Trip</TabsTrigger>
                            <TabsTrigger value="oneway">One Way</TabsTrigger>
                        </TabsList>
                        
                        <div className="grid gap-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="from">From</Label>
                                    <Input
                                        id="from"
                                        placeholder="Airport Code (e.g., LON)"
                                        value={fromAirport}
                                        onChange={(e) => setFromAirport(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="to">To</Label>
                                    <Input
                                        id="to"
                                        placeholder="Airport Code (e.g., DXB)"
                                        value={toAirport}
                                        onChange={(e) => setToAirport(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Departure Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !departureDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {departureDate ? format(departureDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={departureDate}
                                                onSelect={setDepartureDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {tripType === "return" && (
                                    <div className="space-y-2">
                                        <Label>Return Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !returnDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {returnDate ? format(returnDate, "PPP") : "Pick a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={returnDate}
                                                    onSelect={setReturnDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cabin Class</Label>
                                    <Select value={selectedCabin} onValueChange={setSelectedCabin}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select cabin class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ECO">Economy</SelectItem>
                                            <SelectItem value="BUS">Business</SelectItem>
                                            <SelectItem value="FIR">First</SelectItem>
                                            <SelectItem value="PRE">Premium Economy</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Fare Type</Label>
                                    <Select 
                                        value={selectedFareTypes[0]} 
                                        onValueChange={(value) => setSelectedFareTypes([value])}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select fare type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ITR">Inclusive Tour Fare</SelectItem>
                                            <SelectItem value="STO">Seat Only Fare</SelectItem>
                                            <SelectItem value="PBL">Published Fare</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Adults</Label>
                                    <Select 
                                        value={adultCount.toString()} 
                                        onValueChange={(value) => setAdultCount(parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Number of adults" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                                <SelectItem key={num} value={num.toString()}>
                                                    {num} {num === 1 ? 'Adult' : 'Adults'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Children</Label>
                                    <Select 
                                        value={childCount.toString()} 
                                        onValueChange={(value) => {
                                            const count = parseInt(value);
                                            setChildCount(count);
                                            if (count > childAges.length) {
                                                setChildAges([...childAges, ...Array(count - childAges.length).fill(0)]);
                                            } else {
                                                setChildAges(childAges.slice(0, count));
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Number of children" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[0, 1, 2, 3, 4, 5, 6].map(num => (
                                                <SelectItem key={num} value={num.toString()}>
                                                    {num} {num === 1 ? 'Child' : 'Children'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {childCount > 0 && (
                                <div className="space-y-2">
                                    <Label>Children's Ages</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {childAges.map((age, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <Select
                                                    value={age.toString()}
                                                    onValueChange={(value) => {
                                                        const newAges = [...childAges];
                                                        newAges[index] = parseInt(value);
                                                        setChildAges(newAges);
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Age" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: 17 }, (_, i) => i + 1).map(num => (
                                                            <SelectItem key={num} value={num.toString()}>
                                                                {num} {num === 1 ? 'year' : 'years'}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="directFlightsOnly"
                                        checked={directFlightsOnly}
                                        onCheckedChange={setDirectFlightsOnly}
                                    />
                                    <Label htmlFor="directFlightsOnly">Direct Flights Only</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="includeBaggageOnlyFares"
                                        checked={includeBaggageOnlyFares}
                                        onCheckedChange={setIncludeBaggageOnlyFares}
                                    />
                                    <Label htmlFor="includeBaggageOnlyFares">Include Baggage Only Fares</Label>
                                </div>
                            </div>

                            <Button 
                                className="w-full mt-4"
                                onClick={searchFlights}
                                disabled={!token || loading || !fromAirport || !toAirport || !departureDate || (tripType === "return" && !returnDate)}
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        Searching...
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <Search className="mr-2 h-4 w-4" />
                                        Search Flights
                                    </div>
                                )}
                            </Button>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>

            {error && (
                <Card className="mb-8 border-red-500">
                    <CardContent className="pt-6">
                        <div className="text-red-500">{error}</div>
                    </CardContent>
                </Card>
            )}

            {renderSearchResults()}
        </div>
    );
};

export { FlightAPI };
