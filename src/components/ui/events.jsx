import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Events() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [circuitTransfers, setCircuitTransfers] = useState([]);
  const [loadingCircuitTransfers, setLoadingCircuitTransfers] = useState(false);
  const [selectedCircuitTransfer, setSelectedCircuitTransfer] = useState(null);

  const [airportTransfers, setAirportTransfers] = useState([]);
  const [loadingAirportTransfers, setLoadingAirportTransfers] = useState(false);
  const [selectedAirportTransfer, setSelectedAirportTransfer] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/event");
        setEvents(res.data);
      } catch (error) {
        console.error("Failed to fetch events:", error.message);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const handleEventSelect = async (eventId) => {
    const foundEvent = events.find((ev) => ev.event_id === eventId);
    setSelectedEvent(foundEvent);
    setSelectedPackage(null);
    setSelectedHotel(null);
    setSelectedRoom(null);
    setHotels([]);
    setRooms([]);

    if (foundEvent) {
      try {
        setLoadingPackages(true);
        const res = await api.get("/packages", {
          params: { eventId: foundEvent.event_id },
        });
        setPackages(res.data);
      } catch (error) {
        console.error("Failed to fetch packages:", error.message);
        setPackages([]);
      } finally {
        setLoadingPackages(false);
      }
    }
  };

  const handlePackageSelect = async (packageId) => {
    const foundPackage = packages.find((pkg) => pkg.package_id === packageId);
    setSelectedPackage(foundPackage);
    setSelectedHotel(null);
    setSelectedRoom(null);
    setHotels([]);
    setRooms([]);
    setTickets([]);
    setSelectedTicket(null);

    if (foundPackage) {
      try {
        setLoadingHotels(true);
        setLoadingTickets(true);

        const [hotelsRes, ticketsRes] = await Promise.all([
          api.get("/hotels", {
            params: { packageId: foundPackage.package_id },
          }),
          api.get("/tickets", {
            params: { packageId: foundPackage.package_id },
          }),
        ]);

        setHotels(hotelsRes.data);
        setTickets(ticketsRes.data);
      } catch (error) {
        console.error("Failed to fetch hotels or tickets:", error.message);
        setHotels([]);
        setTickets([]);
      } finally {
        setLoadingHotels(false);
        setLoadingTickets(false);
      }
    }
  };

  const handleHotelSelect = async (hotelId) => {
    const foundHotel = hotels.find((hotel) => hotel.hotel_id === hotelId);
    setSelectedHotel(foundHotel);
    setSelectedRoom(null);
    setSelectedCircuitTransfer(null);
    setRooms([]);
    setCircuitTransfers([]);
    setAirportTransfers([]);

    if (foundHotel) {
      try {
        setLoadingRooms(true);
        setLoadingCircuitTransfers(true);
        setLoadingAirportTransfers(true);

        const [roomsRes, circuitTransfersRes, airportTransfersRes] =
          await Promise.all([
            api.get("/rooms", { params: { hotelId: foundHotel.hotel_id } }),
            api.get("/circuit-transfers", {
              params: { hotelId: foundHotel.hotel_id },
            }),
            api.get("/airport-transfers", {
              params: { hotelId: foundHotel.hotel_id },
            }),
          ]);

        setRooms(roomsRes.data);
        setCircuitTransfers(circuitTransfersRes.data);
        setAirportTransfers(airportTransfersRes.data);
      } catch (error) {
        console.error(
          "Failed to fetch rooms, circuit transfers, or airport transfers found:",
          error.message
        );
        setRooms([]);
        setCircuitTransfers([]);
        setAirportTransfers([]);
      } finally {
        setLoadingRooms(false);
        setLoadingCircuitTransfers(false);
        setLoadingAirportTransfers(false);
      }
    }
  };

  const handleRoomSelect = (roomId) => {
    const foundRoom = rooms.find((room) => room.room_id === roomId);
    setSelectedRoom(foundRoom);
  };

  if (loadingEvents) {
    return <div className="p-8">Loading events...</div>;
  }

  return (
    <div className="pt-8 space-y-8">
      {/* Event Select */}
      <div>
        <h1 className="text-3xl font-bold mb-6">Select Event</h1>

        <Select onValueChange={handleEventSelect}>
          <SelectTrigger className="w-full md:w-1/2">
            <SelectValue placeholder="Choose an event..." />
          </SelectTrigger>
          <SelectContent>
            {events.map((event, idx) => (
              <SelectItem key={idx} value={event.event_id}>
                {event.event || event.event_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedEvent && (
          <div className="mt-6 p-4 border rounded-md shadow-sm space-y-2">
            <h2 className="text-xl font-semibold">
              {selectedEvent.event || selectedEvent.event_name}
            </h2>
            <p>
              <span className="font-semibold">Start Date:</span>{" "}
              {selectedEvent.event_start_date}
            </p>
            <p>
              <span className="font-semibold">End Date:</span>{" "}
              {selectedEvent.event_end_date}
            </p>
            <p>
              <span className="font-semibold">Venue:</span>{" "}
              {selectedEvent.venue}
            </p>
            <p>
              <span className="font-semibold">City:</span> {selectedEvent.city}
            </p>
          </div>
        )}
      </div>

      {/* Package Select */}
      {selectedEvent && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Select Package</h2>

          {loadingPackages ? (
            <div>Loading packages...</div>
          ) : packages.length > 0 ? (
            <Select onValueChange={handlePackageSelect}>
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Choose a package..." />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg, idx) => (
                  <SelectItem key={idx} value={pkg.package_id}>
                    {pkg.package_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p>No packages available for this event.</p>
          )}

          {selectedPackage && (
            <div className="mt-6 p-4 border rounded-md shadow-sm space-y-2">
              <h2 className="text-xl font-semibold">
                {selectedPackage.package_name}
              </h2>
              <p>
                <span className="font-semibold">Package ID:</span>{" "}
                {selectedPackage.package_id}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ticket Select */}
      {selectedPackage && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Select Ticket</h2>

          {loadingTickets ? (
            <div>Loading tickets...</div>
          ) : tickets.length > 0 ? (
            <Select
              onValueChange={(ticketId) => {
                const foundTicket = tickets.find(
                  (t) => t.ticket_id === ticketId
                );
                setSelectedTicket(foundTicket);
              }}
            >
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Choose a ticket..." />
              </SelectTrigger>
              <SelectContent>
                {tickets.map((ticket, idx) => (
                  <SelectItem key={idx} value={ticket.ticket_id}>
                    {ticket.ticket_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p>No tickets available for this package.</p>
          )}

          {selectedTicket && (
            <div className="mt-6 p-4 border rounded-md shadow-sm space-y-2">
              <h2 className="text-xl font-semibold">
                {selectedTicket.ticket_name}
              </h2>
              <p>
                <span className="font-semibold">Ticket Price:</span>{" "}
                {selectedTicket.price}
              </p>
              <p>
                <span className="font-semibold">Remaining:</span>{" "}
                {selectedTicket.remaining}
              </p>
              <p>
                <span className="font-semibold">Event Days:</span>{" "}
                {selectedTicket.event_days}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hotel Select */}
      {selectedPackage && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Select Hotel</h2>

          {loadingHotels ? (
            <div>Loading hotels...</div>
          ) : hotels.length > 0 ? (
            <Select onValueChange={handleHotelSelect}>
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Choose a hotel..." />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel, idx) => (
                  <SelectItem key={idx} value={hotel.hotel_id}>
                    {hotel.hotel_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p>No hotels available for this package.</p>
          )}

          {selectedHotel && (
            <div className="mt-6 p-4 border rounded-md shadow-sm space-y-2">
              <h2 className="text-xl font-semibold">
                {selectedHotel.hotel_name}
              </h2>
              <p>
                <span className="font-semibold">Hotel ID:</span>{" "}
                {selectedHotel.hotel_id}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Room Select */}
      {selectedHotel && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Select Room</h2>

          {loadingRooms ? (
            <div>Loading rooms...</div>
          ) : rooms.length > 0 ? (
            <Select onValueChange={handleRoomSelect}>
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Choose a room..." />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room, idx) => (
                  <SelectItem key={idx} value={room.room_id}>
                    {room.room_category} - {room.room_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p>No rooms available for this hotel.</p>
          )}

          {selectedRoom && (
            <div className="mt-6 p-4 border rounded-md shadow-sm space-y-2">
              <h2 className="text-xl font-semibold">
                {selectedRoom.room_category} - {selectedRoom.room_type}
              </h2>
              <p>
                <span className="font-semibold">Room ID:</span>{" "}
                {selectedRoom.room_id}
              </p>
              <p>
                <span className="font-semibold">Room Price:</span>{" "}
                {selectedRoom.price}
              </p>
              <p>
                <span className="font-semibold">Nights:</span>{" "}
                {selectedRoom.nights}
              </p>
              <p>
                <span className="font-semibold">Extra Night Price:</span>{" "}
                {selectedRoom.extra_night_price}
              </p>
              <p>
                <span className="font-semibold">Remaining:</span>{" "}
                {selectedRoom.remaining}
              </p>
              <p>
                <span className="font-semibold">Max Guests:</span>{" "}
                {selectedRoom.max_guests}
              </p>
            </div>
          )}
        </div>
      )}
      {/* Circuit Transfers Select */}
      {selectedHotel && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Select Circuit Transfer</h2>

          {loadingCircuitTransfers ? (
            <div>Loading circuit transfers...</div>
          ) : circuitTransfers.length > 0 ? (
            <Select
              onValueChange={(transferId) => {
                const foundTransfer = circuitTransfers.find(
                  (t) => t.circuit_transfer_id === transferId
                );
                setSelectedCircuitTransfer(foundTransfer);
              }}
            >
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Choose a circuit transfer..." />
              </SelectTrigger>
              <SelectContent>
                {circuitTransfers.map((transfer, idx) => (
                  <SelectItem key={idx} value={transfer.circuit_transfer_id}>
                    {transfer.transport_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p>No circuit transfers available for this hotel.</p>
          )}

          {selectedCircuitTransfer && (
            <div className="mt-6 p-4 border rounded-md shadow-sm space-y-2">
              <h2 className="text-xl font-semibold">
                {selectedCircuitTransfer.transport_type}
              </h2>
              <p>
                <span className="font-semibold">Circuit Transfer ID:</span>{" "}
                {selectedCircuitTransfer.circuit_transfer_id}
              </p>
              <p>
                <span className="font-semibold">Price:</span>{" "}
                {selectedCircuitTransfer.price}
              </p>
              <p>
                <span className="font-semibold">Max Capacity:</span>{" "}
                {selectedCircuitTransfer.max_capacity}
              </p>
            </div>
          )}npx shadcn@latest add sidebar

        </div>
      )}

      {/* Circuit Transfers Select */}
      {selectedHotel && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Select Airport Transfer</h2>

          {loadingAirportTransfers ? (
            <div>Loading airport transfers...</div>
          ) : airportTransfers.length > 0 ? (
            <Select
              onValueChange={(transferId) => {
                const foundTransfer = airportTransfers.find(
                  (t) => t.airport_transfer_id === transferId
                );
                setSelectedAirportTransfer(foundTransfer);
              }}
            >
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Choose a airport transfer..." />
              </SelectTrigger>
              <SelectContent>
                {airportTransfers.map((transfer, idx) => (
                  <SelectItem key={idx} value={transfer.airport_transfer_id}>
                    {transfer.transport_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p>No airport transfers available.</p>
          )}

          {selectedAirportTransfer && (
            <div className="mt-6 p-4 border rounded-md shadow-sm space-y-2">
              <h2 className="text-xl font-semibold">
                {selectedAirportTransfer.transport_type}
              </h2>
              <p>
                <span className="font-semibold">Airport Transfer ID:</span>{" "}
                {selectedAirportTransfer.airport_transfer_id}
              </p>
              <p>
                <span className="font-semibold">Price:</span>{" "}
                {selectedAirportTransfer.price}
              </p>
              <p>
                <span className="font-semibold">Max Capacity:</span>{" "}
                {selectedAirportTransfer.max_capacity}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { Events };
