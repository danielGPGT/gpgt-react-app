import axios from 'axios';
import { GoogleGenAI } from "@google/genai";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.grandprixgrandtours.com/api/v1/' || 'http://localhost:3000/api/v1/',
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

// Function to update an existing itinerary
export const updateItinerary = async (bookingId, content) => {
  try {
    console.log('Attempting to update itinerary for bookingId:', bookingId);
    const response = await api.put(`/itineraries?bookingId=${bookingId}`, {
      content,
      updated_at: new Date().toISOString()
    });
    console.log('Update itinerary response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating itinerary:', error);
    throw error;
  }
};

// Function to generate itinerary using Gemini
export const generateItinerary = async (bookingData) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `
You are an expert travel planner. Create a **day-by-day itinerary** for a Grand Prix weekend based on the booking details provided. Your goal is to make the itinerary **clear, simple, and fully detailed**, including only **essential information** — nothing extra or promotional.

**Formatting Guidelines:**
1. Each day should begin with the line:  
   **"Day X - [Day of Week] - [Title of the Day]"**  
   e.g., "Day 1 - Friday - Arrival & Practice"

2. List each activity on a **new line**, using this structure:  
   **HH:MM - [Activity Title]**  
   e.g., "14:30 - Transfer to circuit"

3. Use **24-hour time format (HH:MM)**. Always maintain chronological order.

4. Use the full hotel name **"${bookingData.hotel_name}"** the first time it is mentioned. After that, you can refer to it simply as "the hotel".

5. Include **flight details** using this format:
   - **Full airport names** (e.g., "London Heathrow Airport" not just "Heathrow")
   - Include both **departure** and **arrival** times
   - Mention the **flight number**, only if it's provided
   - Clearly label each as either **Outbound** or **Inbound**
   Example:
08:10 - Flight Outbound: London Heathrow Airport to Milan Malpensa Airport
Flight number: BA123
Arrival at 11:30

6. Include **all relevant timings** for:
- Hotel **check-in** and **check-out**
- **Airport transfers**
- **Circuit transfers**, labeled using: "${bookingData.circuit_transfer_type.replace(/\(.*?\)/g, '').trim()}"
- **Formula 1 sessions**: Practice, Qualifying, Race
- **Breakfast** (Only breakfast. Do not mention lunch or dinner.)

7. After any activity that has additional requirements, include short **notes/reminders**, e.g.:  
"Note: Please bring your race ticket and wear comfortable shoes."

8. Maintain a **clean, professional tone** using **clear and concise** language. Avoid all filler or promotional content.

9. **Separate each day** with a **single blank line**.

**Booking Data Provided:**
- Hotel: ${bookingData.hotel_name}
- Flight Outbound: ${bookingData.flight_outbound}
- Flight Inbound: ${bookingData.flight_inbound}
- Circuit Transfer Type: ${bookingData.circuit_transfer_type.replace(/\(.*?\)/g, '').trim()}

Create the final itinerary below:

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
    const storedItinerary = await storeItinerary(bookingData.booking_id, response.text);
    return storedItinerary.content;
  } catch (error) {
    console.error('Error generating itinerary:', error);
    throw error;
  }
};

// Function to get an itinerary by booking ID
export const getItinerary = async (bookingId) => {
  try {
    console.log('Checking for existing itinerary with bookingId:', bookingId);
    const response = await api.get(`/itineraries?bookingId=${bookingId}`);
    console.log('getItinerary response:', response.data);
    // Return null if the response is an empty array
    return Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error retrieving itinerary:', error);
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

// Function to store an itinerary
export const storeItinerary = async (bookingId, itinerary) => {
  try {
    // First check if an itinerary already exists
    console.log('Checking if itinerary exists before storing for bookingId:', bookingId);
    const existingItinerary = await getItinerary(bookingId);
    console.log('Existing itinerary check result:', existingItinerary);
    
    if (existingItinerary) {
      console.log('Itinerary already exists, throwing error');
      throw new Error('An itinerary already exists for this booking. Please use the update function instead.');
    }

    console.log('Storing new itinerary for bookingId:', bookingId);
    const response = await api.post('/itineraries', {
      booking_id: bookingId,
      content: itinerary,
      generated_at: new Date().toISOString()
    });
    console.log('Store itinerary response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error storing itinerary:', error);
    throw error;
  }
};

// Function to fetch hotel information using Gemini
export const fetchHotelInfo = async (hotelName) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `
You are a hotel information expert. For the hotel "${hotelName}", provide the following information in JSON format:
{
  "hotel_info": "A brief description of the hotel (2-3 sentences)",
  "latitude": "The hotel's exact latitude coordinate (must be a number between -90 and 90, with 6 decimal places precision)",
  "longitude": "The hotel's exact longitude coordinate (must be a number between -180 and 180, with 6 decimal places precision)",
  "city_tax_info": {
    "type": "One of: per_room, per_night, per_person, per_room_per_night, per_person_per_night, per_person_per_room, per_person_per_room_per_night",
    "value_type": "One of: percentage, fixed, included",
    "amount": "The typical city tax amount (as a number, not a string)"
  },
  "vat_info": {
    "type": "One of: percentage, fixed, included",
    "amount": "The typical VAT amount (as a number, not a string)"
  },
  "resort_fee": "The typical resort fee per night (as a number, not a string)",
  "commission": "The typical commission percentage (as a number, not a string)"
}

