"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Camera, Eye, EyeOff, User, Mail, Shield, Lock, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const roles = ["Admin", "Internal Sales", "Operations", "External B2B"];

function MyAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
    errors: {}
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      try {
        const decoded = jwtDecode(token);
        
        // Get all users and find the matching one
        const response = await api.get('/users');
        const userData = response.data.find(user => user.user_id === decoded.user_id);
        
        if (!userData) {
          throw new Error('User not found');
        }

        console.log('Fetched user data:', userData);
        setUser(userData);
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          phone: userData.phone || "",
        });
        
        // Set avatar preview from user data
        if (userData.avatar) {
          console.log('Setting avatar from user data:', userData.avatar);
          const avatarUrl = `${userData.avatar}`;
          console.log('Avatar URL:', avatarUrl);
          setAvatarPreview(avatarUrl);
        } else {
          console.log('No avatar found in user data');
          setAvatarPreview(null);
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      toast.error("Failed to load user data", {
        duration: 5000,
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    return errors;
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
      errors: {
        ...prev.errors,
        [name]: null // Clear error when user types
      }
    }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        console.log('File too large:', file.size);
        toast.error("File size must be less than 5MB", {
          duration: 5000,
          position: "top-center",
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        console.log('Invalid file type:', file.type);
        toast.error("File must be an image", {
          duration: 5000,
          position: "top-center",
        });
        return;
      }

      // Create preview URL before upload
      const previewUrl = URL.createObjectURL(file);
      console.log('Setting temporary preview URL:', previewUrl);
      setAvatarPreview(previewUrl);
      setAvatarFile(file);
    }
  };

  const resetPasswordForm = () => {
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: '',
      errors: {}
    });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetPasswordForm();
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      console.log('Starting profile update...');

      // Compare current form data with original user data to find changed fields
      console.log('Current form data:', formData);
      console.log('Original user data:', user);
      
      const updates = {
        first_name: formData.first_name !== user.first_name ? formData.first_name : undefined,
        last_name: formData.last_name !== user.last_name ? formData.last_name : undefined,
        email: formData.email !== user.email ? formData.email : undefined,
        phone: formData.phone !== user.phone ? formData.phone : undefined,
      };
      console.log('Fields to update:', updates);

      // Send updates only for changed fields
      const columnMappings = {
        first_name: "First Name",
        last_name: "Last Name",
        email: "Email",
        phone: "Phone"
      };

      let hasUpdates = false;

      // Process profile field updates first
      for (const [field, value] of Object.entries(updates)) {
        if (value !== undefined) {
          console.log(`Updating profile field ${field}:`, value);
          try {
            const response = await api.put(`/users/User ID/${user.user_id}`, {
              column: columnMappings[field],
              value: value
            });
            console.log(`Profile update response for ${field}:`, response.data);
            hasUpdates = true;
          } catch (error) {
            console.error(`Error updating ${field}:`, error);
            throw new Error(`Failed to update ${field}: ${error.message}`);
          }
        }
      }

      // Then process avatar update if there's a new file
      if (avatarFile) {
        console.log('Processing avatar update');
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        
        try {
          const response = await api.post('/upload-avatar', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('Avatar upload response:', response.data);
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          hasUpdates = true;
        } catch (error) {
          console.error('Error uploading avatar:', error);
          throw new Error(`Failed to update avatar: ${error.message}`);
        }
      }

      if (hasUpdates) {
        console.log('All updates completed successfully');
        
        // Refresh user data to get the latest state
        await fetchUserData();
        
        toast.success("Profile updated successfully", {
          duration: 5000,
          position: "top-center",
        });
      } else {
        console.log('No fields to update');
        toast.info("No changes to save", {
          duration: 5000,
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Profile update error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.message || "Failed to update profile. Please try again.", {
        duration: 5000,
        position: "top-center",
      });
    } finally {
      setSaving(false);
      // Clear the avatar file after update attempt
      setAvatarFile(null);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    console.log('Password update started');
    
    // Clear any existing errors
    setPasswordData(prev => ({
      ...prev,
      errors: {}
    }));
    
    let hasErrors = false;
    const errors = {};

    // Validate all fields are present
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      errors.general = "All password fields are required";
      hasErrors = true;
    }
    
    // Validate password match
    if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = "New passwords do not match";
      hasErrors = true;
    }

    // Validate new password strength
    const passwordErrors = validatePassword(passwordData.new_password);
    if (passwordErrors.length > 0) {
      errors.new_password = passwordErrors.join(", ");
      hasErrors = true;
    }

    if (hasErrors) {
      setPasswordData(prev => ({
        ...prev,
        errors
      }));
      return;
    }

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication required. Please log in again.", {
          duration: 5000,
          position: "top-center",
        });
        navigate('/');
        return;
      }

      const requestData = {
        currentPassword: passwordData.current_password,
        newPassword: passwordData.new_password
      };

      try {
        const response = await api.post('/change-password', requestData);

        if (response.data.token) {
          // Update the token in localStorage
          localStorage.setItem('token', response.data.token);
          
          // Show success message
          toast.success("Password updated successfully!", {
            duration: 5000,
            position: "top-center",
          });

          // Refresh user data
          await fetchUserData();

          // Close dialog and reset form
          setIsDialogOpen(false);
          resetPasswordForm();
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        
        if (apiError.response?.status === 401) {
          if (apiError.response.data?.requiresReauth) {
            toast.error("Session expired. Please log in again.", {
              duration: 5000,
              position: "top-center",
            });
            setIsDialogOpen(false);
            localStorage.removeItem('token');
            navigate('/');
            return;
          }
          setPasswordData(prev => ({
            ...prev,
            errors: { current_password: "Current password is incorrect" }
          }));
        } else if (apiError.response?.status === 400) {
          setPasswordData(prev => ({
            ...prev,
            errors: { new_password: apiError.response.data.error || "Invalid password format" }
          }));
        } else {
          toast.error(apiError.response?.data?.error || "Failed to update password. Please try again.", {
            duration: 5000,
            position: "top-center",
          });
        }
      }
    } catch (error) {
      console.error("General error:", error);
      toast.error("An unexpected error occurred. Please try again.", {
        duration: 5000,
        position: "top-center",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordVisibilityToggle = () => {
    setShowPassword(prev => ({ ...prev, current: !prev.current }));
  };

  const handleAvatarDelete = async () => {
    try {
      setSaving(true);
      const response = await api.put(`/users/User ID/${user.user_id}`, {
        column: "avatar",
        value: ""
      });
      console.log('Avatar deletion response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      // Clear avatar preview and file
      setAvatarPreview(null);
      setAvatarFile(null);
      
      // Refresh user data
      await fetchUserData();
      
      toast.success("Profile picture removed successfully", {
        duration: 5000,
        position: "top-center",
      });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error("Failed to remove profile picture. Please try again.", {
        duration: 5000,
        position: "top-center",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20"></div>
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-lg font-medium text-primary">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="flex h-screen w-full mt-6">
        <main className="flex-1 overflow-y-auto w-full">
          

          <div className="w-full max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">Account Settings</h1>
              <p className="text-muted-foreground mt-1.5">
                Manage your account settings and preferences
              </p>
            </div>

            <Card className="w-full">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl">Profile Information</CardTitle>
                <CardDescription>
                  Update your account profile information and preferences
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileUpdate}>
                <CardContent className="space-y-8">
                  {/* Avatar Section */}
                  <div className="flex items-start gap-6 p-5 bg-muted/20 rounded-lg">
                    <div className="relative">
                      <Avatar className="h-20 w-20 ring-2 ring-background">
                        <AvatarImage
                          src={avatarPreview || undefined}
                          alt={`${formData.first_name} ${formData.last_name}`}
                          onError={(e) => {
                            console.error('Error loading avatar:', e);
                            e.target.src = undefined;
                          }}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                          {formData.first_name?.[0]}
                          {formData.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 flex gap-1">
                        <label
                          htmlFor="avatar-upload"
                          className="p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </label>
                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={handleAvatarDelete}
                            disabled={saving}
                            className="p-1.5 bg-destructive text-destructive-foreground rounded-full cursor-pointer hover:bg-destructive/90 transition-colors shadow-sm"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <h3 className="font-medium">Profile Picture</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload a new profile picture. We support JPG, PNG and GIF formats.
                        Maximum file size is 2MB.
                      </p>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Personal Information */}
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-base font-medium mb-5">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="first_name" className="text-sm">First Name</Label>
                          <Input
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            placeholder="Enter your first name"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name" className="text-sm">Last Name</Label>
                          <Input
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            placeholder="Enter your last name"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-medium mb-5">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm">Email Address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Enter your phone number"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>

                    {user?.role && (
                      <div>
                        <h3 className="text-base font-medium mb-5">Role Information</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-base font-medium mb-1">Password</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground font-mono">
                                {showPassword.current ? user?.password || "••••••••" : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={handlePasswordVisibilityToggle}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title={showPassword.current ? "Hide password" : "Show password"}
                              >
                                {showPassword.current ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <AlertDialog open={isDialogOpen} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) {
                              resetPasswordForm();
                              // Reset password visibility when dialog closes
                              setShowPassword(prev => ({ ...prev, current: false }));
                            }
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Change password</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="sm:max-w-[425px]">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Change Password</AlertDialogTitle>
                                <AlertDialogDescription className="mb-4">
                                  Enter your current password and choose a new one. Your new password must be at least 8 characters long and include uppercase, lowercase, and numbers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                {passwordData.errors.general && (
                                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                    {passwordData.errors.general}
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <Label htmlFor="current_password" className="text-sm">Current Password</Label>
                                  <div className="relative">
                                    <Input
                                      id="current_password"
                                      name="current_password"
                                      type={showPassword.current ? "text" : "password"}
                                      value={passwordData.current_password}
                                      onChange={handlePasswordChange}
                                      placeholder="Enter your current password"
                                      required
                                      className={`h-9 ${passwordData.errors.current_password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                      disabled={isUpdating}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                      disabled={isUpdating}
                                    >
                                      {showPassword.current ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                  {passwordData.errors.current_password && (
                                    <p className="text-sm text-destructive">
                                      {passwordData.errors.current_password}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="new_password" className="text-sm">New Password</Label>
                                  <div className="relative">
                                    <Input
                                      id="new_password"
                                      name="new_password"
                                      type={showPassword.new ? "text" : "password"}
                                      value={passwordData.new_password}
                                      onChange={handlePasswordChange}
                                      placeholder="Enter your new password"
                                      required
                                      className={`h-9 ${passwordData.errors.new_password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                      disabled={isUpdating}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                      disabled={isUpdating}
                                    >
                                      {showPassword.new ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                  {passwordData.errors.new_password && (
                                    <p className="text-sm text-destructive">
                                      {passwordData.errors.new_password}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="confirm_password" className="text-sm">Confirm New Password</Label>
                                  <div className="relative">
                                    <Input
                                      id="confirm_password"
                                      name="confirm_password"
                                      type={showPassword.confirm ? "text" : "password"}
                                      value={passwordData.confirm_password}
                                      onChange={handlePasswordChange}
                                      placeholder="Confirm your new password"
                                      required
                                      className={`h-9 ${passwordData.errors.confirm_password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                      disabled={isUpdating}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                      disabled={isUpdating}
                                    >
                                      {showPassword.confirm ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                  {passwordData.errors.confirm_password && (
                                    <p className="text-sm text-destructive">
                                      {passwordData.errors.confirm_password}
                                    </p>
                                  )}
                                </div>
                                <AlertDialogFooter className="mt-8">
                                  <AlertDialogCancel 
                                    onClick={resetPasswordForm} 
                                    disabled={isUpdating}
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <Button 
                                    type="submit" 
                                    disabled={isUpdating}
                                  >
                                    {isUpdating ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      "Update Password"
                                    )}
                                  </Button>
                                </AlertDialogFooter>
                              </form>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-4 mt-6">
                  <Button
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Update Profile"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </main>
      </div>
  );
}

export { MyAccount };
