import { useState, useEffect } from "react";
import api from "@/lib/api";
import { v4 as uuidv4 } from 'uuid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Predefined sheet access tags for each role
const ROLE_SHEET_ACCESS = {
  admin: {
    description: "Full access to all sheets",
    sheets: "all" // Special value indicating access to all sheets
  },
  "read-only": {
    description: "Read-only access to public sheets and limited user data",
    sheets: "public,public-user" // Tag for public sheets and limited user data
  },
  "booking-only": {
    description: "Read-only access to public sheets, limited user data, and write access to bookingfile",
    sheets: "public,public-user,booking" // Tags for public, limited user data, and booking sheets
  }
};

// Sheet access tag definitions
const SHEET_ACCESS_TAGS = {
  public: [
    "events",
    "packages",
    "packages-tiers",
    "categories",
    "venues",
    "tickets",
    "rooms",
    "circuit-transfers",
    "airport-transfers",
    "lounge-passes",
    "flights",
    "new-fx",
    "fx-spread",
    "b2b-commission"
  ],
  "public-user": [
    "users" // Limited access to users sheet (only public fields)
  ],
  booking: [
    "bookingfile"
  ],
  admin: [
    "all" // Special tag that grants access to all sheets
  ]
};

// Helper function to get sheets from tags
function getSheetsFromTags(tags) {
  if (!tags) return [];
  if (tags === 'all') return ['all'];
  
  const tagList = tags.split(',').map(tag => tag.trim());
  const sheets = new Set();
  
  tagList.forEach(tag => {
    if (SHEET_ACCESS_TAGS[tag]) {
      SHEET_ACCESS_TAGS[tag].forEach(sheet => sheets.add(sheet));
    }
  });
  
  return Array.from(sheets);
}

// Helper function to get tags from sheets
function getTagsFromSheets(sheets) {
  if (!sheets) return '';
  if (sheets === 'all') return 'all';
  
  const sheetList = sheets.split(',').map(sheet => sheet.trim());
  const tags = new Set();
  
  Object.entries(SHEET_ACCESS_TAGS).forEach(([tag, tagSheets]) => {
    if (sheetList.some(sheet => tagSheets.includes(sheet))) {
      tags.add(tag);
    }
  });
  
  return Array.from(tags).join(',');
}

// Helper function to format date for display
function formatDate(dateString) {
  if (!dateString) return "Never";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    // Format as DD-MM-YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return "Invalid date";
  }
}

// Helper function to format date for API
function formatDateForAPI(dateString) {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    // Format as DD-MM-YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return null;
  }
}

// Helper function to format API key for display
function formatApiKey(apiKey) {
  if (!apiKey) return '';
  // Show first 8 and last 4 characters
  return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
}

export function ApiKeysTable() {
  const [apiKeys, setApiKeys] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [keyToDeactivate, setKeyToDeactivate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newKey, setNewKey] = useState({
    name: "",
    role: "",
    expiry_date: "",
    allowed_sheets: "",
  });
  const [generatedKey, setGeneratedKey] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api_keys");
      setApiKeys(response.data);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      toast.error("Failed to fetch API keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKey.name || !newKey.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const roleConfig = ROLE_SHEET_ACCESS[newKey.role];
      const generatedApiKey = uuidv4();
      const keyData = {
        api_key: generatedApiKey,
        name: newKey.name,
        role: newKey.role,
        status: "active",
        expiry_date: formatDateForAPI(newKey.expiry_date),
        allowed_sheets: roleConfig.sheets,
        created_by: localStorage.getItem('userEmail') || 'admin',
        created_at: formatDateForAPI(new Date().toISOString())
      };

      const response = await api.post("/api_keys", keyData);
      setGeneratedKey(generatedApiKey);
      toast.success("API key created successfully");
      fetchApiKeys();
      setIsCreateDialogOpen(false);
      setNewKey({
        name: "",
        role: "",
        expiry_date: "",
        allowed_sheets: "",
      });
    } catch (error) {
      console.error("Failed to create API key");
      toast.error(error.response?.data?.error || "Failed to create API key");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateKey = async () => {
    if (!keyToDeactivate) return;
    
    setIsLoading(true);
    try {
      await api.put(`/api_keys/${keyToDeactivate}/deactivate`);
      toast.success("API key deactivated successfully");
      fetchApiKeys();
      setIsDeactivateDialogOpen(false);
      setKeyToDeactivate(null);
    } catch (error) {
      console.error("Failed to deactivate API key:", error);
      toast.error(error.response?.data?.error || "Failed to deactivate API key");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setNewKey({
      ...newKey,
      role,
      allowed_sheets: ROLE_SHEET_ACCESS[role]?.sheets || ""
    });
  };

  const renderAllowedSheets = (role, allowedSheets) => {
    if (role === 'admin') return "All sheets";
    if (!allowedSheets) return "No sheets";
    
    const tags = allowedSheets.split(',');
    if (tags.length <= 2) return tags.join(', ');
    return `${tags.length} access tags`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create New API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key with specific permissions and access levels.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label>Name</label>
                <Input
                  value={newKey.name}
                  onChange={(e) =>
                    setNewKey({ ...newKey, name: e.target.value })
                  }
                  placeholder="e.g., Frontend App"
                />
              </div>
              <div className="space-y-2">
                <label>Role</label>
                <Select
                  value={newKey.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_SHEET_ACCESS).map(([role, config]) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)} - {config.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label>Expiry Date (optional)</label>
                <Input
                  type="date"
                  value={newKey.expiry_date}
                  onChange={(e) => {
                    const date = e.target.value;
                    setNewKey({ ...newKey, expiry_date: date });
                  }}
                />
              </div>
              {newKey.role && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold">Access Level:</p>
                  <p className="text-sm mt-1">{ROLE_SHEET_ACCESS[newKey.role].description}</p>
                  <p className="text-sm mt-2">
                    {newKey.role === 'admin' ? (
                      "Full access to all sheets"
                    ) : (
                      <>
                        <span className="font-semibold">Accessible Sheets:</span>
                        <ul className="list-disc list-inside mt-1">
                          {ROLE_SHEET_ACCESS[newKey.role].sheets.split(',').map(sheet => (
                            <li key={sheet}>{sheet}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Key"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {generatedKey && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="font-semibold">New API Key Generated:</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="font-mono text-sm break-all">{generatedKey}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(generatedKey);
                toast.success("API key copied to clipboard");
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Make sure to copy this key now. You won't be able to see it again!
          </p>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Access Level</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : apiKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No API keys found
                </TableCell>
              </TableRow>
            ) : (
              apiKeys.map((key) => (
                <TableRow key={key.api_key}>
                  <TableCell>{key.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatApiKey(key.api_key)}
                  </TableCell>
                  <TableCell className="capitalize">{key.role}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      key.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {key.status}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(key.expiry_date)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {renderAllowedSheets(key.role, key.allowed_sheets)}
                    </div>
                  </TableCell>
                  <TableCell>{key.created_by}</TableCell>
                  <TableCell>{formatDate(key.created_at)}</TableCell>
                  <TableCell>
                    {key.status === "active" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setKeyToDeactivate(key.api_key);
                          setIsDeactivateDialogOpen(true);
                        }}
                        disabled={isLoading}
                      >
                        Deactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this API key? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateKey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                "Deactivate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 