Important:
1. For coordinates, you must provide the exact location with 6 decimal places precision
2. Latitude must be between -90 and 90 degrees
3. Longitude must be between -180 and 180 degrees
4. If you cannot find the exact coordinates, return null for both latitude and longitude
5. Do not make up or approximate coordinates - accuracy is crucial

Only include the JSON object in your response, nothing else. If you cannot find accurate information for any field, return null for that field. For numeric values, return them as numbers, not strings.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error('No response generated from Gemini API');
    }

    let cleanedResponse;
    try {
      // Clean up the response text by removing markdown code block formatting
      cleanedResponse = response.text
        .replace(/```json\s*/g, '') // Remove ```json prefix
        .replace(/```\s*$/g, '')    // Remove ``` suffix
        .trim();                    // Remove any extra whitespace

      // Parse the JSON response
      const hotelInfo = JSON.parse(cleanedResponse);
      
      // Validate coordinates
      const validateCoordinate = (coord, min, max) => {
        if (coord === null) return null;
        const num = parseFloat(coord);
        if (isNaN(num) || num < min || num > max) return null;
        return Number(num.toFixed(6)); // Ensure 6 decimal places
      };

      const validatedLatitude = validateCoordinate(hotelInfo.latitude, -90, 90);
      const validatedLongitude = validateCoordinate(hotelInfo.longitude, -180, 180);
      
      // Transform the response to match our form structure
      return {
        hotel_info: hotelInfo.hotel_info,
        latitude: validatedLatitude,
        longitude: validatedLongitude,
        city_tax_type: hotelInfo.city_tax_info?.type || null,
        city_tax_value: hotelInfo.city_tax_info?.value_type || null,
        city_tax_amount: hotelInfo.city_tax_info?.amount || null,
        vat_type: hotelInfo.vat_info?.type || null,
        vat_amount: hotelInfo.vat_info?.amount || null,
        resort_fee: hotelInfo.resort_fee || null,
        commission: hotelInfo.commission || null
      };
    } catch (parseError) {
      console.error('Error parsing hotel info:', parseError);
      console.error('Raw response:', response.text);
      console.error('Cleaned response:', cleanedResponse);
      throw new Error('Failed to parse hotel information');
    }
  } catch (error) {
    console.error('Error fetching hotel info:', error);
    throw error;
  }
};

