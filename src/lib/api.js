import axios from 'axios';
import { GoogleGenAI } from "@google/genai";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1/' || 'https://gpgt-api.onrender.com/api/v1/',
  withCredentials: true // allow cookies (useful later if you want secure auth)
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only remove token if it's an authentication error
      if (error.response.data?.requiresReauth) {
        localStorage.removeItem('token');
        // Redirect to login page
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Add Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Google AI client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Function to generate itinerary using Gemini
export const generateItinerary = async (bookingData) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `Create a detailed day-by-day itinerary for a Grand Prix event, don't include any unnecessary information. Format the response in a clear, structured way with the following guidelines:

1. Start each day with "Day X - [Day of Week] - [Day Title]" on a new line
2. List each activity with its time in 24-hour format (HH:MM)
3. Use the hotel name "${bookingData.hotel_name}" when first mentioning the hotel
4. Include flight information with:
   - Full airport names (e.g., "London Heathrow Airport" not just "Heathrow")
   - Departure and arrival times
   - Flight number (only if provided in the booking)
   Outbound: ${bookingData.flight_outbound}
   Inbound: ${bookingData.flight_inbound}
5. Include all important timings for:
   - Hotel check-in/out
   - Circuit transfers: Use "${bookingData.circuit_transfer_type.replace(/\(.*?\)/g, '').trim()}"
   - Airport transfers
   - Flight times
   - Event sessions
   - Meals
6. Add any important notes or reminders after the relevant activity
7. Use clear, concise language
8. Separate each day with a blank line

Booking Details:
Event: ${bookingData.event_name}
Dates: ${bookingData.check_in_date} to ${bookingData.check_out_date}
Hotel: ${bookingData.hotel_name}
Flight Details: 
  Outbound: ${bookingData.flight_outbound}
  Inbound: ${bookingData.flight_inbound}
Transfers: 
  Airport: ${bookingData.airport_transfer_type}
  Circuit: ${bookingData.circuit_transfer_type}
Number of Travelers: ${bookingData.adults}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error('No response generated from Gemini API');
    }

    // Store the generated itinerary
    try {
      await storeItinerary(bookingData.booking_id, response.text);
    } catch (error) {
      console.warn('Failed to store itinerary:', error);
      // Continue even if storage fails
    }

    return response.text;
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw error;
  }
};

// Function to store an itinerary
export const storeItinerary = async (bookingId, itinerary) => {
  try {
    const response = await api.post('/itineraries', {
      booking_id: bookingId,
      content: itinerary,
      generated_at: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    console.error('Error storing itinerary:', error);
    // Return a mock response for now
    return {
      id: Date.now().toString(),
      booking_id: bookingId,
      content: itinerary,
      generated_at: new Date().toISOString()
    };
  }
};

// Function to get an itinerary by booking ID
export const getItinerary = async (bookingId) => {
  try {
    const response = await api.get(`/itineraries/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error retrieving itinerary:', error);
    // Return null instead of throwing error
    return null;
  }
};

// Function to get all itineraries for a booking
export const getBookingItineraries = async (bookingId) => {
  try {
    const response = await api.get(`/itineraries/booking/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error retrieving booking itineraries:', error);
    // Return empty array instead of throwing error
    return [];
  }
};

export default api;
