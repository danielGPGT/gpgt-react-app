import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateItinerary, getItinerary } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ItineraryPDF from "./ItineraryPDF";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ItineraryGenerator({ booking }) {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPDF, setShowPDF] = useState(false);
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState(null);

  useEffect(() => {
    // Load saved itineraries when component mounts
    if (booking?.booking_id) {
      loadSavedItineraries();
    }
  }, [booking?.booking_id]);

  const loadSavedItineraries = async () => {
    try {
      const response = await getItinerary(booking.booking_id);
      if (response) {
        setSavedItineraries([response]);
        setSelectedItinerary(response);
        setItinerary(response.content);
      }
    } catch (error) {
      console.error('Failed to load saved itineraries:', error);
    }
  };

  const handleGenerateItinerary = async () => {
    try {
      setLoading(true);
      setError(null);
      const generatedItinerary = await generateItinerary(booking);
      setItinerary(generatedItinerary);
      setShowPDF(true);
      toast.success('Itinerary generated successfully!');
      // Reload saved itineraries after generating a new one
      await loadSavedItineraries();
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
      setError(error.message || 'Failed to generate itinerary. Please try again.');
      toast.error(error.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleItinerarySelect = (itineraryId) => {
    const selected = savedItineraries.find(i => i.id === itineraryId);
    if (selected) {
      setSelectedItinerary(selected);
      setItinerary(selected.content);
      setShowPDF(true);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Travel Itinerary</span>
            <div className="flex items-center gap-2">
              {savedItineraries.length > 0 && (
                <Select
                  value={selectedItinerary?.id}
                  onValueChange={handleItinerarySelect}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select saved itinerary" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedItineraries.map((itinerary) => (
                      <SelectItem key={itinerary.id} value={itinerary.id}>
                        {new Date(itinerary.generated_at).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button 
                onClick={handleGenerateItinerary}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Itinerary'
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive text-sm">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
              <p className="mt-2">Please make sure your OpenAI API key is configured correctly in your environment variables.</p>
            </div>
          ) : itinerary ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {itinerary.split('\n').map((line, index) => (
                <p key={index} className="mb-2">
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Click the button above to generate a personalized itinerary for this booking.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPDF} onOpenChange={setShowPDF}>
        <DialogContent className="w-[95vw] h-[90vh]">
          <DialogHeader>
            <DialogTitle>Generated Itinerary</DialogTitle>
          </DialogHeader>
          <ItineraryPDF bookingData={booking} itinerary={itinerary} />
        </DialogContent>
      </Dialog>
    </div>
  );
} 