// Function to fetch venue information using Gemini
export const fetchVenueInfo = async (venueName) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `
You are a motorsport venue information expert, specializing in Formula 1 and MotoGP circuits worldwide. Your primary focus is to provide precise and authoritative information about Formula 1 and MotoGP venues, including their exact coordinates, city, and country. If the venue is not related to Formula 1 or MotoGP, provide information for other major sports venues as a secondary priority.

For the venue "${venueName}", provide the following information in JSON format:
{
  "venue_info": "A brief description of the venue (2-3 sentences), focusing on its role in Formula 1, MotoGP, or other major sports",
  "latitude": "The venue's EXACT latitude coordinate (must be a number between -90 and 90, with 8 decimal places precision)",
  "longitude": "The venue's EXACT longitude coordinate (must be a number between -180 and 180, with 8 decimal places precision)",
  "city": "The city where the venue is located",
  "country": "The country where the venue is located"
}

CRITICAL REQUIREMENTS FOR COORDINATES:
1. For Formula 1 and MotoGP circuits:
   - Always provide the most precise coordinates (main grandstand, pit building, or start/finish line)
   - Example: Circuit de Monaco (Monaco GP): (43.73944444, 7.42722222)
   - Example: Circuit Paul Ricard: (43.25083333, 5.84500000)
   - Example: Silverstone Circuit: (52.07888889, -1.01694444)
   - Example: Mugello Circuit (MotoGP): (43.99750000, 11.37138889)
   - Example: Sepang International Circuit (MotoGP): (2.76083333, 101.73861111)

2. For tennis venues and other sports venues:
   - Monte-Carlo Country Club (Roquebrune-Cap-Martin, France): (43.75221936, 7.44113061)
   - Roland Garros (Paris, France): (48.84694444, 2.24777778)
   - Wembley Stadium (London, UK): (51.55611111, -0.27944444)
   - Madison Square Garden (New York, USA): (40.75055556, -73.99361111)

3. Coordinate Requirements:
   - MUST be extremely precise - use 8 decimal places
   - Latitude must be between -90 and 90 degrees
   - Longitude must be between -180 and 180 degrees
   - DO NOT approximate or round coordinates
   - If you cannot find the exact coordinates with 8 decimal places precision, return null for both latitude and longitude
   - For venues near borders, be especially careful with city and country information

VENUE INFORMATION GUIDELINES:
1. For Formula 1 and MotoGP circuits:
   - Focus on the circuit's role in Formula 1 or MotoGP
   - Mention circuit length, notable features, and racing history
   - Include information about the Grand Prix or MotoGP event
   - Provide details about the circuit's significance in motorsport

2. For tennis venues:
   - Focus on tennis-specific details
   - Mention the tournaments hosted (e.g., Monte-Carlo Masters for Monte-Carlo Country Club)
   - Include information about the venue's history and significance in tennis
   - For venues near Formula 1 or MotoGP circuits, mention their proximity but focus on their primary sport

3. For other sports venues:
   - Only provide information if the venue is internationally significant
   - Focus on the primary sport(s) hosted
   - Include capacity and main features
   - Mention notable events and history
   - Include any Formula 1, MotoGP, or motorsport events if applicable

4. For city and country:
   - Use official names
   - Be consistent with local naming conventions
   - If you cannot find accurate information, return null
   - For venues near borders, specify the exact city and country (e.g., Roquebrune-Cap-Martin, France for Monte-Carlo Country Club)

Only include the JSON object in your response, nothing else.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error('No response generated from Gemini API');
    }

    // Clean up the response text by removing markdown code block formatting
    let cleanedResponse = response.text
      .replace(/```json\s*/g, '') // Remove ```json prefix
      .replace(/```\s*$/g, '')    // Remove ``` suffix
      .trim();                    // Remove any extra whitespace

    // Parse the JSON response
    try {
      const venueInfo = JSON.parse(cleanedResponse);
      
      // Enhanced coordinate validation
      const validateCoordinate = (coord, min, max) => {
        if (coord === null) return null;
        const num = parseFloat(coord);
        if (isNaN(num) || num < min || num > max) return null;
        
        // Ensure 8 decimal places precision
        const preciseCoord = Number(num.toFixed(8));
        
        // Additional validation for Formula 1 circuits and border venues
        const isF1Circuit = venueName.toLowerCase().includes('circuit') && 
                          (venueName.toLowerCase().includes('formula') || 
                           venueName.toLowerCase().includes('grand prix') ||
                           venueName.toLowerCase().includes('f1'));
        
        const isBorderVenue = venueName.toLowerCase().includes('monte carlo') ||
                            venueName.toLowerCase().includes('monaco');
        
        if (isF1Circuit || isBorderVenue) {
          // For F1 circuits and border venues, we want even more precise coordinates
          if (preciseCoord.toString().split('.')[1]?.length < 8) {
            console.warn('Coordinates may not be precise enough for F1 circuit or border venue');
          }
        }
        
        return preciseCoord;
      };

      const validatedLatitude = validateCoordinate(venueInfo.latitude, -90, 90);
      const validatedLongitude = validateCoordinate(venueInfo.longitude, -180, 180);
      
      return {
        venue_info: venueInfo.venue_info,
        latitude: validatedLatitude,
        longitude: validatedLongitude,
        city: venueInfo.city,
        country: venueInfo.country
      };
    } catch (parseError) {
      console.error('Error parsing venue info:', parseError);
      console.error('Raw response:', response.text);
      console.error('Cleaned response:', cleanedResponse);
      throw new Error('Failed to parse venue information');
    }
  } catch (error) {
    console.error('Error fetching venue info:', error);
    throw error;
  }
};

