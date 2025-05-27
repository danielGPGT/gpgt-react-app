import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "@/components/ui/button";
import { Maximize2, Search, X, MapPin, Building2, Pencil, Trash2, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";
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
import ReactDOM from 'react-dom/client';

// You'll need to replace this with your actual Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const VenuesMap = ({ 
  venues, 
  onEditVenue, 
  onDeleteVenue, 
  onAddVenue,
  isDeleting,
  venueToDelete,
  setVenueToDelete,
  showDeleteDialog,
  setShowDeleteDialog
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const originalPositionRef = useRef(null);
  const [lng] = useState(16.4875); // Default to Brno
  const [lat] = useState(49.202);
  const [zoom] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState('venues'); // 'venues' or 'locations'
  const [locationResults, setLocationResults] = useState([]);
  const { mode, theme } = useTheme();
  const [currentStyle, setCurrentStyle] = useState(mode === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
  const [isAddingVenue, setIsAddingVenue] = useState(false);
  const [tempMarker, setTempMarker] = useState(null);
  const [isDraggingMarker, setIsDraggingMarker] = useState(false);
  const [showTrashBin, setShowTrashBin] = useState(false);
  const [isOverTrashBin, setIsOverTrashBin] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [draggedMarker, setDraggedMarker] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapboxgl.accessToken) {
      console.error('Mapbox token is missing. Please add VITE_MAPBOX_TOKEN to your environment variables.');
      return;
    }

    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    setIsLoading(true);
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: currentStyle,
      center: [lng, lat],
      zoom: zoom,
      attributionControl: true
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for the map to load before adding markers
    map.current.on('load', () => {
      setIsLoading(false);
      if (venues?.length) {
        addMarkers();
      }
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [currentStyle]); // Reinitialize map when style changes

  // Add markers whenever venues change
  useEffect(() => {
    if (map.current && !isLoading && venues?.length) {
      addMarkers();
    }
  }, [venues, isLoading]);

  // Update style when mode changes
  useEffect(() => {
    const newStyle = mode === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
    if (newStyle !== currentStyle) {
      setCurrentStyle(newStyle);
      if (map.current) {
        map.current.setStyle(newStyle);
        // Re-add markers after style change
        map.current.on('style.load', () => {
          if (venues?.length) {
            addMarkers();
          }
        });
      }
    }
  }, [mode]);

  const createCustomMarker = () => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    // Get the computed primary color from the root element
    const root = document.documentElement;
    const primaryColor = getComputedStyle(root).getPropertyValue('--primary').trim();
    el.style.backgroundColor = primaryColor;
    el.style.borderColor = getComputedStyle(root).getPropertyValue('--primary-foreground').trim();
    return el;
  };

  const handleDeleteVenue = (venue) => {
    console.log('handleDeleteVenue called with venue:', venue);
    setVenueToDelete(venue);
    setShowDeleteDialog(true);
  };

  const addMarkers = () => {
    console.log('addMarkers called with venues:', venues);
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!venues?.length) return;

    // Create bounds object
    const bounds = new mapboxgl.LngLatBounds();

    // Add markers for each venue
    venues.forEach(venue => {
      console.log('Creating marker for venue:', venue);
      // Create a marker with custom element
      const marker = new mapboxgl.Marker({
        element: createCustomMarker(),
        draggable: true
      })
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(map.current);

      // Create tooltip container
      const tooltipContainer = document.createElement('div');
      tooltipContainer.className = 'marker-tooltip-container';
      marker.getElement().appendChild(tooltipContainer);

      // Render tooltip using React
      const tooltipRoot = ReactDOM.createRoot(tooltipContainer);
      tooltipRoot.render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full h-full" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium text-primary-foreground text-sm">{venue.venue_name}</p>
              <p className="text-primary-foreground">{venue.city}, {venue.country}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      // Add click handler to open edit form
      marker.getElement().addEventListener('click', () => {
        onEditVenue(venue);
      });

      // Add drag handlers
      marker.on('dragstart', () => {
        console.log('Marker dragstart:', venue);
        setDraggedMarker(marker);
        originalPositionRef.current = { lng: venue.longitude, lat: venue.latitude };
        setShowTrashBin(true);
      });

      marker.on('drag', () => {
        // Check if marker is over trash bin
        const markerElement = marker.getElement();
        const markerRect = markerElement.getBoundingClientRect();
        const trashBinElement = document.getElementById('trash-bin');
        if (trashBinElement) {
          const trashBinRect = trashBinElement.getBoundingClientRect();
          const isOver = !(
            markerRect.right < trashBinRect.left ||
            markerRect.left > trashBinRect.right ||
            markerRect.bottom < trashBinRect.top ||
            markerRect.top > trashBinRect.bottom
          );
          if (isOver !== isOverTrashBin) {
            console.log('Marker isOverTrashBin changed:', isOver);
          }
          setIsOverTrashBin(isOver);
        }
      });

      marker.on('dragend', () => {
        console.log('Marker dragend:', { venue, isOverTrashBin });
        if (isOverTrashBin) {
          console.log('Triggering delete for venue:', venue);
          handleDeleteVenue(venue);
        } else {
          console.log('Snapping marker back to original position:', originalPositionRef.current);
          marker.setLngLat(originalPositionRef.current);
        }
        setDraggedMarker(null);
        originalPositionRef.current = null;
        setShowTrashBin(false);
        setIsOverTrashBin(false);
      });

      markersRef.current.push(marker);
      bounds.extend([venue.longitude, venue.latitude]);
    });

    // Fit map to show all markers
    if (venues.length > 1) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredVenues([]);
      setLocationResults([]);
      setShowResults(false);
      return;
    }

    if (searchType === 'venues') {
      const searchTerm = query.toLowerCase();
      const filtered = venues.filter(venue => 
        venue.venue_name.toLowerCase().includes(searchTerm) ||
        venue.city.toLowerCase().includes(searchTerm) ||
        venue.country.toLowerCase().includes(searchTerm)
      );

      setFilteredVenues(filtered);
      setLocationResults([]);
      setShowResults(true);
    } else {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          setLocationResults(data.features);
          setFilteredVenues([]);
          setShowResults(true);
        } else {
          setLocationResults([]);
          setShowResults(false);
        }
      } catch (error) {
        toast.error('Failed to search location');
        setLocationResults([]);
        setShowResults(false);
      }
    }
  };

  const handleVenueSelect = (venue) => {
    map.current.flyTo({
      center: [venue.longitude, venue.latitude],
      zoom: 12,
      essential: true
    });

    // Find and open the popup for the selected venue
    const marker = markersRef.current.find(m => 
      m.getLngLat().lng === venue.longitude && 
      m.getLngLat().lat === venue.latitude
    );
    
    if (marker) {
      marker.togglePopup();
    }

    setSearchQuery('');
    setFilteredVenues([]);
    setShowResults(false);
  };

  const handleLocationSelect = (location) => {
    const [lng, lat] = location.center;
    map.current.flyTo({
      center: [lng, lat],
      zoom: 12,
      essential: true
    });

    setSearchQuery('');
    setLocationResults([]);
    setShowResults(false);
  };

  const fitBounds = () => {
    if (!venues?.length) return;
    
    const bounds = new mapboxgl.LngLatBounds();
    venues.forEach(venue => {
      bounds.extend([venue.longitude, venue.latitude]);
    });

    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15
    });
  };

  const startAddingVenue = () => {
    setIsAddingVenue(true);
    map.current.getCanvas().style.cursor = 'crosshair';
  };

  const stopAddingVenue = () => {
    setIsAddingVenue(false);
    map.current.getCanvas().style.cursor = '';
    if (tempMarker) {
      tempMarker.remove();
      setTempMarker(null);
    }
  };

  const removeTempMarker = () => {
    if (tempMarker) {
      tempMarker.remove();
      setTempMarker(null);
    }
    setIsDraggingMarker(false);
    setShowTrashBin(false);
    setIsOverTrashBin(false);
    stopAddingVenue();
  };

  const handleTrashBinClick = () => {
    if (isAddingVenue && tempMarker) {
      // Remove temporary marker when adding venue
      removeTempMarker();
    } else if (selectedMarker) {
      // Delete existing venue
      const markerIndex = markersRef.current.indexOf(selectedMarker);
      if (markerIndex !== -1) {
        const venue = venues[markerIndex];
        handleDeleteVenue(venue);
        setSelectedMarker(null);
        setShowTrashBin(false);
      }
    }
  };

  // Add click handler for adding venues
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = async (e) => {
      if (!isAddingVenue) return;

      const { lng, lat } = e.lngLat;

      // Remove previous temporary marker if it exists
      if (tempMarker) {
        tempMarker.remove();
      }

      // Create a temporary marker
      const marker = new mapboxgl.Marker({
        color: '#BE222A',
        draggable: true
      })
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Create tooltip container
      const tooltipContainer = document.createElement('div');
      tooltipContainer.className = 'marker-tooltip-container';
      marker.getElement().appendChild(tooltipContainer);

      // Render tooltip using React
      const tooltipRoot = ReactDOM.createRoot(tooltipContainer);
      tooltipRoot.render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full h-full" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to add venue</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      // Fetch location details using reverse geocoding
      const fetchLocationDetails = async (lng, lat) => {
        try {
          console.log('Fetching location details for:', { lng, lat });
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&types=place,locality,country`
          );
          const data = await response.json();
          console.log('Geocoding response:', data);
          
          if (data.features && data.features.length > 0) {
            let city = '';
            let country = '';
            
            // Find city and country from the features
            data.features.forEach(feature => {
              console.log('Processing feature:', feature);
              if (feature.place_type.includes('place') || feature.place_type.includes('locality')) {
                city = feature.text;
                console.log('Found city:', city);
              } else if (feature.place_type.includes('country')) {
                country = feature.text;
                console.log('Found country:', country);
              }
            });

            console.log('Final location details:', { city, country });
            return { city, country };
          }
        } catch (error) {
          console.error('Error fetching location details:', error);
        }
        return { city: '', country: '' };
      };

      // Update marker position when dragged
      marker.on('dragstart', () => {
        setIsDraggingMarker(true);
        setShowTrashBin(true);
      });

      marker.on('drag', () => {
        // Check if marker is over trash bin
        const markerElement = marker.getElement();
        const markerRect = markerElement.getBoundingClientRect();
        const trashBinElement = document.getElementById('trash-bin');
        if (trashBinElement) {
          const trashBinRect = trashBinElement.getBoundingClientRect();
          const isOver = !(
            markerRect.right < trashBinRect.left ||
            markerRect.left > trashBinRect.right ||
            markerRect.bottom < trashBinRect.top ||
            markerRect.top > trashBinRect.bottom
          );
          setIsOverTrashBin(isOver);
        }
      });

      marker.on('dragend', async () => {
        if (isOverTrashBin) {
          // Remove marker if dropped over trash bin
          removeTempMarker();
          return;
        }

        const newPos = marker.getLngLat();
        console.log('Marker dragged to position:', newPos);
        const { city, country } = await fetchLocationDetails(newPos.lng, newPos.lat);
        console.log('Location details for new position:', { city, country });
        
        const venueData = {
          latitude: newPos.lat,
          longitude: newPos.lng,
          venue_name: '',
          city: city,
          country: country,
          venue_info: ''
        };
        console.log('Calling onAddVenue with data:', venueData);
        onAddVenue(venueData);
        stopAddingVenue();
      });

      setTempMarker(marker);

      // Add click handler to confirm location
      marker.getElement().addEventListener('click', async () => {
        const pos = marker.getLngLat();
        console.log('Marker clicked at position:', pos);
        const { city, country } = await fetchLocationDetails(pos.lng, pos.lat);
        console.log('Location details for clicked position:', { city, country });
        
        const venueData = {
          latitude: pos.lat,
          longitude: pos.lng,
          venue_name: '',
          city: city,
          country: country,
          venue_info: ''
        };
        console.log('Calling onAddVenue with data:', venueData);
        onAddVenue(venueData);
        stopAddingVenue();
      });
    };

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [isAddingVenue, tempMarker]);

  return (
    <div className="relative w-full h-[600px] bg-background rounded-lg overflow-hidden">
      {/* Search and Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fitBounds}
            className="bg-background"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant={isAddingVenue ? "default" : "outline"}
            size="icon"
            onClick={isAddingVenue ? stopAddingVenue : startAddingVenue}
            className="bg-background"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative w-80">
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder={`Search ${searchType === 'venues' ? 'venues' : 'locations'}...`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="bg-background pr-8"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                    >
                      {searchType === 'venues' ? <Building2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSearchType('venues')}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Search Venues
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSearchType('locations')}>
                      <MapPin className="h-4 w-4 mr-2" />
                      Search Locations
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleSearch('')}
                  className="bg-background"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchType === 'venues' ? (
                  filteredVenues.map((venue) => (
                    <button
                      key={venue.venue_id}
                      onClick={() => handleVenueSelect(venue)}
                      className="w-full px-4 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
                    >
                      <div className="font-medium">{venue.venue_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {venue.city}, {venue.country}
                      </div>
                    </button>
                  ))
                ) : (
                  locationResults.map((location, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full px-4 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
                    >
                      <div className="font-medium">{location.text}</div>
                      <div className="text-sm text-muted-foreground">
                        {location.place_name}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '600px' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Add Venue Instructions */}
      {isAddingVenue && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background px-4 py-2 rounded-md shadow-lg">
          Click on the map to place the venue marker, then drag to adjust or click to confirm
        </div>
      )}

      {/* Trash Bin */}
      {showTrashBin && (
        <div 
          id="trash-bin"
          className={`absolute bottom-4 right-4 p-4 rounded-full transition-all duration-200 cursor-pointer ${
            isOverTrashBin 
              ? 'bg-destructive text-destructive-foreground scale-110' 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <Trash className="h-6 w-6" />
          {isOverTrashBin && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-sm whitespace-nowrap">
              Drop to delete
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        console.log('AlertDialog onOpenChange:', { open, venueToDelete });
        setShowDeleteDialog(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the venue
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                console.log('Delete cancelled');
                setVenueToDelete(null);
                setShowDeleteDialog(false);
              }}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log('Delete confirmed for venue:', venueToDelete);
                if (venueToDelete) {
                  console.log('Calling onDeleteVenue with:', venueToDelete);
                  onDeleteVenue(venueToDelete);
                  setVenueToDelete(null);
                  setShowDeleteDialog(false);
                } else {
                  console.warn('No venue to delete!');
                }
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add custom styles for marker tooltip and custom marker */}
      <style jsx>{`
        .marker-tooltip-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .marker-tooltip-container > div {
          width: 100%;
          height: 100%;
          pointer-events: auto;
          cursor: pointer;
        }
        .custom-marker {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default VenuesMap;
