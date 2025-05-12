'use client';

import { useEffect, useState, useMemo } from 'react';
import api from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Search, Filter, ChevronDown, Loader2, CheckCircle2, XCircle, Trash2, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const roles = [
  "Admin",
  "Internal Sales",
  "Operations",
  "External B2B",
];

function UsersTable() {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    company: "all",
  });
  const [sortColumn, setSortColumn] = useState("first_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const usersPerPage = 10;

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/users');
        console.log('API Response:', res.data); // Debug log
        
        // Ensure we have an array of users
        if (!res.data || !Array.isArray(res.data)) {
          console.error('Invalid response format:', res.data);
          throw new Error('Invalid response format');
        }
        
        // Set the users state
        setUsers(res.data);
        console.log('Users state updated:', res.data.length, 'users'); // Debug log
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setError('Failed to load users. Please try again.');
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Get unique companies for filter
  const getUniqueCompanies = () => {
    const uniqueCompanies = [...new Set(users.map((user) => user.company))];
    return uniqueCompanies.filter((company) => company); // Filter out any undefined/null values
  };

  // Filter functions
  const filterUsers = (items) => {
    console.log('Filtering users:', items.length); // Debug log
    return items.filter((user) => {
      // Search filter
      const searchMatch =
        filters.search === "" ||
        Object.values(user).some((val) =>
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );

      // Role filter
      const roleMatch =
        filters.role === "all" || user.role === filters.role;

      // Company filter
      const companyMatch =
        filters.company === "all" || user.company === filters.company;

      return searchMatch && roleMatch && companyMatch;
    });
  };

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    console.log('Computing filtered users from:', users.length, 'users'); // Debug log
    let result = filterUsers(users);
    
    // Sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        const aVal = String(a[sortColumn] || '').toLowerCase();
        const bVal = String(b[sortColumn] || '').toLowerCase();
        return sortDirection === "asc" 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }
    
    console.log('Filtered and sorted users:', result.length); // Debug log
    return result;
  }, [users, filters, sortColumn, sortDirection]);

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  console.log('Current page users:', currentUsers.length); // Debug log

  function handleEditClick(user) {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleRoleChange(value) {
    setEditFormData((prev) => ({
      ...prev,
      role: value,
    }));
  }

  async function handleSaveClick(userId) {
    try {
      await api.put(`/users/${userId}`, editFormData);
      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === userId ? { ...user, ...editFormData } : user
        )
      );
      setEditingUserId(null);
      setSuccessMessage("User updated successfully!");
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Failed to save user:', error);
      toast.error("Failed to update user");
    }
  }

  function handleCancelClick() {
    setEditingUserId(null);
    setEditFormData({});
    setIsEditDialogOpen(false);
  }

  async function handleDeleteUser(userId) {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  }

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/users/${userToDelete}`);

      // Update the users state directly
      setUsers((prev) =>
        prev.filter((user) => user.user_id !== userToDelete)
      );

      setSuccessMessage("User deleted successfully!");
      setShowSuccessDialog(true);

      // Clean up states after successful deletion
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  // Add bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(currentUsers.map((user) => user.user_id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedUsers([]); // Clear selection when toggling mode
  };

  // Add bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    setIsBulkDeleting(true);
    try {
      // Delete users one by one
      for (const userId of selectedUsers) {
        await api.delete(`/users/${userId}`);
      }

      setSuccessMessage(
        `${selectedUsers.length} user(s) deleted successfully!`
      );
      setShowSuccessDialog(true);
      setSelectedUsers([]);

      // Refresh the users list
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to delete users:", error);
      toast.error("Failed to delete some users");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Add User Form Component
  const AddUserForm = ({ formData, setFormData, handleSubmit, onCancel, isLoading = false }) => {
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateField = (field, value) => {
      const newErrors = { ...errors };

      switch (field) {
        case "email":
          if (!value || !value.includes('@')) {
            newErrors[field] = "Valid email is required";
          } else {
            delete newErrors[field];
          }
          break;
        case "first_name":
        case "last_name":
          if (!value || value.trim() === "") {
            newErrors[field] = "This field is required";
          } else {
            delete newErrors[field];
          }
          break;
        case "password":
          if (!value || value.length < 8) {
            newErrors[field] = "Password must be at least 8 characters";
          } else {
            delete newErrors[field];
          }
          break;
        default:
          delete newErrors[field];
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleFieldChange = (field, value) => {
      if (validateField(field, value)) {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    };

    const handleFormSubmit = async () => {
      try {
        setIsSubmitting(true);
        await handleSubmit(formData);
        toast.success("User added successfully!");
        onCancel();
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("Failed to add user");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="grid gap-8 py-4">
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">User Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleFieldChange("first_name", e.target.value)}
                  placeholder="Enter first name"
                  disabled={isSubmitting}
                  className={errors.first_name ? "border-destructive" : ""}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleFieldChange("last_name", e.target.value)}
                  placeholder="Enter last name"
                  disabled={isSubmitting}
                  className={errors.last_name ? "border-destructive" : ""}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="Enter email"
                  disabled={isSubmitting}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  placeholder="Enter password"
                  disabled={isSubmitting}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleFieldChange("company", e.target.value)}
                  placeholder="Enter company name"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleFieldChange("role", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="b2b_commission">B2B Commission (%)</Label>
                <Input
                  id="b2b_commission"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.b2b_commission}
                  onChange={(e) => handleFieldChange("b2b_commission", Number(e.target.value))}
                  placeholder="Enter commission percentage"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add User"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Edit User Form Component
  const EditUserForm = ({ formData, setFormData, handleSubmit, onCancel, isLoading = false }) => {
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateField = (field, value) => {
      const newErrors = { ...errors };

      switch (field) {
        case "email":
          if (!value || !value.includes('@')) {
            newErrors[field] = "Valid email is required";
          } else {
            delete newErrors[field];
          }
          break;
        case "first_name":
        case "last_name":
          if (!value || value.trim() === "") {
            newErrors[field] = "This field is required";
          } else {
            delete newErrors[field];
          }
          break;
        default:
          delete newErrors[field];
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleFieldChange = (field, value) => {
      if (validateField(field, value)) {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    };

    const handleFormSubmit = async () => {
      try {
        setIsSubmitting(true);
        await handleSubmit(formData);
        toast.success("User updated successfully!");
        onCancel();
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("Failed to update user");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="grid gap-8 py-4">
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">User Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleFieldChange("first_name", e.target.value)}
                  placeholder="Enter first name"
                  disabled={isSubmitting}
                  className={errors.first_name ? "border-destructive" : ""}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleFieldChange("last_name", e.target.value)}
                  placeholder="Enter last name"
                  disabled={isSubmitting}
                  className={errors.last_name ? "border-destructive" : ""}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="Enter email"
                  disabled={isSubmitting}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleFieldChange("company", e.target.value)}
                  placeholder="Enter company name"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleFieldChange("role", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="b2b_commission">B2B Commission (%)</Label>
              <Input
                id="b2b_commission"
                type="number"
                min="0"
                max="100"
                value={formData.b2b_commission}
                onChange={(e) => handleFieldChange("b2b_commission", Number(e.target.value))}
                placeholder="Enter commission percentage"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update User"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Add User Dialog Component
  const AddUserDialog = ({ isOpen, onOpenChange, isLoading = false }) => {
    const [formData, setFormData] = useState({
      email: "",
      phone: "",
      password: "",
      role: "Internal Sales",
      first_name: "",
      last_name: "",
      company: "",
      b2b_commission: 0,
    });

    const handleSubmit = async (data) => {
      try {
        setIsAdding(true);
        await api.post('/users', data);
        const res = await api.get('/users');
        setUsers(res.data);
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to add user:', error);
        throw error;
      } finally {
        setIsAdding(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Fill in the details for the new user
            </DialogDescription>
          </DialogHeader>
          <AddUserForm
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isLoading={isAdding}
          />
        </DialogContent>
      </Dialog>
    );
  };

  // Edit User Dialog Component
  const EditUserDialog = ({ isOpen, onOpenChange, user, isLoading = false }) => {
    const [formData, setFormData] = useState(user || {});

    useEffect(() => {
      if (user) {
        setFormData(user);
      }
    }, [user]);

    const handleSubmit = async (data) => {
      try {
        setIsEditing(true);
        await api.put(`/users/${user.user_id}`, data);
        const res = await api.get('/users');
        setUsers(res.data);
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to update user:', error);
        throw error;
      } finally {
        setIsEditing(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user's information
            </DialogDescription>
          </DialogHeader>
          <EditUserForm
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isLoading={isEditing}
          />
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20"></div>
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-lg font-medium text-primary">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="flex flex-col items-center gap-2">
          <XCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-medium text-destructive">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-medium text-muted-foreground">No users found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or add a new user</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={filters.role}
          onValueChange={(value) => setFilters({ ...filters, role: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.company}
          onValueChange={(value) => setFilters({ ...filters, company: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {getUniqueCompanies().map((company) => (
              <SelectItem key={company} value={company}>
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <div className="flex items-center gap-2 p-2 justify-between">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="flex items-center gap-2">
                  Sort <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setSortColumn("first_name")}
                  className={sortColumn === "first_name" ? "font-semibold text-primary" : ""}
                >
                  Name {sortColumn === "first_name" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("email")}
                  className={sortColumn === "email" ? "font-semibold text-primary" : ""}
                >
                  Email {sortColumn === "email" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("role")}
                  className={sortColumn === "role" ? "font-semibold text-primary" : ""}
                >
                  Role {sortColumn === "role" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("company")}
                  className={sortColumn === "company" ? "font-semibold text-primary" : ""}
                >
                  Company {sortColumn === "company" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Direction</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setSortDirection("asc")}
                  className={sortDirection === "asc" ? "font-semibold text-primary" : ""}
                >
                  Ascending {sortDirection === "asc" && "▲"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortDirection("desc")}
                  className={sortDirection === "desc" ? "font-semibold text-primary" : ""}
                >
                  Descending {sortDirection === "desc" && "▼"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-muted-foreground">Sorted by <span className="font-medium">{sortColumn}</span> ({sortDirection === "asc" ? "A-Z" : "Z-A"})</span>
          </div>
          <div className="flex gap-4 items-center">
            {isSelectionMode && selectedUsers.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedUsers.length})
                  </>
                )}
              </Button>
            )}
            <Button
              variant={isSelectionMode ? "secondary" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
            >
              {isSelectionMode ? "Cancel Selection" : "Bulk Actions"}
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              {isSelectionMode && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedUsers.length === currentUsers.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4"
                  />
                </TableHead>
              )}
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Login Count</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <TableRow key={user.user_id}>
                  {isSelectionMode && (
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.user_id)}
                        onCheckedChange={(checked) =>
                          handleSelectUser(user.user_id, checked)
                        }
                        aria-label={`Select ${user.first_name}`}
                        className="h-4 w-4"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={`${user.first_name} ${user.last_name}`} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.first_name?.[0]}
                          {user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.first_name} {user.last_name}</div>
                        <div className="text-sm text-muted-foreground">{user.phone || "No phone"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/10">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.company}</TableCell>
                  <TableCell>{user.login_count}</TableCell>
                  <TableCell>{user.last_login}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.user_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setShowDeleteConfirm(false);
            setUserToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          {isDeleting && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-[100]">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-destructive/20"></div>
                  <div className="w-12 h-12 rounded-full border-4 border-destructive border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-lg font-medium text-destructive">
                  Deleting User...
                </p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your request
                </p>
              </div>
            </div>
          )}
          <div className={`${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription className="text-destructive mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-4 h-4 rounded-full border-2 border-white/20"></div>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin absolute top-0 left-0"></div>
                    </div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog
        open={showSuccessDialog}
        onOpenChange={async (open) => {
          if (!open) {
            // When dialog closes, fetch the latest users
            try {
              const res = await api.get("/users");
              setUsers(res.data);
            } catch (error) {
              console.error("Failed to fetch users:", error);
            }
          }
          setShowSuccessDialog(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-success">
              Success
            </AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {selectedUsers.length} selected user(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={isBulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleBulkDelete();
                setShowBulkDeleteDialog(false);
                setIsSelectionMode(false); // Exit selection mode after deletion
              }}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Selected"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Dialog */}
      <AddUserDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        isLoading={isAdding}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={editingUser}
        isLoading={isEditing}
      />
    </div>
  );
}

export { UsersTable };