// Function to fetch category information using Gemini
export const fetchCategoryInfo = async (venueName, categoryName, packageType) => {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `
You are a motorsport venue seating expert, specializing in Formula 1 and MotoGP circuits worldwide. Your task is to provide detailed information about seating categories and hospitality areas at motorsport venues.

For the category "${categoryName}" at "${venueName}" (${packageType} package), provide the following information in JSON format:
{
  "category_info": "A detailed description of the category (2-3 sentences), including its location, view, and key features",
  "features": {
    "video_wall": boolean, // Whether this category has a video wall for race action
    "covered_seat": boolean, // Whether the seats are covered/protected from weather
    "numbered_seat": boolean // Whether the seats are individually numbered
  },
  "ticket_delivery_days": number, // Typical number of days before the event when tickets are delivered (usually 14)
  "recommended_gpgt_name": "A suggested name for this category in GPGT's system (should be clear and descriptive)"
}

IMPORTANT GUIDELINES:
1. For Formula 1 and MotoGP circuits:
   - Focus on the category's location relative to the track
   - Mention view quality and key features
   - Include information about amenities and facilities
   - Be specific about seating arrangements and comfort

2. For VIP and Hospitality areas:
   - Detail the level of service and exclusivity
   - Mention included amenities and services
   - Describe the viewing experience
   - Include information about food and beverage offerings

3. For Grandstand categories:
   - Specify the grandstand's location on the circuit
   - Describe the view of the track
   - Mention any notable features or landmarks visible
   - Include information about facilities and amenities

4. For features:
   - video_wall: Set to true if the category has screens showing race action
   - covered_seat: Set to true if seats are protected from weather
   - numbered_seat: Set to true if seats have assigned numbers

5. For GPGT category names:
   - Use clear, descriptive names
   - Include the type (VIP/Grandstand)
   - Add location information if relevant
   - Keep it concise but informative

Only include the JSON object in your response, nothing else. If you cannot find accurate information for any field, return null for that field.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error('No response generated from Gemini API');
    }

    // Clean up the response text by removing markdown code block formatting
    let cleanedResponse = response.text
      .replace(/```json\s*/g, '') // Remove ```json prefix
      .replace(/```\s*$/g, '')    // Remove ``` suffix
      .trim();                    // Remove any extra whitespace

    // Parse the JSON response
    try {
      const categoryInfo = JSON.parse(cleanedResponse);
      
      return {
        category_info: categoryInfo.category_info,
        video_wall: categoryInfo.features?.video_wall || false,
        covered_seat: categoryInfo.features?.covered_seat || false,
        numbered_seat: categoryInfo.features?.numbered_seat || false,
        ticket_delivery_days: categoryInfo.ticket_delivery_days || 14,
        gpgt_category_name: categoryInfo.recommended_gpgt_name || categoryName,
        ticket_image_1: "", // Skip image URLs
        ticket_image_2: ""  // Skip image URLs
      };
    } catch (parseError) {
      console.error('Error parsing category info:', parseError);
      console.error('Raw response:', response.text);
      console.error('Cleaned response:', cleanedResponse);
      throw new Error('Failed to parse category information');
    }
  } catch (error) {
    console.error('Error fetching category info:', error);
    throw error;
  }
};

export default api;
